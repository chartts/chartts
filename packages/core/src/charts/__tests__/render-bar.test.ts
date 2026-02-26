import { describe, it, expect } from 'vitest'
import { renderToString } from '../../render/string'
import { barChartType } from '../bar/bar-type'

const data = {
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  series: [{ name: 'Sales', values: [120, 200, 150, 280] }],
}

const opts = { width: 600, height: 400 }

describe('Bar chart rendering', () => {
  it('produces valid SVG wrapper', () => {
    const svg = renderToString(barChartType, data, opts)
    expect(svg).toMatch(/^<svg/)
    expect(svg).toMatch(/<\/svg>$/)
    expect(svg).toContain('viewBox="0 0 600 400"')
  })

  it('renders rect or path elements for bars', () => {
    const svg = renderToString(barChartType, data, opts)
    const hasBar = svg.includes('class="chartts-bar"')
    expect(hasBar).toBe(true)
  })

  it('renders correct number of bars', () => {
    const svg = renderToString(barChartType, data, opts)
    const barCount = (svg.match(/class="chartts-bar"/g) || []).length
    expect(barCount).toBe(4)
  })

  it('wraps bars in series group', () => {
    const svg = renderToString(barChartType, data, opts)
    expect(svg).toContain('class="chartts-series chartts-series-0"')
    expect(svg).toContain('data-series-name="Sales"')
  })

  it('bars have data-index attributes', () => {
    const svg = renderToString(barChartType, data, opts)
    expect(svg).toContain('data-index="0"')
    expect(svg).toContain('data-index="1"')
    expect(svg).toContain('data-index="2"')
    expect(svg).toContain('data-index="3"')
  })

  it('bars have aria-labels with values', () => {
    const svg = renderToString(barChartType, data, opts)
    expect(svg).toContain('aria-label="Sales: 120"')
    expect(svg).toContain('aria-label="Sales: 280"')
  })

  it('renders x-axis with labels', () => {
    const svg = renderToString(barChartType, data, opts)
    expect(svg).toContain('chartts-x-axis')
    expect(svg).toContain('>Q1<')
    expect(svg).toContain('>Q4<')
  })

  it('renders y-axis starting from 0', () => {
    const svg = renderToString(barChartType, data, opts)
    expect(svg).toContain('chartts-y-axis')
    // Bar charts force yMin=0 for positive values
    expect(svg).toContain('>0<')
  })

  it('handles negative values', () => {
    const negData = {
      labels: ['A', 'B', 'C'],
      series: [{ name: 'PnL', values: [50, -30, 20] }],
    }
    const svg = renderToString(barChartType, negData, opts)
    expect(svg).toContain('<svg')
    expect(svg).toContain('aria-label="PnL: -30"')
    const barCount = (svg.match(/class="chartts-bar"/g) || []).length
    expect(barCount).toBe(3)
  })

  it('renders multi-series grouped bars', () => {
    const multiData = {
      labels: ['Q1', 'Q2'],
      series: [
        { name: 'Product A', values: [100, 150] },
        { name: 'Product B', values: [80, 120] },
      ],
    }
    const svg = renderToString(barChartType, multiData, opts)
    expect(svg).toContain('chartts-series-0')
    expect(svg).toContain('chartts-series-1')
    expect(svg).toContain('data-series-name="Product A"')
    expect(svg).toContain('data-series-name="Product B"')
    const barCount = (svg.match(/class="chartts-bar"/g) || []).length
    expect(barCount).toBe(4) // 2 series x 2 data points
  })

  it('renders legend for multi-series', () => {
    const multiData = {
      labels: ['Q1', 'Q2'],
      series: [
        { name: 'A', values: [100, 150] },
        { name: 'B', values: [80, 120] },
      ],
    }
    const svg = renderToString(barChartType, multiData, opts)
    expect(svg).toContain('chartts-legend')
  })

  it('handles empty data', () => {
    const empty = {
      labels: [],
      series: [{ name: 'Empty', values: [] }],
    }
    const svg = renderToString(barChartType, empty, opts)
    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
  })

  it('clip path is applied', () => {
    const svg = renderToString(barChartType, data, opts)
    expect(svg).toContain('<clipPath id="chartts-clip">')
    expect(svg).toContain('clip-path="url(#chartts-clip)"')
  })

  it('bars have fill color attribute', () => {
    const svg = renderToString(barChartType, data, opts)
    // bars should have a fill attribute set
    expect(svg).toMatch(/class="chartts-bar"[^>]*fill=/)
  })
})
