import type {
  RenderContext, RenderNode, HitResult,
} from '../../types'
import { defineChartType } from '../../api/define'
import { group, circle } from '../../render/tree'
import { nearestPointHitTest } from '../../utils/hit-test'

export const scatterChartType = defineChartType({
  type: 'scatter',



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
    return nearestPointHitTest(ctx, mx, my, ctx.theme.pointRadius + 8)
  },
})
