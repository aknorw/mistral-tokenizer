export class UnreachableError extends Error {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_arg: never) {
    super('This code should never be reached.')
  }
}
