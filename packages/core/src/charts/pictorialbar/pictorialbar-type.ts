import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareNoAxes } from '../../utils/prepare'
import { group, path, text } from '../../render/tree'

/**
 * PictorialBar chart — bar chart where bars are filled with repeated symbols.
 *
 * Data convention:
 * - labels: category names
 * - series[0].values: bar values
 *
 * The bars are made of stacked symbols (circles, diamonds, or custom shapes)
 * creating a pictograph/isotype visualization.
 */

export interface PictorialBarOptions {
  /** Symbol shape. Default 'circle'. */
  symbol?: 'circle' | 'diamond' | 'square' | 'triangle' | 'star'
  /** Symbol size in px. Default 12. */
  symbolSize?: number
  /** Gap between symbols. Default 2. */
  symbolGap?: number
  /** Show value labels. Default true. */
  showValues?: boolean
}

// SVG path data for symbols (centered at 0,0, size 1x1)
const SYMBOL_PATHS: Record<string, string> = {
  circle: 'M0.5,0A0.5,0.5,0,1,1,-0.5,0A0.5,0.5,0,1,1,0.5,0Z',
  diamond: 'M0,-0.5L0.5,0L0,0.5L-0.5,0Z',
  square: 'M-0.4,-0.4L0.4,-0.4L0.4,0.4L-0.4,0.4Z',
  triangle: 'M0,-0.5L0.5,0.4L-0.5,0.4Z',
  star: 'M0,-0.5L0.15,-0.15L0.5,-0.15L0.22,0.07L0.31,0.45L0,0.22L-0.31,0.45L-0.22,0.07L-0.5,-0.15L-0.15,-0.15Z',
}

export const pictorialBarChartType: ChartTypePlugin = {
  type: 'pictorialbar',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme, options } = ctx
    const nodes: RenderNode[] = []

    const series = data.series[0]
    if (!series || series.values.length === 0) return nodes

    const pOpts = options as unknown as PictorialBarOptions
    const symbolShape = pOpts.symbol ?? 'circle'
    const symbolSize = pOpts.symbolSize ?? 14
    const symbolGap = pOpts.symbolGap ?? 2
    const showValues = pOpts.showValues ?? true

    const values = series.values
    const maxVal = Math.max(...values.map(Math.abs))
    if (maxVal === 0) return nodes

    const barCount = values.length
    const barGap = 16
    const barWidth = Math.min(
      (area.width - barGap * (barCount + 1)) / barCount,
      symbolSize * 3,
    )
    const totalWidth = barCount * barWidth + (barCount - 1) * barGap
    const startX = area.x + (area.width - totalWidth) / 2

    const symbolStep = symbolSize + symbolGap
    const maxSymbols = Math.floor((area.height - 30) / symbolStep)

    for (let i = 0; i < barCount; i++) {
      const val = Math.abs(values[i]!)
      const symbolCount = Math.max(1, Math.round((val / maxVal) * maxSymbols))
      const color = options.colors[i % options.colors.length]!
      const cx = startX + i * (barWidth + barGap) + barWidth / 2
      const barNodes: RenderNode[] = []

      for (let s = 0; s < symbolCount; s++) {
        const sy = area.y + area.height - 20 - s * symbolStep - symbolSize / 2

        if (symbolShape === 'circle') {
          barNodes.push({
            type: 'circle',
            cx,
            cy: sy,
            r: symbolSize / 2,
            attrs: {
              class: 'chartts-pictorialbar-symbol',
              fill: color,
              fillOpacity: 0.85,
              'data-series': 0,
              'data-index': i,
            },
          })
        } else {
          // Use path-based symbols
          const symbolPath = SYMBOL_PATHS[symbolShape] ?? SYMBOL_PATHS.circle!
          barNodes.push(path(symbolPath, {
            class: 'chartts-pictorialbar-symbol',
            fill: color,
            fillOpacity: 0.85,
            transform: `translate(${cx},${sy}) scale(${symbolSize})`,
            'data-series': 0,
            'data-index': i,
          }))
        }
      }

      // Value label above bar
      if (showValues) {
        const topY = area.y + area.height - 20 - (symbolCount - 1) * symbolStep - symbolSize
        barNodes.push(text(cx, topY - 8, String(values[i]!), {
          class: 'chartts-pictorialbar-value',
          fill: theme.textColor,
          textAnchor: 'middle',
          dominantBaseline: 'auto',
          fontSize: theme.fontSizeSmall,
          fontFamily: theme.fontFamily,
          fontWeight: 600,
        }))
      }

      // Category label below
      barNodes.push(text(cx, area.y + area.height - 4, String(data.labels[i] ?? `Cat ${i + 1}`), {
        class: 'chartts-pictorialbar-label',
        fill: theme.textMuted,
        textAnchor: 'middle',
        dominantBaseline: 'auto',
        fontSize: theme.fontSizeSmall,
        fontFamily: theme.fontFamily,
      }))

      nodes.push(group(barNodes, {
        class: `chartts-series chartts-series-${i}`,
        'data-series-name': String(data.labels[i] ?? `Cat ${i + 1}`),
      }))
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, _my: number): HitResult | null {
    const { data, area } = ctx
    const series = data.series[0]
    if (!series || series.values.length === 0) return null

    const pOpts = ctx.options as unknown as PictorialBarOptions
    const symbolSize = pOpts.symbolSize ?? 14

    const barCount = series.values.length
    const barGap = 16
    const barWidth = Math.min(
      (area.width - barGap * (barCount + 1)) / barCount,
      symbolSize * 3,
    )
    const totalWidth = barCount * barWidth + (barCount - 1) * barGap
    const startX = area.x + (area.width - totalWidth) / 2

    for (let i = 0; i < barCount; i++) {
      const cx = startX + i * (barWidth + barGap) + barWidth / 2
      if (Math.abs(mx - cx) < barWidth / 2 + 5) {
        return { seriesIndex: 0, pointIndex: i, distance: Math.abs(mx - cx), x: cx, y: area.y + area.height / 2 }
      }
    }

    return null
  },
}
