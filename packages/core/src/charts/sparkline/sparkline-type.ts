import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareData } from '../../data/prepare'
import { path } from '../../render/tree'
import { PathBuilder } from '../../render/tree'
import { formatNum } from '../../utils/format'

/**
 * Sparkline — tiny inline chart with no axes, no labels, no legend.
 * Just the line/area and optionally a highlight of the last value.
 */
export const sparklineChartType: ChartTypePlugin = {
  type: 'sparkline',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    // Override: sparklines don't need axes/legend space
    const prepared = prepareData(data, {
      ...options,
      xAxis: false,
      yAxis: false,
      legend: false,
      xGrid: false,
      yGrid: false,
      padding: [2, 2, 2, 2],
    })
    return prepared
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, xScale, yScale } = ctx
    const nodes: RenderNode[] = []
    const series = data.series[0]
    if (!series || series.values.length === 0) return nodes

    const values = series.values
    const points = values.map((v, i) => ({
      x: xScale.map(i),
      y: yScale.map(v),
    }))

    // Build monotone path
    const linePath = buildSparklinePath(points)

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
    // Sparklines typically don't need hit testing
    return null
  },
}

function buildSparklinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M${formatNum(points[0]!.x)},${formatNum(points[0]!.y)}`

  // Simple monotone interpolation
  const pb = new PathBuilder()
  pb.moveTo(points[0]!.x, points[0]!.y)

  if (points.length === 2) {
    pb.lineTo(points[1]!.x, points[1]!.y)
    return pb.build()
  }

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]!
    const p1 = points[i]!
    const p2 = points[i + 1]!
    const p3 = points[Math.min(points.length - 1, i + 2)]!

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    pb.curveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
  }

  return pb.build()
}
