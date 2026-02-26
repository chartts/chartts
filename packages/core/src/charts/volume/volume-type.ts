import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareData } from '../../data/prepare'
import { group, rect } from '../../render/tree'
import { getBandwidth } from '../../utils/scale'

export interface VolumeOptions {
  /** Explicit direction per bar: 'up' or 'down'. Auto-detected if omitted. */
  directions?: ('up' | 'down')[]
  /** Up color (volume on up-price day). Default green. */
  upColor?: string
  /** Down color (volume on down-price day). Default red. */
  downColor?: string
  /** Gap between bars as fraction of bandwidth. Default 0.2. */
  gap?: number
}

/**
 * Volume chart — vertical bars colored by price direction.
 *
 * Essential companion to candlestick/OHLC price charts.
 * Green bars = volume on up days, red bars = volume on down days.
 */
export const volumeChartType: ChartTypePlugin = {
  type: 'volume',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    const prepared = prepareData(data, options)
    // Volume always starts at zero
    if (prepared.bounds.yMin > 0) prepared.bounds.yMin = 0
    return prepared
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, xScale, yScale, area, options } = ctx
    const nodes: RenderNode[] = []

    const series = data.series[0]
    if (!series) return nodes

    const opts = options as unknown as VolumeOptions
    const upColor = opts.upColor ?? 'var(--color-emerald-500, #10b981)'
    const downColor = opts.downColor ?? 'var(--color-red-500, #ef4444)'
    const gapFrac = opts.gap ?? 0.2

    const bw = getBandwidth(xScale)
    const barWidth = bw * (1 - gapFrac)
    const baseline = area.y + area.height

    // Auto-detect direction: current value vs previous
    const directions = opts.directions ?? series.values.map((v, i) =>
      i === 0 ? 'up' as const : (v >= series.values[i - 1]! ? 'up' as const : 'down' as const),
    )

    const barNodes: RenderNode[] = []

    for (let i = 0; i < series.values.length; i++) {
      const val = series.values[i]!
      const cx = xScale.map(i)
      const yTop = yScale.map(val)
      const barHeight = Math.max(baseline - yTop, 1)
      const dir = directions[i] ?? 'up'
      const color = dir === 'up' ? upColor : downColor

      barNodes.push(rect(cx - barWidth / 2, yTop, barWidth, barHeight, {
        rx: 1, ry: 1,
        class: 'chartts-volume-bar',
        fill: color,
        fillOpacity: 0.85,
        'data-series': 0,
        'data-index': i,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${data.labels[i] ?? i}: ${val} (${dir})`,
      }))
    }

    nodes.push(group(barNodes, {
      class: 'chartts-series chartts-series-0',
      'data-series-name': series.name,
    }))

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, xScale, yScale, area, options } = ctx
    const series = data.series[0]
    if (!series) return null

    const opts = options as unknown as VolumeOptions
    const gapFrac = opts.gap ?? 0.2
    const bw = getBandwidth(xScale)
    const barWidth = bw * (1 - gapFrac)
    const baseline = area.y + area.height

    for (let i = 0; i < series.values.length; i++) {
      const cx = xScale.map(i)
      const yTop = yScale.map(series.values[i]!)
      if (mx >= cx - barWidth / 2 && mx <= cx + barWidth / 2 && my >= yTop && my <= baseline) {
        return { seriesIndex: 0, pointIndex: i, distance: Math.abs(mx - cx) }
      }
    }

    return null
  },
}
