import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { lineChartType } from '../line/line-type'

/**
 * Step chart — line chart with stair-step interpolation.
 *
 * Delegates entirely to lineChartType after forcing curve:'step'.
 * Used for: interest rates, order books, discrete pricing tiers.
 */
export const stepChartType: ChartTypePlugin = {
  type: 'step',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return lineChartType.prepareData(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    // Force step interpolation
    const stepCtx = {
      ...ctx,
      options: { ...ctx.options, curve: 'step' as const },
    }
    return lineChartType.render(stepCtx)
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    return lineChartType.hitTest(ctx, mx, my)
  },
}
