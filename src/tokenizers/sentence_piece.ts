import { readFileSync } from 'fs'
import path from 'path'

import { SpecialTokens } from '../commons'
import { PriorityQueue } from '../priority_queue'
import { compact, decodeBase64, hexToUtf8Byte, utf8ByteToHex } from '../utils'
import { TokenId, Tokenizer } from './base'

const textDecoder = new TextDecoder('utf-8')
const textEncoder = new TextEncoder()

type TokenNode = {
  origPos: number
  tokenId: number
  prev: TokenNode | null
  next: TokenNode | null
  mergePrio?: number
  mergeToString?: string
  deleted?: boolean
}

export class SentencePieceBPETokenizer extends Tokenizer {
  #vocabById: ReadonlyArray<string>
  #vocabByString: Map<string, TokenId> = new Map<string, TokenId>()
  #merges: Map<string, TokenId>

  constructor(tokenizerFilePath: string) {
    super()

    const vocabularyData = readFileSync(path.resolve(tokenizerFilePath, 'vocab.bin'), 'utf-8')
    this.#vocabById = this.#decodeVocabulary(vocabularyData)

    this.#vocabById.forEach((tokenString, tokenId) => {
      this.#vocabByString.set(tokenString, tokenId)
    })

    const mergesData = readFileSync(path.resolve(tokenizerFilePath, 'merges.bin'), 'utf-8')
    this.#merges = this.#decompressMerges(mergesData)
  }

  #decodeVocabulary(binary: string) {
    const byteArray = Uint8Array.from(decodeBase64(binary), (c) => c.charCodeAt(0))
    return textDecoder.decode(byteArray).split('\n')
  }

  #decompressMerges(binary: string) {
    // Base64 decode binary.
    const byteArrayString = decodeBase64(binary)

    // Convert byteArrayString to byteArray.
    const byteArray = new Uint8Array(byteArrayString.length)
    for (let i = 0; i < byteArrayString.length; i++) {
      byteArray[i] = byteArrayString.charCodeAt(i)
    }

    // Each byte-pair represents a tokenId.
    // Convert byte-pairs to tokenIds (integers between 0 and 32000).
    const tokenIds = []

    for (let i = 0; i < byteArray.length; i += 2) {
      const byte1 = byteArray[i]
      const byte2 = byteArray[i + 1]
      const tokenId = byte1 + (byte2 << 8)
      tokenIds.push(tokenId)
    }

    const merges = new Map<string, TokenId>()

    // Each pair of tokenIds represents a merge.
    for (let i = 0; i < tokenIds.length; i += 2) {
      const id1 = tokenIds[i]
      const id2 = tokenIds[i + 1]
      const mergeIdentifierString = this.#getMergeIdentifierString(id1, id2)
      // Key identifies token pair, value represents merge priority.
      merges.set(mergeIdentifierString, i + 1)
    }

    return merges
  }

  #getMergeByIdentifierString(mergeIdentifierString: string) {
    return this.#merges.get(mergeIdentifierString)
  }

  #mapCharactersToTokenIds(text: string) {
    const tokenIds: Array<TokenId> = []

    // Special "preceding space" added to beginning of prompt.
    // spaces are represented as thick underscore ▁ (id 28705).
    const alteredText = ` ${text}`.replaceAll(' ', '\u2581')

    // We need to use Array.from to iterate over characters in order to support UTF-8 multipoint characters.
    const charArray = Array.from(alteredText)

    // Transform each character to its corresponding token.
    for (const c of charArray) {
      const id = this.#vocabByString.get(c)

      if (id) {
        // Typical case
        tokenIds.push(id)
      } else {
        // Special case where token not found and we have to fallback to byte-level tokens.
        const bytes = textEncoder.encode(c)

        for (const byte of bytes) {
          const hex = this.#vocabByString.get(utf8ByteToHex(byte))

          if (hex) {
            tokenIds.push(hex)
          } else {
            // This is not supposed to happen because the mistral vocabulary has a token corresponding to each byte,
            // but if this happens regardless, let's follow the protocol and tokenize to <UNK> token instead of crashing.
            console.log(
              `Encountered unknown character ${c} (partial UTF-8 byte ${byte} + hex + ${utf8ByteToHex(byte)})`,
            )

            tokenIds[tokenIds.length - 1] = this.#vocabByString.get('<unk>')!
          }
        }
      }
    }

    return tokenIds
  }

  #getMergeIdentifierString(firstTokenId: TokenId, secondTokenId: TokenId) {
    return `${this.vocab[firstTokenId]} ${this.vocab[secondTokenId]}`
  }

  get vocab() {
    return this.#vocabById
  }

  get vocabSize() {
    return this.vocab.length
  }

  get bosId() {
    return this.#vocabByString.get(SpecialTokens.BOS)!
  }

  get eosId() {
    return this.#vocabByString.get(SpecialTokens.EOS)!
  }

  encode(text: string, shouldAddBosToken: boolean = true, shouldAddEosToken: boolean = false) {
    if (text.length === 0) {
      return []
    }

    // Initially each character is transformed to a tokenId, later there will be merges of these.
    const tokenIds = compact([
      shouldAddBosToken && this.bosId,
      ...this.#mapCharactersToTokenIds(text),
      shouldAddEosToken && this.eosId,
    ])

    // Set up priority queue to efficiently iterate merge possibilities in priority order.
    const mergeQueue = new PriorityQueue<TokenNode>((a, b) => {
      if (!a.mergePrio || !b.mergePrio) {
        return false
      }
      return a.mergePrio < b.mergePrio
    })

    const addToMergeQueue = (leftNode: TokenNode) => {
      if (leftNode.next) {
        const mergeIdentifierString = this.#getMergeIdentifierString(leftNode.tokenId, leftNode.next.tokenId)

        // Merge priority is primarily determined by the location of the merge in the "merges" data,
        // secondarily determined by the relative position of the node in the linked list
        // (We want to perform equal merges from left to right).
        const mergeLocation = this.#getMergeByIdentifierString(mergeIdentifierString)

        // If mergeLocation not found in merges, that means this merge is not possible according to vocabulary.
        if (mergeLocation) {
          const mergePrio = mergeLocation + leftNode.origPos / text.length
          leftNode.mergePrio = mergePrio
          leftNode.mergeToString = mergeIdentifierString.replace(' ', '')
          mergeQueue.push(leftNode)
        }
      }
    }

    // Fill merge queue from initial merge possibilities and construct linked list.
    let firstTokenNode: TokenNode = {
      origPos: 0,
      tokenId: tokenIds[0],
      prev: null,
      next: null,
    }

    let prevTokenNode = firstTokenNode
    for (let i = 1; i < tokenIds.length; i++) {
      const currTokenNode = {
        origPos: i,
        tokenId: tokenIds[i],
        prev: prevTokenNode,
        next: null,
      }
      prevTokenNode.next = currTokenNode
      addToMergeQueue(prevTokenNode)
      prevTokenNode = currTokenNode
    }

    // Perform merges in priority order.
    while (!mergeQueue.isEmpty()) {
      const leftOfMerge = mergeQueue.pop()

      // Check that this merge is still possible.
      if (!leftOfMerge || leftOfMerge.deleted || !leftOfMerge.next || leftOfMerge.next.deleted) {
        continue
      }

      // Mark leftOfMerge and rightOfMerge as being deleted, because they are actually being replaced by a merged token.
      leftOfMerge.deleted = true
      leftOfMerge.next.deleted = true

      // It's a little bit more complicated to fix the prev of leftOfMerge.

      if (leftOfMerge.prev) {
        const oldPrev = leftOfMerge.prev
        // Mark oldPrev as deleted, to avoid erroneous merges later (ref to this node might exist in priorityqueue).
        oldPrev.deleted = true
        // Replace oldPrev within the linked list with a copy of itself.
        const newPrev: TokenNode = {
          origPos: oldPrev.origPos,
          tokenId: oldPrev.tokenId,
          prev: oldPrev.prev,
          next: oldPrev.next,
        }

        leftOfMerge.prev = newPrev
        // Update linked list reference of "prev of prev".
        if (newPrev.prev) {
          newPrev.prev.next = newPrev
        } else {
          // If "prev of prev" does not exist, that means newPrev must be the new firstNode.
          firstTokenNode = newPrev
        }
      }

      if (leftOfMerge.mergeToString) {
        const tokenId = this.#vocabByString.get(leftOfMerge.mergeToString)

        if (tokenId) {
          // Create node representing merge result.
          const resultOfMerge: TokenNode = {
            origPos: leftOfMerge.origPos,
            tokenId,
            prev: leftOfMerge.prev,
            next: leftOfMerge.next.next,
          }

          // Consider adding to merge queue: prev--resultOfMerge.
          if (resultOfMerge.prev) {
            resultOfMerge.prev.next = resultOfMerge
            addToMergeQueue(resultOfMerge.prev)
          } else {
            // If prev does not exist then this is the new firstNode.
            firstTokenNode = resultOfMerge
          }

          // Consider adding to merge queue: resultOfMerge--next.
          if (resultOfMerge.next) {
            resultOfMerge.next.prev = resultOfMerge

            addToMergeQueue(resultOfMerge)
          }
        }
      }
    }

    // Get final tokenIds by traversing the linked list.
    const mergedTokenIds: Array<TokenId> = []

    for (
      let currTokenNode: TokenNode | null = firstTokenNode;
      currTokenNode !== null;
      currTokenNode = currTokenNode.next
    ) {
      mergedTokenIds.push(currTokenNode.tokenId)
    }

    return mergedTokenIds
  }

  decode(tokenIds: ReadonlyArray<TokenId>): string {
    const utf8byteVals: Array<number> = []
    const hasBosToken = tokenIds[0] === this.bosId
    const startIndex = hasBosToken ? 1 : 0

    for (let i = startIndex; i < tokenIds.length; i++) {
      const tokenId = tokenIds[i]
      const tokenString = this.vocab[tokenId]

      if (tokenString.startsWith('<0x') && tokenString.endsWith('>')) {
        // Special case.
        const utf8byte = hexToUtf8Byte(tokenString)
        utf8byteVals.push(utf8byte)
      } else {
        // Typical case.
        const utf8bytes = textEncoder.encode(tokenString)
        utf8bytes.forEach((utf8Byte) => utf8byteVals.push(utf8Byte))
      }
    }

    const uint8Array = new Uint8Array(utf8byteVals)
    const decodedString = textDecoder.decode(uint8Array)
    const spacesFixed = decodedString.replaceAll('\u2581', ' ')

    // Note that preceding space must be removed here at string level, not earlier at token level, because multiple consecutive spaces are represented as single token.
    return spacesFixed.slice(1)
  }
}
