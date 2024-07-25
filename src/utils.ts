export function decodeBase64(encodedString: string) {
  return atob(encodedString)
}

export function utf8ByteToHex(c: number) {
  const hexValue = c.toString(16).toUpperCase().padStart(2, '0')
  return `<0x${hexValue}>`
}

export function hexToUtf8Byte(hex: string) {
  const strippedHex = hex.replace(/<0x|>/gi, '')
  return parseInt(strippedHex, 16)
}

export function compact<T>(arr: ReadonlyArray<T | undefined | null | false>): ReadonlyArray<T> {
  return arr.filter((x): x is T => Boolean(x))
}

export function groupBy<T, K extends string | number | symbol>(
  iterable: Iterable<T>,
  fn: (value: T, index: number) => K,
): Map<K, ReadonlyArray<T>> {
  const map = new Map<K, Array<T>>()
  let i = 0
  for (const value of iterable) {
    const key = fn(value, i++)
    if (map.has(key)) {
      map.get(key)!.push(value)
    } else {
      map.set(key, [value])
    }
  }
  return map
}
