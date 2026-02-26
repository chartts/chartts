import { describe, it, expect } from 'vitest'
import { validateData, CharttsError } from '../validate'

describe('validateData', () => {
  it('accepts valid data', () => {
    expect(() => validateData({
      series: [{ name: 'A', values: [1, 2, 3] }],
    })).not.toThrow()
  })

  it('accepts valid data with labels', () => {
    expect(() => validateData({
      labels: ['x', 'y', 'z'],
      series: [{ name: 'A', values: [1, 2, 3] }],
    })).not.toThrow()
  })

  it('throws on null data', () => {
    expect(() => validateData(null as any)).toThrow(CharttsError)
  })

  it('throws on empty series', () => {
    expect(() => validateData({ series: [] })).toThrow('non-empty array')
  })

  it('throws on missing series name', () => {
    expect(() => validateData({
      series: [{ name: '', values: [1] }],
    })).toThrow('non-empty string')
  })

  it('throws on non-array values', () => {
    expect(() => validateData({
      series: [{ name: 'A', values: 'nope' as any }],
    })).toThrow('must be an array')
  })

  it('throws on series length mismatch', () => {
    expect(() => validateData({
      series: [
        { name: 'A', values: [1, 2, 3] },
        { name: 'B', values: [1, 2] },
      ],
    })).toThrow('length mismatch')
  })

  it('throws on non-finite values', () => {
    expect(() => validateData({
      series: [{ name: 'A', values: [1, NaN, 3] }],
    })).toThrow('finite number')
  })

  it('throws on Infinity values', () => {
    expect(() => validateData({
      series: [{ name: 'A', values: [1, Infinity, 3] }],
    })).toThrow('finite number')
  })

  it('throws on labels length mismatch', () => {
    expect(() => validateData({
      labels: ['a', 'b'],
      series: [{ name: 'A', values: [1, 2, 3] }],
    })).toThrow('labels has 2')
  })
})
