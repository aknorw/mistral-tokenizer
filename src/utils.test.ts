import { compact, decodeBase64, groupBy, hexToUtf8Byte, utf8ByteToHex } from './utils'

describe('decodeBase64', () => {
  it('decodes a base64 encoded string correctly', () => {
    const encoded = btoa('Hello World')
    const decoded = decodeBase64(encoded)
    expect(decoded).toBe('Hello World')
  })

  it('throws an error for invalid base64 string', () => {
    const invalidBase64 = 'Invalid@@Base64'
    expect(() => decodeBase64(invalidBase64)).toThrow()
  })

  it('returns an empty string for empty input', () => {
    const decoded = decodeBase64('')
    expect(decoded).toBe('')
  })
})

describe('utf8ByteToHex', () => {
  it('converts typical byte values to hex correctly', () => {
    expect(utf8ByteToHex(0)).toBe('<0x00>')
    expect(utf8ByteToHex(32)).toBe('<0x20>')
    expect(utf8ByteToHex(127)).toBe('<0x7F>')
  })

  it('handles the lowest byte value (0)', () => {
    expect(utf8ByteToHex(0)).toBe('<0x00>')
  })

  it('handles the highest byte value (255)', () => {
    expect(utf8ByteToHex(255)).toBe('<0xFF>')
  })
})

describe('hexToUtf8Byte', () => {
  it('converts valid hexadecimal strings to bytes correctly', () => {
    expect(hexToUtf8Byte('<0x00>')).toBe(0)
    expect(hexToUtf8Byte('<0x1F>')).toBe(31)
    expect(hexToUtf8Byte('<0xFF>')).toBe(255)
  })

  it('handles invalid hexadecimal strings', () => {
    expect(hexToUtf8Byte('not a hex string')).toBeNaN()
    expect(hexToUtf8Byte('<0xG1>')).toBeNaN()
  })

  it('handles hex strings outside the byte range', () => {
    expect(hexToUtf8Byte('<0x100>')).toBe(256)
    expect(hexToUtf8Byte('<0x10FFFF>')).toBe(1114111)
  })

  it('handles empty inputs', () => {
    expect(hexToUtf8Byte('')).toBeNaN()
  })

  it('is case insensitive', () => {
    expect(hexToUtf8Byte('<0XaB>')).toBe(171)
    expect(hexToUtf8Byte('<0XAB>')).toBe(171)
  })
})

describe('compact', () => {
  test('removes undefined values', () => {
    const input = [1, undefined, 2, undefined, 3]
    const output = compact(input)
    expect(output).toEqual([1, 2, 3])
  })

  test('removes null values', () => {
    const input = [1, null, 2, null, 3]
    const output = compact(input)
    expect(output).toEqual([1, 2, 3])
  })

  test('removes false values', () => {
    const input = [1, false, 2, false, 3]
    const output = compact(input)
    expect(output).toEqual([1, 2, 3])
  })

  test('removes mixed falsy values', () => {
    const input = [1, undefined, 2, null, 3, false, 4]
    const output = compact(input)
    expect(output).toEqual([1, 2, 3, 4])
  })

  test('does not remove truthy values', () => {
    const input = [1, 'string', true, {}, [], 3]
    const output = compact(input)
    expect(output).toEqual([1, 'string', true, {}, [], 3])
  })

  test('returns an empty array when all elements are falsy', () => {
    const input = [undefined, null, false]
    const output = compact(input)
    expect(output).toEqual([])
  })

  test('returns an empty array when input is an empty array', () => {
    const input: Array<undefined | null | false> = []
    const output = compact(input)
    expect(output).toEqual([])
  })

  test('handles array with no falsy values', () => {
    const input = [1, 2, 3]
    const output = compact(input)
    expect(output).toEqual([1, 2, 3])
  })

  test('handles array of objects and arrays', () => {
    const input = [{}, [], { key: 'value' }, [1, 2, 3]]
    const output = compact(input)
    expect(output).toEqual([{}, [], { key: 'value' }, [1, 2, 3]])
  })

  test('handles mixed array with various types', () => {
    const input = [1, null, 'string', false, true, undefined, {}, [], 3]
    const output = compact(input)
    expect(output).toEqual([1, 'string', true, {}, [], 3])
  })
})

describe('groupBy', () => {
  test('groups elements by a key', () => {
    const output = groupBy([1.1, 2.2, 3.3, 4.4], Math.floor)
    expect(Array.from(output.entries())).toEqual([
      [1, [1.1]],
      [2, [2.2]],
      [3, [3.3]],
      [4, [4.4]],
    ])
  })

  test('handles empty input', () => {
    const output = groupBy([], Math.floor)
    expect(Array.from(output.entries())).toEqual([])
  })

  test('groups elements with string keys', () => {
    const output = groupBy(['apple', 'banana', 'cherry', 'date'], (value) => value.charAt(0))
    expect(Array.from(output.entries())).toEqual([
      ['a', ['apple']],
      ['b', ['banana']],
      ['c', ['cherry']],
      ['d', ['date']],
    ])
  })

  test('groups elements with mixed keys', () => {
    const output = groupBy([1, 'one', 2, 'two', 3, 'three'], (value) => typeof value)
    expect(Array.from(output.entries())).toEqual([
      ['number', [1, 2, 3]],
      ['string', ['one', 'two', 'three']],
    ])
  })

  test('groups elements with index-based keys', () => {
    const output = groupBy(['a', 'b', 'c', 'd'], (value, index) => index % 2)
    expect(Array.from(output.entries())).toEqual([
      [0, ['a', 'c']],
      [1, ['b', 'd']],
    ])
  })

  test('handles custom key function returning symbols', () => {
    const sym1 = Symbol('group1')
    const sym2 = Symbol('group2')
    const output = groupBy([1, 2, 3, 4], (value) => (value % 2 === 0 ? sym1 : sym2))
    expect(Array.from(output.entries())).toEqual([
      [sym2, [1, 3]],
      [sym1, [2, 4]],
    ])
  })

  test('handles custom key function returning mixed key types', () => {
    const output = groupBy([1, '2', true, false, null, undefined], (value) => typeof value)
    expect(Array.from(output.entries())).toEqual([
      ['number', [1]],
      ['string', ['2']],
      ['boolean', [true, false]],
      ['object', [null]],
      ['undefined', [undefined]],
    ])
  })

  test('handles iterable input', () => {
    const output = groupBy(new Set([1, 2, 3]), (value) => value)
    expect(Array.from(output.entries())).toEqual([
      [1, [1]],
      [2, [2]],
      [3, [3]],
    ])
  })
})
