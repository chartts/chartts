import { describe, it, expect } from 'vitest'
import { renderToString } from '../../render/string'
import { scatterChartType } from '../scatter/scatter-type'

const data = {
  labels: ['P1', 'P2', 'P3', 'P4', 'P5'],
  series: [{ name: 'Measurements', values: [12, 28, 15, 32, 20] }],
}

const opts = { width: 600, height: 400 }

describe('Scatter chart rendering', () => {
  it('produces valid SVG wrapper', () => {
    const svg = renderToString(scatterChartType, data, opts)
    expect(svg).toMatch(/^<svg/)
    expect(svg).toMatch(/<\/svg>$/)
    expect(svg).toContain('viewBox="0 0 600 400"')
  })

  it('renders circle elements for data points', () => {
    const svg = renderToString(scatterChartType, data, opts)
    expect(svg).toContain('<circle')
    expect(svg).toContain('class="chartts-dot"')
  })

  it('renders correct number of dots', () => {
    const svg = renderToString(scatterChartType, data, opts)
    const dotCount = (svg.match(/class="chartts-dot"/g) || []).length
    expect(dotCount).toBe(5)
  })

  it('dots have data-series and data-index attributes', () => {
    const svg = renderToString(scatterChartType, data, opts)
    expect(svg).toContain('data-series="0"')
    expect(svg).toContain('data-index="0"')
    expect(svg).toContain('data-index="4"')
  })

  it('dots have aria-labels with values', () => {
    const svg = renderToString(scatterChartType, data, opts)
    expect(svg).toContain('aria-label="Measurements: 12"')
    expect(svg).toContain('aria-label="Measurements: 32"')
  })

  it('wraps dots in series group', () => {
    const svg = renderToString(scatterChartType, data, opts)
    expect(svg).toContain('class="chartts-series chartts-series-0"')
    expect(svg).toContain('data-series-name="Measurements"')
  })

  it('circles have cx/cy attributes within chart bounds', () => {
    const svg = renderToString(scatterChartType, data, opts)
    // Extract cx values from circles — they should be between 0 and 600
    const cxMatches = svg.match(/cx="([\d.]+)"/g) || []
    for (const m of cxMatches) {
      const val = parseFloat(m.replace(/cx="|"/g, ''))
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThanOrEqual(600)
    }
    // Extract cy values — should be between 0 and 400
    const cyMatches = svg.match(/cy="([\d.]+)"/g) || []
    for (const m of cyMatches) {
      const val = parseFloat(m.replace(/cy="|"/g, ''))
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThanOrEqual(400)
    }
  })

  it('dots have fill and fill-opacity', () => {
    const svg = renderToString(scatterChartType, data, opts)
    expect(svg).toMatch(/class="chartts-dot"[^>]*fill=/)
    expect(svg).toContain('fill-opacity="0.7"')
  })

  it('renders multi-series scatter', () => {
    const multiData = {
      labels: ['A', 'B', 'C'],
      series: [
        { name: 'Group 1', values: [10, 20, 15] },
        { name: 'Group 2', values: [5, 25, 18] },
      ],
    }
    const svg = renderToString(scatterChartType, multiData, opts)
    expect(svg).toContain('chartts-series-0')
    expect(svg).toContain('chartts-series-1')
    expect(svg).toContain('data-series-name="Group 1"')
    expect(svg).toContain('data-series-name="Group 2"')
    const dotCount = (svg.match(/class="chartts-dot"/g) || []).length
    expect(dotCount).toBe(6) // 2 series x 3 points
  })

  it('renders x-axis and y-axis', () => {
    const svg = renderToString(scatterChartType, data, opts)
    expect(svg).toContain('chartts-x-axis')
    expect(svg).toContain('chartts-y-axis')
  })

  it('handles empty data', () => {
    const empty = {
      labels: [],
      series: [{ name: 'Empty', values: [] }],
    }
    const svg = renderToString(scatterChartType, empty, opts)
    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
  })

  it('handles single point', () => {
    const single = {
      labels: ['Only'],
      series: [{ name: 'Test', values: [42] }],
    }
    const svg = renderToString(scatterChartType, single, opts)
    const dotCount = (svg.match(/class="chartts-dot"/g) || []).length
    expect(dotCount).toBe(1)
  })
})
