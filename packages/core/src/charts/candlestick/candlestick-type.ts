import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareData } from '../../data/prepare'
import { group, rect } from '../../render/tree'
import { getBandwidth } from '../../utils/scale'

export interface CandlestickOptions {
  /** OHLC data: { open, high, low, close } arrays. */
  ohlc?: {
    open: number[]
    high: number[]
    low: number[]
    close: number[]
  }
  /** Up candle color. Default green. */
  upColor?: string
  /** Down candle color. Default red. */
  downColor?: string
  /** Wick width. Default 1.5. */
  wickWidth?: number
}

/**
 * Candlestick / OHLC chart for financial data.
 *
 * Pass OHLC data via options:
 * ```ts
 * Candlestick('#el', {
 *   data: { labels: ['Mon','Tue','Wed'], series: [{ name: 'AAPL', values: [150, 152, 148] }] },
 *   ohlc: {
 *     open:  [148, 150, 152],
 *     high:  [153, 155, 154],
 *     low:   [146, 149, 147],
 *     close: [150, 152, 148],
 *   }
 * })
 * ```
 * The series values are used as close prices for scale computation.
 */
export const candlestickChartType: ChartTypePlugin = {
  type: 'candlestick',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    const cOpts = options as unknown as CandlestickOptions
    const ohlc = cOpts.ohlc

    // Expand bounds to include all OHLC values
    const prepared = prepareData(data, options)

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

    const cOpts = options as unknown as CandlestickOptions
    const ohlc = cOpts.ohlc
    if (!ohlc) return nodes

    const series = data.series[0]
    if (!series) return nodes

    const upColor = cOpts.upColor ?? 'var(--color-emerald-500, #10b981)'
    const downColor = cOpts.downColor ?? 'var(--color-red-500, #ef4444)'
    const wickWidth = cOpts.wickWidth ?? 1.5

    // Get bandwidth for candle width
    const bw = getBandwidth(xScale)
    const candleWidth = bw * 0.6

    const candleNodes: RenderNode[] = []

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

      const bodyTop = Math.min(yOpen, yClose)
      const bodyHeight = Math.max(Math.abs(yOpen - yClose), 1)

      // Wick (high-low line)
      candleNodes.push({
        type: 'line',
        x1: cx,
        y1: yHigh,
        x2: cx,
        y2: yLow,
        attrs: {
          class: 'chartts-wick',
          stroke: color,
          strokeWidth: wickWidth,
          'data-series': 0,
          'data-index': i,
        },
      })

      // Body (open-close rect)
      candleNodes.push(rect(cx - candleWidth / 2, bodyTop, candleWidth, bodyHeight, {
        rx: 2, ry: 2,
        class: 'chartts-candle',
        fill: isUp ? color : color,
        stroke: color,
        strokeWidth: 1,
        'data-series': 0,
        'data-index': i,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${data.labels[i] ?? i}: O${open} H${high} L${low} C${close}`,
      }))
    }

    nodes.push(group(candleNodes, {
      class: 'chartts-series chartts-series-0',
      'data-series-name': series.name,
    }))

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, _my: number): HitResult | null {
    const { xScale, options } = ctx
    const cOpts = options as unknown as CandlestickOptions
    const ohlc = cOpts.ohlc
    if (!ohlc) return null

    const bw = getBandwidth(xScale)
    const candleWidth = bw * 0.6

    for (let i = 0; i < ohlc.open.length; i++) {
      const cx = xScale.map(i)
      if (mx >= cx - candleWidth / 2 - 4 && mx <= cx + candleWidth / 2 + 4) {
        return { seriesIndex: 0, pointIndex: i, distance: Math.abs(mx - cx) }
      }
    }

    return null
  },
}
