import { describe, it, expect } from 'vitest'
import { renderToString } from '../string'
import { lineChartType } from '../../charts/line/line-type'
import { barChartType } from '../../charts/bar/bar-type'

describe('renderToString', () => {
  const data = {
    labels: ['A', 'B', 'C'],
    series: [{ name: 'Test', values: [10, 20, 15] }],
  }

  it('returns a valid SVG string for line chart', () => {
    const svg = renderToString(lineChartType, data, { width: 600, height: 400 })
    expect(svg).toMatch(/^<svg/)
    expect(svg).toMatch(/<\/svg>$/)
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect(svg).toContain('viewBox="0 0 600 400"')
  })

  it('returns a valid SVG string for bar chart', () => {
    const svg = renderToString(barChartType, data, { width: 600, height: 400 })
    expect(svg).toMatch(/^<svg/)
    expect(svg).toContain('<rect')
  })

  it('contains axis elements', () => {
    const svg = renderToString(lineChartType, data, { width: 600, height: 400 })
    expect(svg).toContain('chartts-x-axis')
    expect(svg).toContain('chartts-y-axis')
  })

  it('contains grid elements', () => {
    const svg = renderToString(lineChartType, data, { width: 600, height: 400, yGrid: true })
    expect(svg).toContain('chartts-grid')
  })

  it('contains series data', () => {
    const svg = renderToString(lineChartType, data, { width: 600, height: 400 })
    expect(svg).toContain('chartts-series')
  })

  it('uses default dimensions when not specified', () => {
    const svg = renderToString(lineChartType, data)
    expect(svg).toContain('viewBox="0 0 600 400"')
  })

  it('applies custom dimensions', () => {
    const svg = renderToString(lineChartType, data, { width: 800, height: 300 })
    expect(svg).toContain('viewBox="0 0 800 300"')
    expect(svg).toContain('width="800"')
    expect(svg).toContain('height="300"')
  })

  it('escapes special characters in labels', () => {
    const svg = renderToString(lineChartType, {
      labels: ['<script>', 'A&B', '"test"'],
      series: [{ name: 'Test', values: [1, 2, 3] }],
    }, { width: 600, height: 400 })
    expect(svg).not.toContain('<script>')
    expect(svg).toContain('&lt;script&gt;')
  })

  it('includes aria-label', () => {
    const svg = renderToString(lineChartType, data, {
      width: 600, height: 400, ariaLabel: 'Revenue chart',
    })
    expect(svg).toContain('aria-label="Revenue chart"')
  })

  it('renders multi-series', () => {
    const svg = renderToString(lineChartType, {
      labels: ['A', 'B', 'C'],
      series: [
        { name: 'S1', values: [10, 20, 15] },
        { name: 'S2', values: [5, 15, 10] },
      ],
    }, { width: 600, height: 400 })
    expect(svg).toContain('chartts-series-0')
    expect(svg).toContain('chartts-series-1')
  })
})
