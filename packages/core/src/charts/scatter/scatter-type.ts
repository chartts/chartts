import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareData } from '../../data/prepare'
import { group, circle } from '../../render/tree'

export const scatterChartType: ChartTypePlugin = {
  type: 'scatter',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareData(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, xScale, yScale, theme } = ctx
    const nodes: RenderNode[] = []

    for (const series of data.series) {
      const dots: RenderNode[] = []

      for (let i = 0; i < series.values.length; i++) {
        const x = xScale.map(i)
        const y = yScale.map(series.values[i]!)

        // Ambient glow
        dots.push(circle(x, y, (theme.pointRadius + 1.5) * 2.5, {
          class: 'chartts-dot-glow',
          fill: `url(#chartts-pglow-${series.index})`,
        }))

        dots.push(circle(x, y, theme.pointRadius + 1.5, {
          class: 'chartts-dot',
          fill: series.color,
          fillOpacity: 0.7,
          stroke: series.color,
          strokeWidth: 1.5,
          'data-series': series.index,
          'data-index': i,
          tabindex: 0,
          role: 'img',
          ariaLabel: `${series.name}: ${series.values[i]}`,
        }))
      }

      nodes.push(group(dots, {
        class: `chartts-series chartts-series-${series.index}`,
        'data-series-name': series.name,
      }))
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, xScale, yScale, theme } = ctx
    let best: HitResult | null = null
    let bestDist = Infinity
    const hitRadius = theme.pointRadius + 8

    for (const series of data.series) {
      for (let i = 0; i < series.values.length; i++) {
        const x = xScale.map(i)
        const y = yScale.map(series.values[i]!)
        const dist = Math.sqrt((mx - x) ** 2 + (my - y) ** 2)
        if (dist < bestDist && dist < hitRadius) {
          bestDist = dist
          best = { seriesIndex: series.index, pointIndex: i, distance: dist }
        }
      }
    }

    return best
  },
}
