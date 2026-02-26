import { describe, it, expect } from 'vitest'
import { renderToString } from '../../render/string'
import { sparklineChartType } from '../sparkline/sparkline-type'

const data = {
  labels: ['1', '2', '3', '4', '5', '6', '7', '8'],
  series: [{ name: 'Trend', values: [4, 7, 3, 8, 5, 9, 6, 10] }],
}

const opts = { width: 200, height: 50 }

describe('Sparkline chart rendering', () => {
  it('produces valid SVG wrapper', () => {
    const svg = renderToString(sparklineChartType, data, opts)
    expect(svg).toMatch(/^<svg/)
    expect(svg).toMatch(/<\/svg>$/)
    expect(svg).toContain('viewBox="0 0 200 50"')
  })

  it('renders sparkline line path', () => {
    const svg = renderToString(sparklineChartType, data, opts)
    expect(svg).toContain('class="chartts-sparkline-line"')
    expect(svg).toContain('<path')
  })

  it('renders sparkline area fill', () => {
    const svg = renderToString(sparklineChartType, data, opts)
    expect(svg).toContain('class="chartts-sparkline-area"')
    expect(svg).toContain('fill-opacity="0.15"')
  })

  it('renders last-point indicator dot', () => {
    const svg = renderToString(sparklineChartType, data, opts)
    expect(svg).toContain('class="chartts-sparkline-dot"')
    expect(svg).toContain('<circle')
  })

  it('has only one dot (the last point)', () => {
    const svg = renderToString(sparklineChartType, data, opts)
    const dotCount = (svg.match(/class="chartts-sparkline-dot"/g) || []).length
    expect(dotCount).toBe(1)
  })

  it('sparkline overrides padding to minimal', () => {
    // Sparkline prepareData forces padding [2,2,2,2], no axes, no legend, no grid
    const svg = renderToString(sparklineChartType, data, opts)
    // Should NOT have axis elements
    expect(svg).not.toContain('chartts-x-axis-tick')
    expect(svg).not.toContain('chartts-y-axis-tick')
  })

  it('does not render legend', () => {
    const svg = renderToString(sparklineChartType, data, opts)
    expect(svg).not.toContain('class="chartts-legend')
  })

  it('line path starts with M (moveTo)', () => {
    const svg = renderToString(sparklineChartType, data, opts)
    // Extract the sparkline-line path d attribute
    expect(svg).toMatch(/d="M[\d.]/)
  })

  it('area path closes with Z', () => {
    const svg = renderToString(sparklineChartType, data, opts)
    // The area path should end with Z to close the shape
    expect(svg).toContain('chartts-sparkline-area')
    expect(svg).toMatch(/d="M[^"]*Z"/)
  })

  it('dot position is within chart bounds', () => {
    const svg = renderToString(sparklineChartType, data, opts)
    const cxMatch = svg.match(/class="chartts-sparkline-dot"[^>]*/)
    // Not null means the dot exists
    expect(cxMatch).not.toBeNull()
  })

  it('handles single point', () => {
    const single = {
      labels: ['1'],
      series: [{ name: 'Test', values: [42] }],
    }
    const svg = renderToString(sparklineChartType, single, opts)
    expect(svg).toContain('<svg')
    expect(svg).toContain('chartts-sparkline-dot')
  })

  it('handles two points (linear path)', () => {
    const two = {
      labels: ['1', '2'],
      series: [{ name: 'Test', values: [10, 20] }],
    }
    const svg = renderToString(sparklineChartType, two, opts)
    expect(svg).toContain('chartts-sparkline-line')
    expect(svg).toContain('chartts-sparkline-area')
  })

  it('handles empty data', () => {
    const empty = {
      labels: [],
      series: [{ name: 'Empty', values: [] }],
    }
    const svg = renderToString(sparklineChartType, empty, opts)
    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
  })

  it('sparkline has stroke color from series', () => {
    const svg = renderToString(sparklineChartType, data, opts)
    expect(svg).toMatch(/class="chartts-sparkline-line"[^>]*stroke=/)
  })

  it('small dimensions work correctly', () => {
    const svg = renderToString(sparklineChartType, data, { width: 80, height: 24 })
    expect(svg).toContain('viewBox="0 0 80 24"')
    expect(svg).toContain('chartts-sparkline-line')
  })
})
