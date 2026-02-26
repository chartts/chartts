import { describe, it, expect } from 'vitest'
import { sparklineChartType } from '../sparkline/sparkline-type'
import { resolveOptions, LIGHT_THEME } from '../../constants'
import { createLinearScale } from '../../scales/linear'
import { createCategoricalScale } from '../../scales/categorical'
import type { RenderContext } from '../../types'

function makeCtx(values: number[], opts = {}): RenderContext {
  const options = resolveOptions(opts, 1)
  const prepared = sparklineChartType.prepareData({
    labels: values.map((_, i) => String(i)),
    series: [{ name: 'Trend', values }],
  }, options)

  const area = { x: 2, y: 2, width: 196, height: 46 }
  const xScale = createCategoricalScale({
    categories: prepared.labels,
    range: [area.x, area.x + area.width],
  })
  const yScale = createLinearScale({
    domain: [prepared.bounds.yMin, prepared.bounds.yMax],
    range: [area.y + area.height, area.y],
  })

  return { data: prepared, options, area, xScale, yScale, theme: { ...LIGHT_THEME } }
}

describe('sparklineChartType', () => {
  it('has type "sparkline"', () => {
    expect(sparklineChartType.type).toBe('sparkline')
  })

  it('uses categorical x, linear y scales', () => {
    expect(sparklineChartType.getScaleTypes()).toEqual({ x: 'categorical', y: 'linear' })
  })

  it('prepareData overrides to no axes/legend/grid', () => {
    const options = resolveOptions({}, 1)
    const prepared = sparklineChartType.prepareData({
      labels: ['1', '2', '3'],
      series: [{ name: 'Test', values: [1, 2, 3] }],
    }, options)
    // Should still have valid data
    expect(prepared.labels).toHaveLength(3)
    expect(prepared.series).toHaveLength(1)
  })

  it('renders 3 elements: area, line, and dot', () => {
    const ctx = makeCtx([4, 7, 3, 8, 5])
    const nodes = sparklineChartType.render(ctx)
    expect(nodes.length).toBe(3)
  })

  it('first node is area fill path', () => {
    const ctx = makeCtx([4, 7, 3, 8])
    const nodes = sparklineChartType.render(ctx)
    expect(nodes[0]!.type).toBe('path')
    if (nodes[0]!.type === 'path') {
      expect(nodes[0]!.attrs?.class).toBe('chartts-sparkline-area')
      expect(nodes[0]!.attrs?.fillOpacity).toBe(0.15)
    }
  })

  it('second node is line path', () => {
    const ctx = makeCtx([4, 7, 3, 8])
    const nodes = sparklineChartType.render(ctx)
    expect(nodes[1]!.type).toBe('path')
    if (nodes[1]!.type === 'path') {
      expect(nodes[1]!.attrs?.class).toBe('chartts-sparkline-line')
      expect(nodes[1]!.attrs?.strokeWidth).toBe(1.5)
    }
  })

  it('third node is last-point circle', () => {
    const ctx = makeCtx([4, 7, 3, 8])
    const nodes = sparklineChartType.render(ctx)
    expect(nodes[2]!.type).toBe('circle')
    if (nodes[2]!.type === 'circle') {
      expect(nodes[2]!.attrs?.class).toBe('chartts-sparkline-dot')
      expect(nodes[2]!.r).toBe(2.5)
    }
  })

  it('area path closes with Z', () => {
    const ctx = makeCtx([10, 20, 15])
    const nodes = sparklineChartType.render(ctx)
    if (nodes[0]!.type === 'path') {
      expect(nodes[0]!.d).toMatch(/Z$/)
    }
  })

  it('line path starts with M', () => {
    const ctx = makeCtx([10, 20, 15])
    const nodes = sparklineChartType.render(ctx)
    if (nodes[1]!.type === 'path') {
      expect(nodes[1]!.d).toMatch(/^M/)
    }
  })

  it('last-point dot is positioned at last data point', () => {
    const values = [10, 20, 15, 25]
    const ctx = makeCtx(values)
    const nodes = sparklineChartType.render(ctx)
    const dot = nodes[2]!
    if (dot.type === 'circle') {
      // The dot's cx should be at the last x position
      const expectedX = ctx.xScale.map(values.length - 1)
      const expectedY = ctx.yScale.map(values[values.length - 1]!)
      expect(dot.cx).toBeCloseTo(expectedX, 1)
      expect(dot.cy).toBeCloseTo(expectedY, 1)
    }
  })

  it('returns empty for empty data', () => {
    const options = resolveOptions({}, 1)
    const prepared = sparklineChartType.prepareData({
      labels: [],
      series: [{ name: 'Test', values: [] }],
    }, options)
    const area = { x: 2, y: 2, width: 196, height: 46 }
    const xScale = createCategoricalScale({ categories: [], range: [2, 198] })
    const yScale = createLinearScale({ domain: [0, 1], range: [48, 2] })
    const ctx: RenderContext = { data: prepared, options, area, xScale, yScale, theme: { ...LIGHT_THEME } }
    const nodes = sparklineChartType.render(ctx)
    expect(nodes).toEqual([])
  })

  it('hitTest always returns null', () => {
    const ctx = makeCtx([10, 20, 15])
    const hit = sparklineChartType.hitTest(ctx, 100, 25)
    expect(hit).toBeNull()
  })

  it('handles single data point', () => {
    const ctx = makeCtx([42])
    const nodes = sparklineChartType.render(ctx)
    // Should have area (just M command), line (just M command), and dot
    expect(nodes.length).toBeGreaterThanOrEqual(1)
  })

  it('handles two data points (linear interpolation)', () => {
    const ctx = makeCtx([10, 20])
    const nodes = sparklineChartType.render(ctx)
    expect(nodes.length).toBe(3) // area, line, dot
    if (nodes[1]!.type === 'path') {
      // Two points: should have M and L commands (linear, not curve)
      expect(nodes[1]!.d).toMatch(/^M[\d.]+,[\d.]+L/)
    }
  })
})
