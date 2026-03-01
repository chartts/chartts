import type {
  ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult,
} from '../../types'
import { defineChartType } from '../../api/define'
import { lineChartType } from '../line/line-type'

/**
 * Area chart — line chart with fill enabled on all series by default.
 * Delegates entirely to lineChartType after forcing fill:true.
 */
export const areaChartType = defineChartType({
  type: 'area',


  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    // Force fill on all series
    const filled: ChartData = {
      ...data,
      series: data.series.map(s => ({
        ...s,
        fill: s.fill ?? true,
        fillOpacity: s.fillOpacity ?? 0.25,
      })),
    }
    return lineChartType.prepareData(filled, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    return lineChartType.render(ctx)
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    return lineChartType.hitTest(ctx, mx, my)
  },
})
