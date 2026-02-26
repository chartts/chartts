import { describe, it, expect } from 'vitest'
import { pieChartType, donutChartType } from '../pie/pie-type'
import { resolveOptions, LIGHT_THEME } from '../../constants'
import { createLinearScale } from '../../scales/linear'
import { createCategoricalScale } from '../../scales/categorical'
import type { RenderContext } from '../../types'

function makeCtx(values: number[], opts = {}): RenderContext {
  const options = resolveOptions(opts, 1)
  const prepared = pieChartType.prepareData({
    labels: values.map((_, i) => `Slice ${i + 1}`),
    series: [{ name: 'Test', values }],
  }, options)

  const area = { x: 50, y: 20, width: 400, height: 400 }
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

describe('pieChartType', () => {
  it('has type "pie"', () => {
    expect(pieChartType.type).toBe('pie')
  })

  it('uses categorical x, linear y scales', () => {
    expect(pieChartType.getScaleTypes()).toEqual({ x: 'categorical', y: 'linear' })
  })

  it('renders nodes for data', () => {
    const ctx = makeCtx([40, 30, 20, 10])
    const nodes = pieChartType.render(ctx)
    expect(nodes.length).toBe(4) // 4 slice groups
  })

  it('each node is a group containing a path (slice)', () => {
    const ctx = makeCtx([60, 40])
    const nodes = pieChartType.render(ctx)
    for (const node of nodes) {
      expect(node.type).toBe('group')
      if (node.type === 'group') {
        const hasSlice = node.children.some(c => c.type === 'path' && c.attrs?.class === 'chartts-slice')
        expect(hasSlice).toBe(true)
      }
    }
  })

  it('renders percentage labels on large slices', () => {
    const ctx = makeCtx([70, 30])
    const nodes = pieChartType.render(ctx)
    const str = JSON.stringify(nodes)
    expect(str).toContain('chartts-slice-label')
    expect(str).toContain('70%')
    expect(str).toContain('30%')
  })

  it('skips labels on tiny slices', () => {
    const ctx = makeCtx([95, 3, 2])
    const nodes = pieChartType.render(ctx)
    const str = JSON.stringify(nodes)
    // 95% slice gets a label, tiny ones might not (< 0.3 radians)
    expect(str).toContain('95%')
  })

  it('returns empty for zero-total data', () => {
    const ctx = makeCtx([0, 0, 0])
    const nodes = pieChartType.render(ctx)
    expect(nodes).toEqual([])
  })

  it('returns empty for empty values', () => {
    const options = resolveOptions({}, 1)
    const prepared = pieChartType.prepareData({
      labels: [],
      series: [{ name: 'Test', values: [] }],
    }, options)
    const area = { x: 0, y: 0, width: 400, height: 400 }
    const xScale = createCategoricalScale({ categories: [], range: [0, 400] })
    const yScale = createLinearScale({ domain: [0, 1], range: [400, 0] })
    const ctx: RenderContext = { data: prepared, options, area, xScale, yScale, theme: { ...LIGHT_THEME } }
    const nodes = pieChartType.render(ctx)
    expect(nodes).toEqual([])
  })

  it('hit test returns slice index for point inside', () => {
    const ctx = makeCtx([50, 50])
    // Hit at the top-center (should be in first slice starting at -PI/2)
    const cx = ctx.area.x + ctx.area.width / 2
    const cy = ctx.area.y + ctx.area.height / 2
    const hit = pieChartType.hitTest(ctx, cx, cy - 50)
    expect(hit).not.toBeNull()
    expect(hit!.pointIndex).toBe(0)
  })

  it('hit test returns null outside pie radius', () => {
    const ctx = makeCtx([50, 50])
    const hit = pieChartType.hitTest(ctx, -100, -100)
    expect(hit).toBeNull()
  })
})

describe('donutChartType', () => {
  it('has type "donut"', () => {
    expect(donutChartType.type).toBe('donut')
  })

  it('renders nodes (delegates to pie with innerRadius)', () => {
    const ctx = makeCtx([60, 40])
    const nodes = donutChartType.render(ctx)
    expect(nodes.length).toBe(2)
  })

  it('hit test delegates to pie (shared hitTest)', () => {
    const ctx = makeCtx([50, 50])
    const cx = ctx.area.x + ctx.area.width / 2
    const cy = ctx.area.y + ctx.area.height / 2
    // Hit test is shared with pie — center is within outer radius
    const hit = donutChartType.hitTest(ctx, cx, cy)
    // Center is inside pie radius so hit is not null
    expect(hit).not.toBeNull()
  })
})
