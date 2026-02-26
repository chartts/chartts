import { describe, it, expect } from 'vitest'
import { renderToString } from '../../render/string'
import { lineChartType } from '../line/line-type'

const data = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  series: [{ name: 'Revenue', values: [10, 25, 18, 30, 22] }],
}

const opts = { width: 600, height: 400 }

describe('Line chart rendering', () => {
  it('produces valid SVG wrapper', () => {
    const svg = renderToString(lineChartType, data, opts)
    expect(svg).toMatch(/^<svg/)
    expect(svg).toMatch(/<\/svg>$/)
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect(svg).toContain('viewBox="0 0 600 400"')
    expect(svg).toContain('role="img"')
  })

  it('renders a path element for the line', () => {
    const svg = renderToString(lineChartType, data, opts)
    expect(svg).toContain('<path')
    expect(svg).toContain('class="chartts-line"')
  })

  it('renders data points as circles', () => {
    const svg = renderToString(lineChartType, data, opts)
    expect(svg).toContain('<circle')
    expect(svg).toContain('class="chartts-point"')
  })

  it('has correct number of data point circles', () => {
    const svg = renderToString(lineChartType, data, opts)
    const pointCount = (svg.match(/class="chartts-point"/g) || []).length
    expect(pointCount).toBe(5)
  })

  it('wraps series in a group with correct class', () => {
    const svg = renderToString(lineChartType, data, opts)
    expect(svg).toContain('class="chartts-series chartts-series-0"')
    expect(svg).toContain('data-series-name="Revenue"')
  })

  it('renders x-axis with tick labels', () => {
    const svg = renderToString(lineChartType, data, opts)
    expect(svg).toContain('class="chartts-x-axis"')
    expect(svg).toContain('>Jan<')
    expect(svg).toContain('>Mar<')
    expect(svg).toContain('>May<')
  })

  it('renders y-axis', () => {
    const svg = renderToString(lineChartType, data, opts)
    expect(svg).toContain('class="chartts-y-axis"')
  })

  it('renders grid lines when yGrid is on', () => {
    const svg = renderToString(lineChartType, data, { ...opts, yGrid: true })
    expect(svg).toContain('chartts-grid')
  })

  it('contains aria-label on points', () => {
    const svg = renderToString(lineChartType, data, opts)
    expect(svg).toContain('aria-label="Revenue: 10"')
    expect(svg).toContain('aria-label="Revenue: 30"')
  })

  it('renders multi-series with separate groups', () => {
    const multiData = {
      labels: ['A', 'B', 'C'],
      series: [
        { name: 'S1', values: [10, 20, 15] },
        { name: 'S2', values: [5, 15, 10] },
      ],
    }
    const svg = renderToString(lineChartType, multiData, opts)
    expect(svg).toContain('chartts-series-0')
    expect(svg).toContain('chartts-series-1')
    expect(svg).toContain('data-series-name="S1"')
    expect(svg).toContain('data-series-name="S2"')
  })

  it('renders legend for multi-series', () => {
    const multiData = {
      labels: ['A', 'B', 'C'],
      series: [
        { name: 'S1', values: [10, 20, 15] },
        { name: 'S2', values: [5, 15, 10] },
      ],
    }
    const svg = renderToString(lineChartType, multiData, opts)
    expect(svg).toContain('chartts-legend')
  })

  it('renders area fill when series has fill:true', () => {
    const fillData = {
      labels: ['A', 'B', 'C'],
      series: [{ name: 'Area', values: [10, 20, 15], fill: true }],
    }
    const svg = renderToString(lineChartType, fillData, opts)
    expect(svg).toContain('class="chartts-area"')
  })

  it('handles single data point without crashing', () => {
    const single = {
      labels: ['Only'],
      series: [{ name: 'Test', values: [42] }],
    }
    const svg = renderToString(lineChartType, single, opts)
    expect(svg).toContain('<svg')
    expect(svg).toContain('chartts-point')
  })

  it('handles empty series gracefully', () => {
    const empty = {
      labels: [],
      series: [{ name: 'Empty', values: [] }],
    }
    const svg = renderToString(lineChartType, empty, opts)
    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
  })

  it('clip path is applied to chart content', () => {
    const svg = renderToString(lineChartType, data, opts)
    expect(svg).toContain('<clipPath id="chartts-clip">')
    expect(svg).toContain('clip-path="url(#chartts-clip)"')
  })

  it('respects custom ariaLabel', () => {
    const svg = renderToString(lineChartType, data, { ...opts, ariaLabel: 'Monthly revenue' })
    expect(svg).toContain('aria-label="Monthly revenue"')
  })

  it('path d attribute contains valid SVG path commands', () => {
    const svg = renderToString(lineChartType, data, opts)
    // The line path should exist and start with M
    expect(svg).toMatch(/d="M[\d.]/)
  })
})
