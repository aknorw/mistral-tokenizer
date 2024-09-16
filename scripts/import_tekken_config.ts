import { writeFile } from 'node:fs/promises'
import path from 'path'

// https://github.com/dqbd/tiktoken/blob/main/scripts/ranks.ts#L157
function compressTiktokenBpe(tiktoken_bpe_file: string) {
  const original = tiktoken_bpe_file
    .split('\n')
    .map((line) => line.trim() && line.split(' '))
    .filter((x): x is Array<string> => !!x && Array.isArray(x))
    .map(([token, rank]) => [token, Number.parseInt(rank, 10)] as const)
    .sort((a, b) => a[1] - b[1])

  const newTokens = original.reduce<Array<{ offset: number; tokens: string[] }>>((memo, item) => {
    if (memo.length === 0) return [{ offset: item[1], tokens: [item[0]] }]
    const lastSplit = memo[memo.length - 1]
    const nextOffset = lastSplit.offset + lastSplit.tokens.length

    if (nextOffset === item[1]) {
      lastSplit.tokens.push(item[0])
      return memo
    }

    return [...memo, { offset: item[1], tokens: [item[0]] }]
  }, [])

  const compressed = newTokens.map((x) => `! ${x.offset} ${x.tokens.join(' ')}`).join('\n')

  // make sure the compressed and the original files are the same
  const tiktokenOld = compressed
    .split('\n')
    .filter(Boolean)
    .reduce<Record<string, number>>((memo, x) => {
      const [, offsetStr, ...tokens] = x.split(' ')
      const offset = Number.parseInt(offsetStr, 10)
      tokens.forEach((token, i) => (memo[token] = offset + i))
      return memo
    }, {})

  function normalizeMap(items: Record<string, number>) {
    return JSON.stringify(
      Object.keys(items)
        .sort()
        .map((key) => [key, items[key]]),
    )
  }

  if (normalizeMap(tiktokenOld) !== normalizeMap(Object.fromEntries(original))) {
    throw new Error('Invalid compression')
  }

  return compressed
}

;(async () => {
  // The first two elements are the Node executable and the script file path.
  // We slice them off to get only the arguments passed to the script.
  const [url, output] = process.argv.slice(2)
  if (!url || !output) {
    throw new Error('Missing arguments.\nUsage: npx ts-node scripts/import_tekken_config.ts <url> <output>')
  }

  const rawData = await fetch(url)
  const jsonData = await rawData.json()

  const maxVocab = jsonData.config.default_vocab_size - jsonData.config.default_num_special_tokens
  const slicedVocab = jsonData.vocab.slice(0, maxVocab)
  const simulatedTiktokenFile = slicedVocab.map((tokenInfo) => `${tokenInfo.token_bytes} ${tokenInfo.rank}`).join('\n')

  await writeFile(
    path.resolve(`./data/tekken/${output}`),
    JSON.stringify({
      config: jsonData.config,
      bpe_ranks: compressTiktokenBpe(simulatedTiktokenFile),
      multimodal: jsonData.multimodal,
    }),
  )
})()
