# 🌬️ mistral-tokenizer-ts 🌬️

Typescript tokenizer for Mistral models.

## Supported models

### Generalist models

* `mistral-large-latest` (points to `mistral-large-2407`)
* `mistral-large-2402`
* `mistral-large-2407`
* `mistral-small-latest` (points to `mistral-small-2402`)
* `mistral-small-2402`
* `open-mistral-nemo` (points to `open-mistral-nemo-2407`)
* `open-mistral-nemo-2407`
* `pixtral-12b` (points to `pixtral-12b-2409`)

### Specialized models

* `codestral-latest` (points to `codestral-2405`)
* `codestral-2405`
* `mistral-embed` (points to `mistral-embed-2312`)
* `mistral-embed-2312`

### Research models

* `open-mistral-7b` (points to `open-mistral-7b-v0.3`)
* `open-mistral-7b-v0.1`
* `open-mistral-7b-v0.2`
* `open-mistral-7b-v0.3`
* `open-mixtral-8x7b` (points to `open-mixtral-8x7b-v0.1`)
* `open-mixtral-8x7b-v0.1`
* `open-mixtral-8x22b` (points to `open-mixtral-8x22b-v0.1`)
* `open-mixtral-8x22b-v0.1`
* `open-codestral-mamba` (points to `open-codestral-mamba-v0.1`)
* `open-codestral-mamba-v0.1`

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

