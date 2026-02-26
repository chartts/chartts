import { describe, it, expect } from 'vitest'
import { lineChartType } from '../line/line-type'
import { resolveOptions, LIGHT_THEME } from '../../constants'
import { createLinearScale } from '../../scales/linear'
import { createCategoricalScale } from '../../scales/categorical'
import type { RenderContext } from '../../types'

function makeCtx(values: number[], opts = {}): RenderContext {
  const options = resolveOptions(opts, 1)
  const prepared = lineChartType.prepareData({
    labels: values.map((_, i) => String.fromCharCode(65 + i)),
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

describe('lineChartType', () => {
  it('has type "line"', () => {
    expect(lineChartType.type).toBe('line')
  })

  it('uses categorical x, linear y scales', () => {
    expect(lineChartType.getScaleTypes()).toEqual({ x: 'categorical', y: 'linear' })
  })

  it('renders nodes for a single series', () => {
    const ctx = makeCtx([10, 20, 30])
    const nodes = lineChartType.render(ctx)
    expect(nodes.length).toBeGreaterThan(0)
  })

  it('renders path elements', () => {
    const ctx = makeCtx([10, 20, 30])
    const nodes = lineChartType.render(ctx)
    const hasPath = JSON.stringify(nodes).includes('"type":"path"')
    expect(hasPath).toBe(true)
  })

  it('renders points when showPoints is true', () => {
    const ctx = makeCtx([10, 20, 30])
    const nodes = lineChartType.render(ctx)
    const hasCircle = JSON.stringify(nodes).includes('"type":"circle"')
    expect(hasCircle).toBe(true)
  })

  it('hit tests find nearest point', () => {
    const ctx = makeCtx([10, 20, 30])
    const x = ctx.xScale.map(1)
    const y = ctx.yScale.map(20)
    const hit = lineChartType.hitTest(ctx, x, y)
    expect(hit).not.toBeNull()
    expect(hit!.pointIndex).toBe(1)
  })

  it('hit test returns null when too far', () => {
    const ctx = makeCtx([10, 20, 30])
    const hit = lineChartType.hitTest(ctx, -100, -100)
    expect(hit).toBeNull()
  })

  it('prepares data correctly', () => {
    const options = resolveOptions({}, 1)
    const prepared = lineChartType.prepareData({
      labels: ['A', 'B', 'C'],
      series: [{ name: 'Test', values: [10, 20, 30] }],
    }, options)
    expect(prepared.labels).toEqual(['A', 'B', 'C'])
    expect(prepared.series).toHaveLength(1)
    expect(prepared.bounds.yMin).toBe(10)
    expect(prepared.bounds.yMax).toBe(30)
  })
})
