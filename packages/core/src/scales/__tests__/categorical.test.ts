import { describe, it, expect } from 'vitest'
import { createCategoricalScale } from '../categorical'

describe('CategoricalScale', () => {
  describe('point mode (default)', () => {
    it('maps indices to evenly spaced positions', () => {
      const scale = createCategoricalScale({
        categories: ['A', 'B', 'C'],
        range: [0, 200],
      })
      expect(scale.map(0)).toBe(0)
      expect(scale.map(1)).toBe(100)
      expect(scale.map(2)).toBe(200)
    })

    it('maps category values by lookup', () => {
      const scale = createCategoricalScale({
        categories: ['Jan', 'Feb', 'Mar'],
        range: [0, 200],
      })
      expect(scale.map('Jan')).toBe(0)
      expect(scale.map('Feb')).toBe(100)
      expect(scale.map('Mar')).toBe(200)
    })

    it('centers single category', () => {
      const scale = createCategoricalScale({
        categories: ['Only'],
        range: [0, 200],
      })
      expect(scale.map(0)).toBe(100)
    })

    it('inverts pixel to nearest index', () => {
      const scale = createCategoricalScale({
        categories: ['A', 'B', 'C'],
        range: [0, 200],
      })
      expect(scale.invert(0)).toBe(0)
      expect(scale.invert(90)).toBe(1)
      expect(scale.invert(200)).toBe(2)
    })
  })

  describe('band mode', () => {
    it('positions categories at band centers', () => {
      const scale = createCategoricalScale({
        categories: ['A', 'B', 'C'],
        range: [0, 300],
        band: true,
      })
      expect(scale.map(0)).toBe(50)
      expect(scale.map(1)).toBe(150)
      expect(scale.map(2)).toBe(250)
    })

    it('returns correct bandwidth', () => {
      const scale = createCategoricalScale({
        categories: ['A', 'B', 'C', 'D'],
        range: [0, 400],
        band: true,
      })
      expect(scale.bandwidth()).toBe(100)
    })

    it('inverts pixel to band index', () => {
      const scale = createCategoricalScale({
        categories: ['A', 'B', 'C'],
        range: [0, 300],
        band: true,
      })
      expect(scale.invert(50)).toBe(0)
      expect(scale.invert(150)).toBe(1)
      expect(scale.invert(250)).toBe(2)
    })
  })

  it('generates ticks for all categories', () => {
    const cats = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    const scale = createCategoricalScale({ categories: cats, range: [0, 400] })
    const ticks = scale.ticks()
    expect(ticks).toHaveLength(5)
    expect(ticks.map(t => t.label)).toEqual(cats)
  })

  it('uses custom format', () => {
    const scale = createCategoricalScale({
      categories: [1, 2, 3],
      range: [0, 200],
      format: (v) => `#${v}`,
    })
    const ticks = scale.ticks()
    expect(ticks[0]!.label).toBe('#1')
  })

  it('handles empty categories', () => {
    const scale = createCategoricalScale({ categories: [], range: [0, 200] })
    expect(scale.map(0)).toBe(100)
    expect(scale.bandwidth()).toBe(0)
    expect(scale.ticks()).toEqual([])
  })

  it('handles unknown value gracefully', () => {
    const scale = createCategoricalScale({
      categories: ['A', 'B'],
      range: [0, 200],
    })
    expect(scale.map('Z')).toBe(100) // centers unknown
  })
})
