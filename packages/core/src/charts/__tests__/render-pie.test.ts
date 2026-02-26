import { describe, it, expect } from 'vitest'
import { renderToString } from '../../render/string'
import { pieChartType, donutChartType } from '../pie/pie-type'

const data = {
  labels: ['Chrome', 'Firefox', 'Safari', 'Edge'],
  series: [{ name: 'Browser', values: [65, 15, 12, 8] }],
}

const opts = { width: 400, height: 400 }

describe('Pie chart rendering', () => {
  it('produces valid SVG wrapper', () => {
    const svg = renderToString(pieChartType, data, opts)
    expect(svg).toMatch(/^<svg/)
    expect(svg).toMatch(/<\/svg>$/)
    expect(svg).toContain('viewBox="0 0 400 400"')
  })

  it('renders path elements for slices', () => {
    const svg = renderToString(pieChartType, data, opts)
    expect(svg).toContain('class="chartts-slice"')
  })

  it('renders correct number of slices', () => {
    const svg = renderToString(pieChartType, data, opts)
    const sliceCount = (svg.match(/class="chartts-slice"/g) || []).length
    expect(sliceCount).toBe(4)
  })

  it('wraps each slice in a series group', () => {
    const svg = renderToString(pieChartType, data, opts)
    expect(svg).toContain('class="chartts-series chartts-series-0"')
    expect(svg).toContain('class="chartts-series chartts-series-1"')
    expect(svg).toContain('class="chartts-series chartts-series-2"')
    expect(svg).toContain('class="chartts-series chartts-series-3"')
  })

  it('has data-series-name with label text', () => {
    const svg = renderToString(pieChartType, data, opts)
    expect(svg).toContain('data-series-name="Chrome"')
    expect(svg).toContain('data-series-name="Firefox"')
    expect(svg).toContain('data-series-name="Safari"')
    expect(svg).toContain('data-series-name="Edge"')
  })

  it('slices have aria-labels with values', () => {
    const svg = renderToString(pieChartType, data, opts)
    expect(svg).toContain('aria-label="Chrome: 65"')
    expect(svg).toContain('aria-label="Firefox: 15"')
  })

  it('renders percentage labels on large enough slices', () => {
    const svg = renderToString(pieChartType, data, opts)
    // Chrome is 65% — should have a label
    expect(svg).toContain('class="chartts-slice-label"')
    expect(svg).toContain('65%')
  })

  it('slice paths contain arc commands', () => {
    const svg = renderToString(pieChartType, data, opts)
    // SVG arc command: A rx ry x-rotation large-arc-flag sweep-flag x y
    expect(svg).toMatch(/d="M[^"]*A/)
  })

  it('pie path goes through center (no innerRadius)', () => {
    const svg = renderToString(pieChartType, data, opts)
    // Pie slices start with M cx,cy then L to outer edge
    expect(svg).toMatch(/d="M[\d.]+,[\d.]+L/)
  })

  it('handles single slice (100%)', () => {
    const single = {
      labels: ['All'],
      series: [{ name: 'Test', values: [100] }],
    }
    const svg = renderToString(pieChartType, single, opts)
    expect(svg).toContain('<svg')
    expect(svg).toContain('chartts-slice')
  })

  it('handles zero values gracefully', () => {
    const zeros = {
      labels: ['A', 'B'],
      series: [{ name: 'Test', values: [0, 0] }],
    }
    const svg = renderToString(pieChartType, zeros, opts)
    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
  })

  it('handles empty data', () => {
    const empty = {
      labels: [],
      series: [{ name: 'Empty', values: [] }],
    }
    const svg = renderToString(pieChartType, empty, opts)
    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
  })
})

describe('Donut chart rendering', () => {
  it('has type "donut"', () => {
    expect(donutChartType.type).toBe('donut')
  })

  it('produces valid SVG', () => {
    const svg = renderToString(donutChartType, data, opts)
    expect(svg).toMatch(/^<svg/)
    expect(svg).toMatch(/<\/svg>$/)
  })

  it('renders slices', () => {
    const svg = renderToString(donutChartType, data, opts)
    const sliceCount = (svg.match(/class="chartts-slice"/g) || []).length
    expect(sliceCount).toBe(4)
  })

  it('donut path does NOT go through center (has inner radius)', () => {
    const svg = renderToString(donutChartType, data, opts)
    // Donut slices use two arcs (outer and inner) — path should have 2 arc commands
    const paths = svg.match(/d="[^"]+"/g) || []
    const slicePaths = paths.filter(p => {
      // slice paths have two A commands (outer arc + inner arc)
      const arcCount = (p.match(/A/g) || []).length
      return arcCount >= 2
    })
    expect(slicePaths.length).toBeGreaterThan(0)
  })

  it('has aria-labels on slices', () => {
    const svg = renderToString(donutChartType, data, opts)
    expect(svg).toContain('aria-label="Chrome: 65"')
  })

  it('renders percentage labels', () => {
    const svg = renderToString(donutChartType, data, opts)
    expect(svg).toContain('65%')
  })
})
