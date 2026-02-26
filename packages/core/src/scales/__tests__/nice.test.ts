import { describe, it, expect } from 'vitest'
import { niceNumber, niceRange, generateTicks } from '../nice'

describe('niceNumber', () => {
  it('rounds to nice values', () => {
    expect(niceNumber(1.2, true)).toBe(1)
    expect(niceNumber(2.5, true)).toBe(2)
    expect(niceNumber(4.5, true)).toBe(5)
    expect(niceNumber(8, true)).toBe(10)
  })

  it('ceils to nice values', () => {
    expect(niceNumber(1.2, false)).toBe(2)
    expect(niceNumber(4.5, false)).toBe(5)
    expect(niceNumber(8, false)).toBe(10)
  })

  it('handles zero', () => {
    expect(niceNumber(0, true)).toBe(0)
    expect(niceNumber(0, false)).toBe(0)
  })

  it('handles large numbers', () => {
    const result = niceNumber(4500, true)
    expect(result).toBe(5000)
  })
})

describe('niceRange', () => {
  it('produces nice min and max', () => {
    const { min, max, spacing } = niceRange(3, 97, 5)
    expect(min).toBeLessThanOrEqual(3)
    expect(max).toBeGreaterThanOrEqual(97)
    expect(spacing).toBeGreaterThan(0)
  })

  it('handles equal min and max', () => {
    const { min, max } = niceRange(50, 50, 5)
    expect(min).toBeLessThan(50)
    expect(max).toBeGreaterThan(50)
  })

  it('handles zero range', () => {
    const { min, max, spacing } = niceRange(0, 0, 5)
    expect(min).toBe(0)
    expect(max).toBe(1)
    expect(spacing).toBeGreaterThan(0)
  })

  it('handles negative ranges', () => {
    const { min, max } = niceRange(-100, -10, 5)
    expect(min).toBeLessThanOrEqual(-100)
    expect(max).toBeGreaterThanOrEqual(-10)
  })
})

describe('generateTicks', () => {
  it('generates ticks between min and max', () => {
    const ticks = generateTicks(0, 100, 20)
    expect(ticks).toEqual([0, 20, 40, 60, 80, 100])
  })

  it('handles single tick when spacing is 0', () => {
    const ticks = generateTicks(5, 5, 0)
    expect(ticks).toEqual([5])
  })

  it('handles decimal spacing', () => {
    const ticks = generateTicks(0, 1, 0.2)
    expect(ticks.length).toBeGreaterThanOrEqual(5)
    expect(ticks[0]).toBe(0)
    expect(ticks[ticks.length - 1]).toBeCloseTo(1)
  })
})
