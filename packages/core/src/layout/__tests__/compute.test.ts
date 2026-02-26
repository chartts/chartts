import { describe, it, expect } from 'vitest'
import { computeLayout } from '../compute'
import { resolveOptions } from '../../constants'
import { prepareData } from '../../data/prepare'

function makeData(yValues: number[]) {
  const opts = resolveOptions({}, 1)
  return prepareData({
    labels: yValues.map((_, i) => String(i)),
    series: [{ name: 'A', values: yValues }],
  }, opts)
}

describe('computeLayout', () => {
  it('produces a valid chart area', () => {
    const opts = resolveOptions({}, 1)
    const data = makeData([10, 20, 30])
    const { area } = computeLayout(600, 400, opts, data)

    expect(area.x).toBeGreaterThan(0)
    expect(area.y).toBeGreaterThan(0)
    expect(area.width).toBeGreaterThan(0)
    expect(area.height).toBeGreaterThan(0)
    expect(area.x + area.width).toBeLessThanOrEqual(600)
    expect(area.y + area.height).toBeLessThanOrEqual(400)
  })

  it('reserves space for y-axis labels', () => {
    const opts = resolveOptions({ yAxis: true }, 1)
    const data = makeData([10, 20, 30])
    const { area } = computeLayout(600, 400, opts, data)
    expect(area.x).toBeGreaterThan(20)
  })

  it('reserves space for x-axis labels', () => {
    const opts = resolveOptions({ xAxis: true }, 1)
    const data = makeData([10, 20, 30])
    const { area } = computeLayout(600, 400, opts, data)
    expect(area.y + area.height).toBeLessThan(400)
  })

  it('reserves space for legend', () => {
    const optsWithLegend = resolveOptions({ legend: 'top' }, 2)
    const optsNoLegend = resolveOptions({ legend: false }, 1)
    const data = makeData([10, 20, 30])
    const { area: withLegend } = computeLayout(600, 400, optsWithLegend, data)
    const { area: noLegend } = computeLayout(600, 400, optsNoLegend, data)
    expect(withLegend.y).toBeGreaterThan(noLegend.y)
  })

  it('reserves space for axis labels', () => {
    const optsLabel = resolveOptions({ xLabel: 'Time', yLabel: 'Value' }, 1)
    const optsNoLabel = resolveOptions({}, 1)
    const data = makeData([10, 20, 30])
    const { area: withLabels } = computeLayout(600, 400, optsLabel, data)
    const { area: noLabels } = computeLayout(600, 400, optsNoLabel, data)
    expect(withLabels.width).toBeLessThan(noLabels.width)
  })

  it('handles very small container', () => {
    const opts = resolveOptions({}, 1)
    const data = makeData([10, 20])
    const { area } = computeLayout(50, 50, opts, data)
    expect(area.width).toBeGreaterThanOrEqual(0)
    expect(area.height).toBeGreaterThanOrEqual(0)
  })
})
