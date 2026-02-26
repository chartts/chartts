import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareNoAxes } from '../../utils/prepare'
import { text } from '../../render/tree'

/**
 * Custom chart — meta chart type that delegates rendering to a user function.
 *
 * Options:
 * - renderFn: (ctx: RenderContext) => RenderNode[]
 * - hitTestFn: (ctx: RenderContext, mx: number, my: number) => HitResult | null
 * - scaleTypes: { x: ScaleType; y: ScaleType } (default categorical/linear)
 *
 * If no renderFn is provided, renders a placeholder message.
 */

export interface CustomChartOptions {
  renderFn?: (ctx: RenderContext) => RenderNode[]
  hitTestFn?: (ctx: RenderContext, mx: number, my: number) => HitResult | null
  scaleTypes?: { x: ScaleType; y: ScaleType }
}

export const customChartType: ChartTypePlugin = {
  type: 'custom',

  getScaleTypes(_data?: ChartData, options?: ResolvedOptions): { x: ScaleType; y: ScaleType } {
    const cOpts = options as unknown as CustomChartOptions | undefined
    return cOpts?.scaleTypes ?? { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const cOpts = ctx.options as unknown as CustomChartOptions

    if (cOpts.renderFn) {
      return cOpts.renderFn(ctx)
    }

    // Placeholder when no render function is provided
    const { area, theme } = ctx
    return [
      text(
        area.x + area.width / 2,
        area.y + area.height / 2,
        'Custom chart — provide renderFn in options',
        {
          class: 'chartts-custom-placeholder',
          fill: theme.textMuted,
          textAnchor: 'middle',
          dominantBaseline: 'central',
          fontSize: theme.fontSize,
          fontFamily: theme.fontFamily,
        },
      ),
    ]
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const cOpts = ctx.options as unknown as CustomChartOptions
    if (cOpts.hitTestFn) {
      return cOpts.hitTestFn(ctx, mx, my)
    }
    return null
  },
}
