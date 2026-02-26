import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareData } from '../../data/prepare'
import { group, rect } from '../../render/tree'
import { getBandwidth } from '../../utils/scale'

/**
 * Histogram chart — bars touch each other (no gap), representing frequency distribution.
 *
 * Uses the same data format as bar chart. The key differences:
 * - Zero gap between bars
 * - Bars fill the full bandwidth
 * - Designed for continuous data ranges
 */
export const histogramChartType: ChartTypePlugin = {
  type: 'histogram',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    const prepared = prepareData(data, options)
    if (options.yMin === undefined && prepared.bounds.yMin > 0) {
      prepared.bounds.yMin = 0
    }
    return prepared
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, options, xScale, yScale } = ctx
    const nodes: RenderNode[] = []

    const series = data.series[0]
    if (!series || series.values.length === 0) return nodes

    const bw = getBandwidth(xScale)
    // Histograms have no gap — bars touch
    const barWidth = bw
    const baseline = yScale.map(Math.max(0, yScale.getDomain()[0] as number))

    const barNodes: RenderNode[] = []

    for (let i = 0; i < series.values.length; i++) {
      const value = series.values[i]!
      const cx = xScale.map(i)
      const barX = cx - barWidth / 2
      const vy = yScale.map(value)

      const y = value >= 0 ? vy : baseline
      const h = Math.abs(vy - baseline)
      if (h < 0.5) continue

      const colorIndex = i % options.colors.length
      const barFill = `url(#chartts-bar-${colorIndex})`

      barNodes.push(rect(barX, y, barWidth, h, {
        rx: 2, ry: 2,
        class: 'chartts-bar chartts-histogram-bar',
        fill: barFill,
        stroke: series.color,
        strokeWidth: 0.5,
        'data-series': 0,
        'data-index': i,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${data.labels[i]}: ${value}`,
      }))
    }

    nodes.push(group(barNodes, {
      class: 'chartts-series chartts-series-0',
      'data-series-name': series.name,
    }))

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, xScale, yScale } = ctx
    const series = data.series[0]
    if (!series || series.values.length === 0) return null

    const bw = getBandwidth(xScale)
    const barWidth = bw
    const baseline = yScale.map(Math.max(0, yScale.getDomain()[0] as number))

    for (let i = 0; i < series.values.length; i++) {
      const cx = xScale.map(i)
      const barX = cx - barWidth / 2
      const vy = yScale.map(series.values[i]!)
      const y = series.values[i]! >= 0 ? vy : baseline
      const h = Math.abs(vy - baseline)

      if (mx >= barX - 1 && mx <= barX + barWidth + 1 && my >= y - 2 && my <= y + h + 2) {
        return { seriesIndex: 0, pointIndex: i, distance: 0 }
      }
    }

    return null
  },
}
