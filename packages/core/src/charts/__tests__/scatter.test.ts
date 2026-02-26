import { describe, it, expect } from 'vitest'
import { scatterChartType } from '../scatter/scatter-type'
import { resolveOptions, LIGHT_THEME } from '../../constants'
import { createLinearScale } from '../../scales/linear'
import { createCategoricalScale } from '../../scales/categorical'
import type { RenderContext } from '../../types'

function makeCtx(values: number[], opts = {}): RenderContext {
  const options = resolveOptions(opts, 1)
  const prepared = scatterChartType.prepareData({
    labels: values.map((_, i) => `P${i}`),
    series: [{ name: 'Test', values }],
  }, options)

  const area = { x: 50, y: 20, width: 500, height: 300 }
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

describe('scatterChartType', () => {
  it('has type "scatter"', () => {
    expect(scatterChartType.type).toBe('scatter')
  })

  it('uses categorical x, linear y scales', () => {
    expect(scatterChartType.getScaleTypes()).toEqual({ x: 'categorical', y: 'linear' })
  })

  it('renders nodes for a single series', () => {
    const ctx = makeCtx([10, 20, 30])
    const nodes = scatterChartType.render(ctx)
    expect(nodes.length).toBe(1) // 1 series group
  })

  it('series group contains circle elements', () => {
    const ctx = makeCtx([10, 20, 30])
    const nodes = scatterChartType.render(ctx)
    const str = JSON.stringify(nodes)
    expect(str).toContain('"type":"circle"')
    expect(str).toContain('chartts-dot')
  })

  it('renders correct number of circles', () => {
    const ctx = makeCtx([10, 20, 30, 40, 50])
    const nodes = scatterChartType.render(ctx)
    const str = JSON.stringify(nodes)
    const dotCount = (str.match(/chartts-dot"/g) || []).length
    expect(dotCount).toBe(5)
  })

  it('circles have fill-opacity 0.7', () => {
    const ctx = makeCtx([10, 20])
    const nodes = scatterChartType.render(ctx)
    const str = JSON.stringify(nodes)
    expect(str).toContain('"fillOpacity":0.7')
  })

  it('circles have aria-labels', () => {
    const ctx = makeCtx([42])
    const nodes = scatterChartType.render(ctx)
    const str = JSON.stringify(nodes)
    expect(str).toContain('"ariaLabel":"Test: 42"')
  })

  it('hit test finds nearest dot', () => {
    const ctx = makeCtx([10, 20, 30])
    const x = ctx.xScale.map(1)
    const y = ctx.yScale.map(20)
    const hit = scatterChartType.hitTest(ctx, x, y)
    expect(hit).not.toBeNull()
    expect(hit!.pointIndex).toBe(1)
  })

  it('hit test returns null when too far away', () => {
    const ctx = makeCtx([10, 20, 30])
    const hit = scatterChartType.hitTest(ctx, -500, -500)
    expect(hit).toBeNull()
  })

  it('renders multi-series', () => {
    const options = resolveOptions({}, 2)
    const prepared = scatterChartType.prepareData({
      labels: ['A', 'B'],
      series: [
        { name: 'S1', values: [10, 20] },
        { name: 'S2', values: [15, 25] },
      ],
    }, options)

    const area = { x: 50, y: 20, width: 500, height: 300 }
    const xScale = createCategoricalScale({ categories: prepared.labels, range: [50, 550] })
    const yScale = createLinearScale({ domain: [prepared.bounds.yMin, prepared.bounds.yMax], range: [320, 20] })
    const ctx: RenderContext = { data: prepared, options, area, xScale, yScale, theme: { ...LIGHT_THEME } }

    const nodes = scatterChartType.render(ctx)
    expect(nodes.length).toBe(2) // 2 series groups
    const str = JSON.stringify(nodes)
    const dotCount = (str.match(/chartts-dot"/g) || []).length
    expect(dotCount).toBe(4) // 2 series x 2 points
  })

  it('handles empty series', () => {
    const options = resolveOptions({}, 1)
    const prepared = scatterChartType.prepareData({
      labels: [],
      series: [{ name: 'Test', values: [] }],
    }, options)
    const area = { x: 0, y: 0, width: 500, height: 300 }
    const xScale = createCategoricalScale({ categories: [], range: [0, 500] })
    const yScale = createLinearScale({ domain: [0, 1], range: [300, 0] })
    const ctx: RenderContext = { data: prepared, options, area, xScale, yScale, theme: { ...LIGHT_THEME } }
    const nodes = scatterChartType.render(ctx)
    // Should have series group but with no children (or empty)
    expect(nodes.length).toBe(1) // group with empty dots array
  })
})
