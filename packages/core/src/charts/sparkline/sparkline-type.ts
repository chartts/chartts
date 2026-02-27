import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareData } from '../../data/prepare'
import { path } from '../../render/tree'
import { buildMonotonePath, type Point } from '../../utils/curves'
import { formatNum } from '../../utils/format'

/**
 * Sparkline — tiny inline chart with no axes, no labels, no legend.
 * Just the line/area and optionally a highlight of the last value.
 */
export const sparklineChartType: ChartTypePlugin = {
  type: 'sparkline',
  suppressAxes: true,

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareData(data, {
      ...options,
      xAxis: false,
      yAxis: false,
      legend: false,
      xGrid: false,
      yGrid: false,
      padding: [2, 2, 2, 2],
    })
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, xScale, yScale } = ctx
    const nodes: RenderNode[] = []
    const series = data.series[0]
    if (!series || series.values.length === 0) return nodes

    const points: Point[] = series.values.map((v, i) => ({
      x: xScale.map(i),
      y: yScale.map(v),
    }))

    const linePath = buildMonotonePath(points)

    // Area fill
    const baseline = area.y + area.height
    const first = points[0]!
    const last = points[points.length - 1]!
    const areaPath = `${linePath}L${formatNum(last.x)},${formatNum(baseline)}L${formatNum(first.x)},${formatNum(baseline)}Z`

    nodes.push(path(areaPath, {
      class: 'chartts-sparkline-area',
      fill: series.color,
      fillOpacity: 0.15,
    }))

    nodes.push(path(linePath, {
      class: 'chartts-sparkline-line',
      stroke: series.color,
      strokeWidth: 1.5,
    }))

    // Last point indicator
    if (points.length > 0) {
      const lp = points[points.length - 1]!
      nodes.push({
        type: 'circle',
        cx: lp.x,
        cy: lp.y,
        r: 2.5,
        attrs: {
          class: 'chartts-sparkline-dot',
          fill: series.color,
        },
      })
    }

    return nodes
  },

  hitTest(): HitResult | null {
    return null
  },
}
