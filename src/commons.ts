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
  CODESTRAL_2405: 'codestral-2405',
  MISTRAL_EMBED_2312: 'mistral-embed-2312',
  MISTRAL_LARGE_2402: 'mistral-large-2402',
  MISTRAL_LARGE_2407: 'mistral-large-2407',
  MISTRAL_SMALL_2402: 'mistral-small-2402',
  OPEN_CODESTRAL_MAMBA_V01: 'open-codestral-mamba-v0.1',
  OPEN_MISTRAL_7B_V01: 'open-mistral-7b-v0.1',
  OPEN_MISTRAL_7B_V02: 'open-mistral-7b-v0.2',
  OPEN_MISTRAL_7B_V03: 'open-mistral-7b-v0.3',
  OPEN_MISTRAL_NEMO_2407: 'open-mistral-nemo-2407',
  OPEN_MIXTRAL_8X22B_V01: 'open-mixtral-8x22b-v0.1',
  OPEN_MIXTRAL_8X7B_V01: 'open-mixtral-8x7b-v0.1',
  PIXTRAL_12B_2409: 'pixtral-12b-2409',
} as const
export type MistralModel = (typeof MistralModel)[keyof typeof MistralModel]

export const MistralModelAlias = {
  CODESTRAL_LATEST: 'codestral-latest',
  MISTRAL_EMBED: 'mistral-embed',
  MISTRAL_LARGE_LATEST: 'mistral-large-latest',
  MISTRAL_SMALL_LATEST: 'mistral-small-latest',
  OPEN_CODESTRAL_MAMBA: 'open-codestral-mamba',
  OPEN_MISTRAL_7B: 'open-mistral-7b',
  OPEN_MISTRAL_NEMO: 'open-mistral-nemo',
  OPEN_MIXTRAL_8X22B: 'open-mixtral-8x22b',
  OPEN_MIXTRAL_8X7B: 'open-mixtral-8x7b',
  PIXTRAL_12B: 'pixtral-12b',
} as const
export type MistralModelAlias = (typeof MistralModelAlias)[keyof typeof MistralModelAlias]

function isModelAlias(model: unknown): model is MistralModelAlias {
  return Object.values(MistralModelAlias).includes(model as MistralModelAlias)
}

const aliasToModelMap: Record<MistralModelAlias, MistralModel> = {
  [MistralModelAlias.CODESTRAL_LATEST]: MistralModel.CODESTRAL_2405,
  [MistralModelAlias.MISTRAL_EMBED]: MistralModel.MISTRAL_EMBED_2312,
  [MistralModelAlias.MISTRAL_LARGE_LATEST]: MistralModel.MISTRAL_LARGE_2407,
  [MistralModelAlias.MISTRAL_SMALL_LATEST]: MistralModel.MISTRAL_SMALL_2402,
  [MistralModelAlias.OPEN_CODESTRAL_MAMBA]: MistralModel.OPEN_CODESTRAL_MAMBA_V01,
  [MistralModelAlias.OPEN_MISTRAL_7B]: MistralModel.OPEN_MISTRAL_7B_V03,
  [MistralModelAlias.OPEN_MISTRAL_NEMO]: MistralModel.OPEN_MISTRAL_NEMO_2407,
  [MistralModelAlias.OPEN_MIXTRAL_8X22B]: MistralModel.OPEN_MIXTRAL_8X22B_V01,
  [MistralModelAlias.OPEN_MIXTRAL_8X7B]: MistralModel.OPEN_MIXTRAL_8X7B_V01,
  [MistralModelAlias.PIXTRAL_12B]: MistralModel.PIXTRAL_12B_2409,
}

export function getTokenizerVersionForModel(modelOrAlias: MistralModel | MistralModelAlias): TokenizerVersion {
  const model = isModelAlias(modelOrAlias) ? aliasToModelMap[modelOrAlias] : modelOrAlias

  switch (model) {
    case MistralModel.MISTRAL_EMBED_2312:
    case MistralModel.OPEN_MISTRAL_7B_V01:
    case MistralModel.OPEN_MISTRAL_7B_V02:
    case MistralModel.OPEN_MIXTRAL_8X7B_V01:
      return TokenizerVersion.V1

    case MistralModel.MISTRAL_LARGE_2402:
    case MistralModel.MISTRAL_SMALL_2402:
      return TokenizerVersion.V2

    case MistralModel.CODESTRAL_2405:
    case MistralModel.MISTRAL_LARGE_2407:
    case MistralModel.OPEN_CODESTRAL_MAMBA_V01:
    case MistralModel.OPEN_MISTRAL_7B_V03:
    case MistralModel.OPEN_MISTRAL_NEMO_2407:
    case MistralModel.OPEN_MIXTRAL_8X22B_V01:
    case MistralModel.PIXTRAL_12B_2409:
      return TokenizerVersion.V3

    default:
      throw new UnreachableError(model)
  }
}

export function shouldUseTekkenForModel(modelOrAlias: MistralModel | MistralModelAlias): boolean {
  const model = isModelAlias(modelOrAlias) ? aliasToModelMap[modelOrAlias] : modelOrAlias

  switch (model) {
    case MistralModel.OPEN_MISTRAL_NEMO_2407:
    case MistralModel.PIXTRAL_12B_2409:
      return true

    default:
      return false
  }
}

export function isMultimodalModel(modelOrAlias: MistralModel | MistralModelAlias): boolean {
  const model = isModelAlias(modelOrAlias) ? aliasToModelMap[modelOrAlias] : modelOrAlias

  switch (model) {
    case MistralModel.PIXTRAL_12B_2409:
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
  IMG: '[IMG]',
  IMG_BREAK: '[IMG_BREAK]',
  IMG_END: '[IMG_END]',
  PREFIX: '[PREFIX]',
  MIDDLE: '[MIDDLE]',
  SUFFIX: '[SUFFIX]',
} as const
export type SpecialTokens = (typeof SpecialTokens)[keyof typeof SpecialTokens]
