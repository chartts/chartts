import { describe, it, expect } from 'vitest'
import { createLinearScale } from '../linear'

describe('LinearScale', () => {
  it('maps domain to range', () => {
    const scale = createLinearScale({ domain: [0, 100], range: [0, 500], nice: false })
    expect(scale.map(0)).toBe(0)
    expect(scale.map(50)).toBe(250)
    expect(scale.map(100)).toBe(500)
  })

  it('handles inverted range', () => {
    const scale = createLinearScale({ domain: [0, 100], range: [500, 0], nice: false })
    expect(scale.map(0)).toBe(500)
    expect(scale.map(100)).toBe(0)
  })

  it('handles zero-width domain', () => {
    const scale = createLinearScale({ domain: [50, 50], range: [0, 500], nice: false })
    expect(scale.map(50)).toBe(250)
  })

  it('inverts pixel to data value', () => {
    const scale = createLinearScale({ domain: [0, 100], range: [0, 500], nice: false })
    expect(scale.invert(0)).toBe(0)
    expect(scale.invert(250)).toBe(50)
    expect(scale.invert(500)).toBe(100)
  })

  it('generates ticks', () => {
    const scale = createLinearScale({ domain: [0, 100], range: [0, 500] })
    const ticks = scale.ticks(5)
    expect(ticks.length).toBeGreaterThanOrEqual(3)
    for (const tick of ticks) {
      expect(tick.position).toBeGreaterThanOrEqual(0)
      expect(tick.position).toBeLessThanOrEqual(500)
      expect(tick.label).toBeTruthy()
    }
  })

  it('nices the domain by default', () => {
    const scale = createLinearScale({ domain: [3, 97], range: [0, 500] })
    const [dMin, dMax] = scale.getDomain()
    expect(dMin as number).toBeLessThanOrEqual(3)
    expect(dMax as number).toBeGreaterThanOrEqual(97)
  })

  it('does not nice when nice=false', () => {
    const scale = createLinearScale({ domain: [3, 97], range: [0, 500], nice: false })
    const [dMin, dMax] = scale.getDomain()
    expect(dMin).toBe(3)
    expect(dMax).toBe(97)
  })

  it('clamps values when clamp=true', () => {
    const scale = createLinearScale({ domain: [0, 100], range: [0, 500], nice: false, clamp: true })
    expect(scale.map(-50)).toBe(0)
    expect(scale.map(200)).toBe(500)
  })

  it('does not clamp by default', () => {
    const scale = createLinearScale({ domain: [0, 100], range: [0, 500], nice: false })
    expect(scale.map(-50)).toBe(-250)
    expect(scale.map(200)).toBe(1000)
  })

  it('uses custom format', () => {
    const scale = createLinearScale({
      domain: [0, 100],
      range: [0, 500],
      format: (v) => `${v}%`,
    })
    const ticks = scale.ticks(5)
    for (const tick of ticks) {
      expect(tick.label).toMatch(/%$/)
    }
  })

  it('setDomain and setRange update the scale', () => {
    const scale = createLinearScale({ domain: [0, 100], range: [0, 500], nice: false })
    scale.setDomain(0, 200)
    scale.setRange(0, 1000)
    expect(scale.map(100)).toBe(500)
    expect(scale.getDomain()).toEqual([0, 200])
    expect(scale.getRange()).toEqual([0, 1000])
  })

  it('handles negative domains', () => {
    const scale = createLinearScale({ domain: [-50, 50], range: [0, 500], nice: false })
    expect(scale.map(0)).toBe(250)
    expect(scale.map(-50)).toBe(0)
    expect(scale.map(50)).toBe(500)
  })

  it('handles large numbers', () => {
    const scale = createLinearScale({ domain: [0, 1_000_000], range: [0, 500], nice: false })
    expect(scale.map(500_000)).toBe(250)
  })

  it('default format abbreviates thousands', () => {
    const scale = createLinearScale({ domain: [0, 10000], range: [0, 500] })
    const ticks = scale.ticks(5)
    const hasK = ticks.some(t => t.label.includes('K'))
    expect(hasK).toBe(true)
  })
})
