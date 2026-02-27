import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../types'
import { prepareData } from '../data/prepare'

/**
 * Define a chart type with sensible defaults.
 *
 * Only `type` and `render` are required. Everything else has defaults:
 * - getScaleTypes: categorical x, linear y
 * - prepareData: standard data preparation
 * - hitTest: returns null (no interaction)
 */
export function defineChartType(
  config: {
    type: string
    suppressAxes?: boolean
    useBandScale?: boolean
    getScaleTypes?: () => { x: ScaleType; y: ScaleType }
    prepareData?: (data: ChartData, options: ResolvedOptions) => PreparedData
    render: (ctx: RenderContext) => RenderNode[]
    hitTest?: (ctx: RenderContext, x: number, y: number) => HitResult | null
    getHighlightNodes?: (ctx: RenderContext, hit: HitResult) => RenderNode[]
  },
): ChartTypePlugin {
  return {
    type: config.type,
    suppressAxes: config.suppressAxes,
    useBandScale: config.useBandScale,
    getScaleTypes: config.getScaleTypes ?? (() => ({ x: 'categorical' as ScaleType, y: 'linear' as ScaleType })),
    prepareData: config.prepareData ?? ((data, options) => prepareData(data, options)),
    render: config.render,
    hitTest: config.hitTest ?? (() => null),
    getHighlightNodes: config.getHighlightNodes,
  }
}
