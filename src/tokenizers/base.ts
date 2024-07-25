export type TokenId = number

export abstract class Tokenizer {
  /**
   * Vocabulary size.
   */
  abstract get vocabSize(): number

  /**
   * All tokens in the vocabulary as strings
   */
  abstract get vocab(): ReadonlyArray<string>

  /**
   * id of the Beginning of String token
   */
  abstract get bosId(): TokenId

  /**
   * id of the End of String token
   */
  abstract get eosId(): TokenId

  /**
   * String to token ids
   */
  abstract encode(text: string, shouldAddBosToken?: boolean, shouldAddEosToken?: boolean): ReadonlyArray<TokenId>

  /**
   * Token ids to string
   */
  abstract decode(tokensIds: ReadonlyArray<TokenId>): string
}
