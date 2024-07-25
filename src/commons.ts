import { UnreachableError } from './errors'

export const TokenizerVersion = {
  V1: 'v1', // vocab_size = 32000
  V2: 'v2', // vocab_size = 32768 with special control tokens [INST], [\INST]
  V3: 'v3', // vocab_size = 32768 (spm) OR 128000 (tekken) with improved function calling
} as const
export type TokenizerVersion = (typeof TokenizerVersion)[keyof typeof TokenizerVersion]

export const TekkenTokenizerVersion = [TokenizerVersion.V3] as const
export type TekkenTokenizerVersion = (typeof TekkenTokenizerVersion)[number]

export function isValidTokenizerFunction(version: unknown): version is TokenizerVersion {
  return Object.values(TokenizerVersion).includes(version as TokenizerVersion)
}

export const MistralModel = {
  CODESTRAL_22B: 'codestral-22b',
  MISTRAL_EMBED: 'mistral-embed',
  MISTRAL_LARGE: 'mistral-large',
  MISTRAL_NEMO: 'mistral-nemo',
  MISTRAL_SMALL: 'mistral-small',
  OPEN_MITRAL_7B: 'open-mistral-7b',
  OPEN_MIXTRAL_8X22B: 'open-mixtral-8x22b',
  OPEN_MIXTRAL_8X7B: 'open-mixtral-8x7b',
} as const
export type MistralModel = (typeof MistralModel)[keyof typeof MistralModel]

export function getTokenizerVersionForModel(model: MistralModel): TokenizerVersion {
  switch (model) {
    case MistralModel.MISTRAL_EMBED:
    case MistralModel.OPEN_MITRAL_7B:
    case MistralModel.OPEN_MIXTRAL_8X7B:
      return TokenizerVersion.V1

    case MistralModel.MISTRAL_LARGE:
    case MistralModel.MISTRAL_SMALL:
      return TokenizerVersion.V2

    case MistralModel.CODESTRAL_22B:
    case MistralModel.MISTRAL_NEMO:
    case MistralModel.OPEN_MIXTRAL_8X22B:
      return TokenizerVersion.V3

    default:
      throw new UnreachableError(model)
  }
}

export function shouldUseTekkenForModel(model: MistralModel): boolean {
  switch (model) {
    case MistralModel.MISTRAL_NEMO:
      return true

    default:
      return false
  }
}

export const SpecialTokens = {
  BOS: '<s>',
  EOS: '</s>',
  BEGIN_INST: '[INST]',
  END_INST: '[/INST]',
  BEGIN_TOOLS: '[AVAILABLE_TOOLS]',
  END_TOOLS: '[/AVAILABLE_TOOLS]',
  BEGIN_TOOL_RESULTS: '[TOOL_RESULTS]',
  END_TOOL_RESULTS: '[/TOOL_RESULTS]',
  TOOL_CALLS: '[TOOL_CALLS]',
  PREFIX: '[PREFIX]',
  MIDDLE: '[MIDDLE]',
  SUFFIX: '[SUFFIX]',
} as const
export type SpecialTokens = (typeof SpecialTokens)[keyof typeof SpecialTokens]
