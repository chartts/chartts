import { describe, it, expect } from 'vitest'
import { renderToString } from '../src/render/string'
import { defineChartType } from '../src/api/define'
import { CHART_TYPES } from '../src/api/chart-types'
import {
  lineChartType,
  barChartType,
  pieChartType,
  areaChartType,
  scatterChartType,
  sparklineChartType,
} from '../src/api/chart-types'
import { sma, ema, rsi } from '../src/finance/moving-averages'
import { rsi as rsiOsc } from '../src/finance/oscillators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function simpleData(numLabels = 6) {
  const labels = Array.from({ length: numLabels }, (_, i) => `L${i}`)
  return {
    labels,
    series: [{ name: 'S1', values: Array.from({ length: numLabels }, (_, i) => (i + 1) * 10) }],
  }
}

function pieData() {
  return {
    labels: ['A', 'B', 'C', 'D'],
    series: [{ name: 'Values', values: [40, 30, 20, 10] }],
  }
}

// ---------------------------------------------------------------------------
// renderToString produces valid SVG
// ---------------------------------------------------------------------------

describe('renderToString', () => {
  it('produces a string starting with <svg and ending with </svg>', () => {
    const svg = renderToString(lineChartType, simpleData(), { width: 600, height: 400 })
    expect(typeof svg).toBe('string')
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg.endsWith('</svg>')).toBe(true)
  })

  it('includes xmlns attribute for valid SVG', () => {
    const svg = renderToString(lineChartType, simpleData())
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
  })

  it('includes width and height attributes', () => {
    const svg = renderToString(lineChartType, simpleData(), { width: 800, height: 300 })
    expect(svg).toContain('width="800"')
    expect(svg).toContain('height="300"')
  })

  it('includes chart content group', () => {
    const svg = renderToString(lineChartType, simpleData())
    expect(svg).toContain('class="chartts-content"')
  })

  it('produces non-trivial output (> 200 chars)', () => {
    const svg = renderToString(lineChartType, simpleData())
    expect(svg.length).toBeGreaterThan(200)
  })
})

// ---------------------------------------------------------------------------
// CHART_TYPES registry
// ---------------------------------------------------------------------------

describe('CHART_TYPES', () => {
  it('has 50+ entries', () => {
    const count = Object.keys(CHART_TYPES).length
    expect(count).toBeGreaterThanOrEqual(50)
  })

  it('all entries have a type string', () => {
    for (const [name, plugin] of Object.entries(CHART_TYPES)) {
      expect(typeof plugin.type).toBe('string')
      expect(plugin.type.length).toBeGreaterThan(0)
    }
  })

  it('all entries have render and prepareData functions', () => {
    for (const [name, plugin] of Object.entries(CHART_TYPES)) {
      expect(typeof plugin.render).toBe('function')
      expect(typeof plugin.prepareData).toBe('function')
    }
  })
})

// ---------------------------------------------------------------------------
// Various chart types render without throwing
// ---------------------------------------------------------------------------

describe('chart type rendering', () => {
  it('line chart renders without throwing', () => {
    expect(() => renderToString(lineChartType, simpleData())).not.toThrow()
  })

  it('bar chart renders without throwing', () => {
    expect(() => renderToString(barChartType, simpleData())).not.toThrow()
  })

  it('pie chart renders without throwing', () => {
    expect(() => renderToString(pieChartType, pieData())).not.toThrow()
  })

  it('area chart renders without throwing', () => {
    expect(() => renderToString(areaChartType, simpleData())).not.toThrow()
  })

  it('scatter chart renders without throwing', () => {
    expect(() => renderToString(scatterChartType, simpleData())).not.toThrow()
  })

  it('sparkline chart renders without throwing', () => {
    expect(() => renderToString(sparklineChartType, simpleData())).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Financial functions
// ---------------------------------------------------------------------------

describe('financial functions', () => {
  describe('sma', () => {
    it('computes correct SMA for known input', () => {
      // SMA(3) of [2, 4, 6, 8, 10] = [NaN, NaN, 4, 6, 8]
      const result = sma([2, 4, 6, 8, 10], 3)
      expect(result).toHaveLength(5)
      expect(result[0]).toBeNaN()
      expect(result[1]).toBeNaN()
      expect(result[2]).toBeCloseTo(4, 10)   // (2+4+6)/3
      expect(result[3]).toBeCloseTo(6, 10)   // (4+6+8)/3
      expect(result[4]).toBeCloseTo(8, 10)   // (6+8+10)/3
    })

    it('returns all NaN when period > data length', () => {
      const result = sma([1, 2, 3], 5)
      expect(result.every(v => Number.isNaN(v))).toBe(true)
    })
  })

  describe('ema', () => {
    it('first valid value equals SMA seed', () => {
      // EMA(3) of [2, 4, 6, 8, 10]: seed = (2+4+6)/3 = 4
      const result = ema([2, 4, 6, 8, 10], 3)
      expect(result[0]).toBeNaN()
      expect(result[1]).toBeNaN()
      expect(result[2]).toBeCloseTo(4, 10)  // SMA seed
    })

    it('subsequent values use exponential smoothing', () => {
      const result = ema([2, 4, 6, 8, 10], 3)
      // k = 2/(3+1) = 0.5
      // ema[2] = 4 (seed)
      // ema[3] = 8*0.5 + 4*0.5 = 6
      // ema[4] = 10*0.5 + 6*0.5 = 8
      expect(result[3]).toBeCloseTo(6, 10)
      expect(result[4]).toBeCloseTo(8, 10)
    })

    it('returns all NaN when period > data length', () => {
      const result = ema([1, 2], 5)
      expect(result.every(v => Number.isNaN(v))).toBe(true)
    })
  })

  describe('rsi', () => {
    it('returns values in range 0-100 for valid data', () => {
      // Generate a simple trending dataset
      const values = Array.from({ length: 30 }, (_, i) => 100 + i * 0.5 + Math.sin(i) * 3)
      const result = rsiOsc(values, 14)
      expect(result).toHaveLength(30)

      // First 14 values should be NaN
      for (let i = 0; i < 14; i++) {
        expect(result[i]).toBeNaN()
      }

      // Remaining values should be between 0 and 100
      for (let i = 14; i < 30; i++) {
        expect(result[i]).toBeGreaterThanOrEqual(0)
        expect(result[i]).toBeLessThanOrEqual(100)
      }
    })

    it('returns 100 for purely rising data', () => {
      // Strictly increasing: all gains, no losses
      const values = Array.from({ length: 20 }, (_, i) => i + 1)
      const result = rsiOsc(values, 14)
      expect(result[14]).toBe(100)
    })
  })
})

// ---------------------------------------------------------------------------
// defineChartType
// ---------------------------------------------------------------------------

describe('defineChartType', () => {
  it('creates a valid plugin with required fields', () => {
    const plugin = defineChartType({
      type: 'test-custom',
      render: () => [],
    })
    expect(plugin.type).toBe('test-custom')
    expect(typeof plugin.render).toBe('function')
    expect(typeof plugin.prepareData).toBe('function')
    expect(typeof plugin.hitTest).toBe('function')
    expect(typeof plugin.getScaleTypes).toBe('function')
  })

  it('uses default scale types (categorical x, linear y)', () => {
    const plugin = defineChartType({
      type: 'test-scales',
      render: () => [],
    })
    const scales = plugin.getScaleTypes()
    expect(scales.x).toBe('categorical')
    expect(scales.y).toBe('linear')
  })

  it('allows overriding prepareData', () => {
    const customPrepare = () => ({
      labels: ['a'],
      series: [],
      bounds: { xMin: 0, xMax: 1, yMin: 0, yMax: 1 },
    })
    const plugin = defineChartType({
      type: 'test-prepare',
      prepareData: customPrepare as any,
      render: () => [],
    })
    expect(plugin.prepareData).toBe(customPrepare)
  })

  it('hitTest defaults to returning null', () => {
    const plugin = defineChartType({
      type: 'test-hit',
      render: () => [],
    })
    const result = plugin.hitTest({} as any, 0, 0)
    expect(result).toBeNull()
  })

  it('respects suppressAxes and useBandScale flags', () => {
    const plugin = defineChartType({
      type: 'test-flags',
      suppressAxes: true,
      useBandScale: true,
      render: () => [],
    })
    expect(plugin.suppressAxes).toBe(true)
    expect(plugin.useBandScale).toBe(true)
  })
})
