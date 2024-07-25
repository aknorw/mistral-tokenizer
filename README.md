# 🌬️ mistral-tokenizer-ts 🌬️

Typescript tokenizer for Mistral models.

**Supported models:**
* `open-mistral-7b`
* `open-mixtral-8x7b`
* `mistral-embed`
* `mistral-small`
* `mistral-large`
* `open-mixtral-8x22b`
* `codestral-22b`
* `mistral-nemo`

## Install

```sh
npm install mistral-tokenizer-ts
```

## Usage

```ts
import { getTokenizerForModel } from 'mistral-tokenizer-ts'

const tokenizer = getTokenizerForModel('open-mistral-7b')

// Encode.
const encoded = tokenizer.encode('Hello world!')

// Decode.
const decoded = tokenizer.decode([1, 22557, 1526])
```

## Tests

```sh
npm run test
```

## Credit

* [`@imoneoi`](https://github.com/imoneoi) for the [initial implementation](https://github.com/imoneoi/mistral-tokenizer)
* [`@dqbd`](https://github.com/dqbd) for the [tiktoken JS port](https://github.com/dqbd/tiktoken/tree/main/js)
* [`@mistralai`](https://github.com/mistralai) for the [Python tokenizers](https://github.com/mistralai/mistral-common)

