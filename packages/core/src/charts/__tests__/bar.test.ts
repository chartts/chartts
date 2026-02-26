import { describe, it, expect } from 'vitest'
import { barChartType } from '../bar/bar-type'
import { resolveOptions, LIGHT_THEME } from '../../constants'
import { createLinearScale } from '../../scales/linear'
import { createCategoricalScale } from '../../scales/categorical'
import type { RenderContext } from '../../types'

function makeCtx(values: number[], opts = {}): RenderContext {
  const options = resolveOptions(opts, 1)
  const prepared = barChartType.prepareData({
    labels: values.map((_, i) => String.fromCharCode(65 + i)),
    series: [{ name: 'Test', values }],
  }, options)

  const area = { x: 50, y: 20, width: 500, height: 300 }
  const xScale = createCategoricalScale({
    categories: prepared.labels,
    range: [area.x, area.x + area.width],
    band: true,
  })
  const yScale = createLinearScale({
    domain: [prepared.bounds.yMin, prepared.bounds.yMax],
    range: [area.y + area.height, area.y],
  })

  return { data: prepared, options, area, xScale, yScale, theme: { ...LIGHT_THEME } }
}

describe('barChartType', () => {
  it('has type "bar"', () => {
    expect(barChartType.type).toBe('bar')
  })

  it('uses categorical x, linear y scales', () => {
    expect(barChartType.getScaleTypes()).toEqual({ x: 'categorical', y: 'linear' })
  })

  it('renders nodes for a single series', () => {
    const ctx = makeCtx([10, 20, 30])
    const nodes = barChartType.render(ctx)
    expect(nodes.length).toBeGreaterThan(0)
  })

  it('renders rect or path elements for bars', () => {
    const ctx = makeCtx([10, 20, 30])
    const nodes = barChartType.render(ctx)
    const str = JSON.stringify(nodes)
    const hasBar = str.includes('"type":"rect"') || str.includes('"type":"path"')
    expect(hasBar).toBe(true)
  })

  it('forces yMin to 0 for positive values', () => {
    const options = resolveOptions({}, 1)
    const prepared = barChartType.prepareData({
      labels: ['A', 'B', 'C'],
      series: [{ name: 'Test', values: [10, 20, 30] }],
    }, options)
    expect(prepared.bounds.yMin).toBe(0)
  })

  it('does not force yMin when user sets it', () => {
    const options = resolveOptions({ yMin: 5 }, 1)
    const prepared = barChartType.prepareData({
      labels: ['A', 'B', 'C'],
      series: [{ name: 'Test', values: [10, 20, 30] }],
    }, options)
    expect(prepared.bounds.yMin).toBe(5)
  })

  it('handles negative values', () => {
    const ctx = makeCtx([10, -5, 20])
    const nodes = barChartType.render(ctx)
    expect(nodes.length).toBeGreaterThan(0)
  })

  it('hit tests find bar under cursor', () => {
    const ctx = makeCtx([10, 20, 30])
    const x = ctx.xScale.map(1)
    const y = ctx.yScale.map(10) // somewhere inside bar 1
    const hit = barChartType.hitTest(ctx, x, y)
    expect(hit).not.toBeNull()
    expect(hit!.pointIndex).toBe(1)
  })

  it('hit test returns null outside bars', () => {
    const ctx = makeCtx([10, 20, 30])
    const hit = barChartType.hitTest(ctx, -100, -100)
    expect(hit).toBeNull()
  })

  it('handles empty series', () => {
    const options = resolveOptions({}, 1)
    const prepared = barChartType.prepareData({
      labels: [],
      series: [{ name: 'Test', values: [] }],
    }, options)
    const area = { x: 50, y: 20, width: 500, height: 300 }
    const xScale = createCategoricalScale({ categories: [], range: [50, 550], band: true })
    const yScale = createLinearScale({ domain: [0, 1], range: [320, 20] })
    const ctx: RenderContext = { data: prepared, options, area, xScale, yScale, theme: { ...LIGHT_THEME } }
    const nodes = barChartType.render(ctx)
    expect(nodes).toEqual([])
  })
})
