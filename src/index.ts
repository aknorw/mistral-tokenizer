import path from 'path'

import { getTokenizerVersionForModel, MistralModel, shouldUseTekkenForModel, TokenizerVersion } from './commons'
import { UnreachableError } from './errors'
import { Tokenizer } from './tokenizers/base'
import { SentencePieceBPETokenizer } from './tokenizers/sentence_piece'
import { Tekkenizer } from './tokenizers/tekken'

class MistralTokenizer {
  constructor(
    private readonly version: TokenizerVersion,
    private readonly shouldUseTekken: boolean,
  ) {}

  get #tokenizerDataPath() {
    const baseDataPath = path.join(__dirname, '../data')

    switch (this.version) {
      case TokenizerVersion.V1:
      case TokenizerVersion.V2:
        return path.join(baseDataPath, 'bpe', this.version)

      case TokenizerVersion.V3:
        if (this.shouldUseTekken) {
          return path.resolve(baseDataPath, 'tekken/240718.json')
        }

        return path.join(baseDataPath, 'bpe', this.version)

      default:
        throw new UnreachableError(this.version)
    }
  }

  get #tokenizer() {
    if (this.shouldUseTekken) {
      return new Tekkenizer(this.#tokenizerDataPath)
    }

    return new SentencePieceBPETokenizer(this.#tokenizerDataPath)
  }

  encode(...args: Parameters<Tokenizer['encode']>) {
    return this.#tokenizer.encode(...args)
  }

  decode(...args: Parameters<Tokenizer['decode']>) {
    return this.#tokenizer.decode(...args)
  }
}

export function getTokenizer(version: TokenizerVersion, shouldUseTekken: boolean) {
  return new MistralTokenizer(version, shouldUseTekken)
}

export function getTokenizerForModel(model: MistralModel) {
  const tokenizerVersion = getTokenizerVersionForModel(model)
  const shouldUseTekken = shouldUseTekkenForModel(model)

  return getTokenizer(tokenizerVersion, shouldUseTekken)
}

export { MistralModel, TokenizerVersion }
