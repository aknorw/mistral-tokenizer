import { readFileSync } from 'fs'
import { Tiktoken } from 'js-tiktoken'

import { SpecialTokens, TokenizerVersion, isValidTokenizerFunction } from '../commons'
import { compact, groupBy } from '../utils'
import { TokenId, Tokenizer } from './base'

type TekkenConfig = {
  pattern: string
  num_vocab_tokens: number
  default_vocab_size: number
  default_num_special_tokens: number
  version: TokenizerVersion
}

type TekkenMultimodalConfig = {
  image_patch_size: number
  max_image_size: number
}

type TekkenData = {
  config: TekkenConfig
  bpe_ranks: string
  multimodal?: TekkenMultimodalConfig
}

// What to do with special tokens when encoding/decoding.
enum SpecialTokenPolicy {
  IGNORE,
  KEEP,
  RAISE,
}

export class Tekkenizer extends Tokenizer {
  #SPECIAL_TOKENS = [
    '<unk>',
    SpecialTokens.BOS,
    SpecialTokens.EOS,
    SpecialTokens.BEGIN_INST,
    SpecialTokens.END_INST,
    SpecialTokens.BEGIN_TOOLS,
    SpecialTokens.END_TOOLS,
    SpecialTokens.BEGIN_TOOL_RESULTS,
    SpecialTokens.END_TOOL_RESULTS,
    SpecialTokens.TOOL_CALLS,
    SpecialTokens.IMG,
    '<pad>',
    SpecialTokens.IMG_BREAK,
    SpecialTokens.IMG_END,
    SpecialTokens.PREFIX,
    SpecialTokens.MIDDLE,
    SpecialTokens.SUFFIX,
  ]

  public declare vocabSize: Tokenizer['vocabSize']
  public declare vocab: Tokenizer['vocab']

  #specialTokens: ReadonlyArray<string>
  #model: Tiktoken

  constructor(tokenizerFilePath: string, isMultimodal: boolean) {
    super()

    const tokenizerData = <TekkenData>JSON.parse(readFileSync(tokenizerFilePath, 'utf-8'))

    const {
      config: { pattern, default_vocab_size, default_num_special_tokens, version },
      bpe_ranks,
      multimodal,
    } = tokenizerData

    if (!isValidTokenizerFunction(version)) {
      throw new Error(`Invalid tokenizer version: ${version}`)
    }

    if (isMultimodal && !multimodal) {
      throw new Error('Multimodal configuration is required for multimodal tokenizers')
    }

    this.vocabSize = default_vocab_size

    this.#specialTokens = [
      ...this.#SPECIAL_TOKENS,
      // Fill special tokens.
      ...Array.from({ length: default_num_special_tokens - this.#SPECIAL_TOKENS.length }, (_, i) => `<SPECIAL_${i}>`),
    ]

    this.#model = new Tiktoken({
      pat_str: pattern,
      special_tokens: {}, // Special tokens are handled manually.
      bpe_ranks,
    })

    this.vocab = Array.from({ length: default_vocab_size }, (_, i) => this.#idToPiece(i))
  }

  get #numSpecialTokens() {
    return this.#specialTokens.length
  }

  #decodeAll(tokens: ReadonlyArray<TokenId>, tokenPolicy: SpecialTokenPolicy) {
    const decoded: Array<string> = []

    const groupedTokens = groupBy(tokens, (t) => String(t < this.#numSpecialTokens))

    for (const [key, group] of groupedTokens.entries()) {
      const isSpecial = key === 'true'

      if (isSpecial) {
        if (tokenPolicy === SpecialTokenPolicy.RAISE) {
          throw new Error(`Decoding 'tokens' that contain special tokens (${group}) is not allowed.`)
        } else if (tokenPolicy === SpecialTokenPolicy.KEEP) {
          decoded.push(...group.map((t) => this.#specialTokens[t]))
        } else if (tokenPolicy === SpecialTokenPolicy.IGNORE) {
          continue
        }
      } else {
        decoded.push(this.#model.decode(group.map((t) => t - this.#specialTokens.length)))
      }
    }

    return decoded
  }

  #idToPiece(tokenId: TokenId) {
    return this.#decodeAll([tokenId], SpecialTokenPolicy.KEEP)[0]
  }

  get bosId() {
    return this.#SPECIAL_TOKENS.indexOf(SpecialTokens.BOS)
  }

  get eosId() {
    return this.#SPECIAL_TOKENS.indexOf(SpecialTokens.EOS)
  }

  encode(text: string, shouldAddBosToken: boolean = true, shouldAddEosToken: boolean = false) {
    const tokens = this.#model.encode(text).map((t) => t + this.#numSpecialTokens)
    return compact([shouldAddBosToken && this.bosId, ...tokens, shouldAddEosToken && this.eosId])
  }

  decode(tokenIds: ReadonlyArray<TokenId>) {
    const hasBosToken = tokenIds[0] === this.bosId
    return this.#decodeAll(hasBosToken ? tokenIds.slice(1) : tokenIds, SpecialTokenPolicy.RAISE).join('')
  }
}
