import { describe, it, expect } from 'vitest'
import { prepareData } from '../prepare'
import { resolveOptions } from '../../constants'

const defaultOpts = resolveOptions({}, 1)

describe('prepareData', () => {
  it('returns prepared data with bounds', () => {
    const result = prepareData({
      labels: ['A', 'B', 'C'],
      series: [{ name: 'Test', values: [10, 20, 30] }],
    }, defaultOpts)

    expect(result.labels).toEqual(['A', 'B', 'C'])
    expect(result.series).toHaveLength(1)
    expect(result.series[0]!.name).toBe('Test')
    expect(result.bounds.yMin).toBe(10)
    expect(result.bounds.yMax).toBe(30)
  })

  it('auto-generates labels from indices', () => {
    const result = prepareData({
      series: [{ name: 'Test', values: [1, 2, 3] }],
    }, defaultOpts)

    expect(result.labels).toEqual([0, 1, 2])
  })

  it('assigns colors from palette', () => {
    const result = prepareData({
      series: [
        { name: 'A', values: [1] },
        { name: 'B', values: [2] },
      ],
    }, resolveOptions({}, 2))

    expect(result.series[0]!.color).toBeTruthy()
    expect(result.series[1]!.color).toBeTruthy()
    expect(result.series[0]!.color).not.toBe(result.series[1]!.color)
  })

  it('respects user-specified color', () => {
    const result = prepareData({
      series: [{ name: 'A', values: [1], color: '#ff0000' }],
    }, defaultOpts)

    expect(result.series[0]!.color).toBe('#ff0000')
  })

  it('computes correct bounds for multi-series', () => {
    const result = prepareData({
      series: [
        { name: 'A', values: [5, 10, 15] },
        { name: 'B', values: [2, 20, 8] },
      ],
    }, resolveOptions({}, 2))

    expect(result.bounds.yMin).toBe(2)
    expect(result.bounds.yMax).toBe(20)
  })

  it('handles all identical values', () => {
    const result = prepareData({
      series: [{ name: 'A', values: [50, 50, 50] }],
    }, defaultOpts)

    expect(result.bounds.yMin).toBeLessThan(50)
    expect(result.bounds.yMax).toBeGreaterThan(50)
  })

  it('applies forced yMin/yMax', () => {
    const opts = resolveOptions({ yMin: 0, yMax: 100 }, 1)
    const result = prepareData({
      series: [{ name: 'A', values: [30, 50, 70] }],
    }, opts)

    expect(result.bounds.yMin).toBe(0)
    expect(result.bounds.yMax).toBe(100)
  })

  it('defaults series style and fill', () => {
    const result = prepareData({
      series: [{ name: 'A', values: [1] }],
    }, defaultOpts)

    expect(result.series[0]!.style).toBe('solid')
    expect(result.series[0]!.fill).toBe(false)
    expect(result.series[0]!.showPoints).toBe(true)
  })
})
