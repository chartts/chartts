import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { CSS_PREFIX } from '../../constants'
import { prepareData } from '../../data/prepare'
import { group, path, circle } from '../../render/tree'
import { buildLinePath, buildAreaPath } from '../../utils/curves'
import { nearestPointHitTest } from '../../utils/hit-test'

export const lineChartType: ChartTypePlugin = {
  type: 'line',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareData(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, options, area, xScale, yScale, theme } = ctx
    const nodes: RenderNode[] = []

    for (const series of data.series) {
      const seriesNodes: RenderNode[] = []

      // Build line path
      const linePath = buildLinePath(series.values, xScale, yScale, options.curve)

      // Area fill (if enabled) — use gradient for premium look
      if (series.fill) {
        const areaPath = buildAreaPath(
          series.values, xScale, yScale, area, options.curve,
        )
        seriesNodes.push(path(areaPath, {
          class: 'chartts-area',
          fill: `url(#chartts-area-${series.index})`,
          'data-series': series.index,
        }))
      }

      const dash = series.style === 'dashed' ? '6,4'
        : series.style === 'dotted' ? '2,3' : undefined

      // Main line
      seriesNodes.push(path(linePath, {
        class: 'chartts-line',
        stroke: series.color,
        strokeWidth: theme.lineWidth,
        strokeDasharray: dash,
        'data-series': series.index,
      }))

      // Data points with ambient glow
      if (series.showPoints) {
        for (let i = 0; i < series.values.length; i++) {
          if (isNaN(series.values[i]!)) continue // skip missing data
          const x = xScale.map(i)
          const y = yScale.map(series.values[i]!)

          // Ambient glow behind point
          seriesNodes.push(circle(x, y, theme.pointRadius * 3, {
            class: 'chartts-point-glow',
            fill: `url(#chartts-pglow-${series.index})`,
          }))

          seriesNodes.push(circle(x, y, theme.pointRadius, {
            class: 'chartts-point',
            fill: series.color,
            stroke: `var(${CSS_PREFIX}-bg, #fff)`,
            strokeWidth: 2,
            'data-series': series.index,
            'data-index': i,
            tabindex: 0,
            role: 'img',
            ariaLabel: `${series.name}: ${series.values[i]}`,
          }))
        }
      }

      nodes.push(group(seriesNodes, {
        class: `chartts-series chartts-series-${series.index}`,
        'data-series-name': series.name,
      }))
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    return nearestPointHitTest(ctx, mx, my, 30)
  },
}
