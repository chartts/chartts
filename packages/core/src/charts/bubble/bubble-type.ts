import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareData } from '../../data/prepare'
import { group, circle } from '../../render/tree'

export interface BubbleOptions {
  /** Sizes array per series. Each entry maps 1:1 to values. */
  sizes?: number[][]
  /** Min bubble radius in px. Default 4. */
  minRadius?: number
  /** Max bubble radius in px. Default 30. */
  maxRadius?: number
}

/**
 * Bubble chart — scatter with variable-radius circles.
 * Pass sizes via options: `{ sizes: [[10, 20, 5, ...], ...] }`
 */
export const bubbleChartType: ChartTypePlugin = {
  type: 'bubble',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareData(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, xScale, yScale } = ctx
    const nodes: RenderNode[] = []

    const bOpts = ctx.options as unknown as BubbleOptions
    const allSizes = bOpts.sizes ?? []
    const minR = bOpts.minRadius ?? 4
    const maxR = bOpts.maxRadius ?? 30

    // Find global size range for normalization
    let sizeMin = Infinity
    let sizeMax = -Infinity
    for (const sizes of allSizes) {
      for (const s of sizes) {
        if (s < sizeMin) sizeMin = s
        if (s > sizeMax) sizeMax = s
      }
    }
    if (!isFinite(sizeMin)) { sizeMin = 1; sizeMax = 1 }
    const sizeRange = sizeMax - sizeMin || 1

    for (const series of data.series) {
      const sizes = allSizes[series.index] ?? []
      const dots: RenderNode[] = []

      for (let i = 0; i < series.values.length; i++) {
        const x = xScale.map(i)
        const y = yScale.map(series.values[i]!)
        const rawSize = sizes[i] ?? 1
        const normalized = (rawSize - sizeMin) / sizeRange
        const r = minR + normalized * (maxR - minR)

        dots.push(circle(x, y, r, {
          class: 'chartts-bubble',
          fill: series.color,
          fillOpacity: 0.5,
          stroke: series.color,
          strokeWidth: 1.5,
          'data-series': series.index,
          'data-index': i,
          tabindex: 0,
          role: 'img',
          ariaLabel: `${series.name}: ${series.values[i]} (size: ${rawSize})`,
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
    const { data, xScale, yScale } = ctx
    const bOpts = ctx.options as unknown as BubbleOptions
    const allSizes = bOpts.sizes ?? []
    const minR = bOpts.minRadius ?? 4
    const maxR = bOpts.maxRadius ?? 30

    let sizeMin = Infinity
    let sizeMax = -Infinity
    for (const sizes of allSizes) {
      for (const s of sizes) {
        if (s < sizeMin) sizeMin = s
        if (s > sizeMax) sizeMax = s
      }
    }
    if (!isFinite(sizeMin)) { sizeMin = 1; sizeMax = 1 }
    const sizeRange = sizeMax - sizeMin || 1

    let best: HitResult | null = null
    let bestDist = Infinity

    for (const series of data.series) {
      const sizes = allSizes[series.index] ?? []
      for (let i = 0; i < series.values.length; i++) {
        const x = xScale.map(i)
        const y = yScale.map(series.values[i]!)
        const rawSize = sizes[i] ?? 1
        const normalized = (rawSize - sizeMin) / sizeRange
        const r = minR + normalized * (maxR - minR)

        const dist = Math.sqrt((mx - x) ** 2 + (my - y) ** 2)
        if (dist < r + 4 && dist < bestDist) {
          bestDist = dist
          best = { seriesIndex: series.index, pointIndex: i, distance: dist, x, y }
        }
      }
    }

    return best
  },
}
