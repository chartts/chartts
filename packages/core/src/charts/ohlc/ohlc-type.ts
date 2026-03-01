import type {
  ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult,
} from '../../types'
import { defineChartType } from '../../api/define'
import { prepareData } from '../../data/prepare'
import { group, line } from '../../render/tree'
import { getBandwidth } from '../../utils/scale'

export interface OHLCOptions extends ResolvedOptions {
  /** OHLC data arrays. */
  ohlc?: {
    open: number[]
    high: number[]
    low: number[]
    close: number[]
  }
  /** Up color (close >= open). Default green. */
  upColor?: string
  /** Down color (close < open). Default red. */
  downColor?: string
  /** Line width for stems and ticks. Default 1.5. */
  lineWidth?: number
}

/**
 * OHLC (Open-High-Low-Close) chart — tick-mark style.
 *
 * Each bar is a vertical line (high→low) with horizontal ticks:
 * - Left tick = open price
 * - Right tick = close price
 * Color indicates direction (green=up, red=down).
 */
export const ohlcChartType = defineChartType({
  type: 'ohlc',
  useBandScale: true,


  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    const opts = options as OHLCOptions
    const prepared = prepareData(data, options)

    // Support ohlc from options OR from 4 series named Open/High/Low/Close
    let ohlc = opts.ohlc
    if (!ohlc && data.series.length >= 4) {
      const byName: Record<string, number[]> = {}
      for (const s of data.series) byName[s.name.toLowerCase()] = s.values
      if (byName.open && byName.high && byName.low && byName.close) {
        ohlc = { open: byName.open, high: byName.high, low: byName.low, close: byName.close }
      }
    }

    if (ohlc) {
      let yMin = prepared.bounds.yMin
      let yMax = prepared.bounds.yMax
      for (let i = 0; i < ohlc.high.length; i++) {
        if (ohlc.high[i]! < yMin) yMin = ohlc.high[i]!
        if (ohlc.high[i]! > yMax) yMax = ohlc.high[i]!
        if (ohlc.low[i]! < yMin) yMin = ohlc.low[i]!
        if (ohlc.low[i]! > yMax) yMax = ohlc.low[i]!
      }
      prepared.bounds.yMin = yMin
      prepared.bounds.yMax = yMax
    }

    return prepared
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, xScale, yScale, options } = ctx
    const nodes: RenderNode[] = []

    const opts = options as OHLCOptions

    // Support ohlc from options OR from 4 series named Open/High/Low/Close
    let ohlc = opts.ohlc
    if (!ohlc && data.series.length >= 4) {
      const byName: Record<string, number[]> = {}
      for (const s of data.series) byName[s.name.toLowerCase()] = s.values
      if (byName.open && byName.high && byName.low && byName.close) {
        ohlc = { open: byName.open, high: byName.high, low: byName.low, close: byName.close }
      }
    }
    if (!ohlc) return nodes

    const series = data.series[0]
    if (!series) return nodes

    const upColor = opts.upColor ?? 'var(--color-emerald-500, #10b981)'
    const downColor = opts.downColor ?? 'var(--color-red-500, #ef4444)'
    const lw = opts.lineWidth ?? 1.5

    const bw = getBandwidth(xScale)
    const tickWidth = bw * 0.3

    const tickNodes: RenderNode[] = []

    for (let i = 0; i < ohlc.open.length; i++) {
      const open = ohlc.open[i]!
      const high = ohlc.high[i]!
      const low = ohlc.low[i]!
      const close = ohlc.close[i]!

      const cx = xScale.map(i)
      const isUp = close >= open
      const color = isUp ? upColor : downColor

      const yHigh = yScale.map(high)
      const yLow = yScale.map(low)
      const yOpen = yScale.map(open)
      const yClose = yScale.map(close)

      // Vertical stem (high → low)
      tickNodes.push(line(cx, yHigh, cx, yLow, {
        class: 'chartts-ohlc-stem',
        stroke: color,
        strokeWidth: lw,
        'data-series': 0,
        'data-index': i,
      }))

      // Left tick (open)
      tickNodes.push(line(cx - tickWidth, yOpen, cx, yOpen, {
        class: 'chartts-ohlc-tick',
        stroke: color,
        strokeWidth: lw,
        'data-series': 0,
        'data-index': i,
      }))

      // Right tick (close)
      tickNodes.push(line(cx, yClose, cx + tickWidth, yClose, {
        class: 'chartts-ohlc-tick',
        stroke: color,
        strokeWidth: lw,
        'data-series': 0,
        'data-index': i,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${data.labels[i] ?? i}: O${open} H${high} L${low} C${close}`,
      }))
    }

    nodes.push(group(tickNodes, {
      class: 'chartts-series chartts-series-0',
      'data-series-name': series.name,
    }))

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, _my: number): HitResult | null {
    const { data, xScale, yScale, options } = ctx
    const opts = options as OHLCOptions
    let ohlc = opts.ohlc
    if (!ohlc && data.series.length >= 4) {
      const byName: Record<string, number[]> = {}
      for (const s of data.series) byName[s.name.toLowerCase()] = s.values
      if (byName.open && byName.high && byName.low && byName.close) {
        ohlc = { open: byName.open, high: byName.high, low: byName.low, close: byName.close }
      }
    }
    if (!ohlc) return null

    const bw = getBandwidth(xScale)
    const half = bw * 0.35

    for (let i = 0; i < ohlc.open.length; i++) {
      const cx = xScale.map(i)
      if (mx >= cx - half && mx <= cx + half) {
        return { seriesIndex: 0, pointIndex: i, distance: Math.abs(mx - cx), x: cx, y: yScale.map(ohlc.close[i]!) }
      }
    }

    return null
  },
})
