import mistralTokenizer from './mistral-tokenizer.js'

// The reason why tests are in mistral_tokenizer.js is that I want to be able to run tests on browser-side too, not only in Node.
// The base64 decoding is done differently in different environments, which is why tests need to run in both browser and Node.
mistralTokenizer.runTests()