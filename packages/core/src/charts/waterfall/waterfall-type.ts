import type {
  ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult,
} from '../../types'
import { defineChartType } from '../../api/define'
import { prepareData } from '../../data/prepare'
import { group, rect } from '../../render/tree'
import { getBandwidth } from '../../utils/scale'

export interface WaterfallOptions extends ResolvedOptions {
  /** Indices that represent totals (absolute, not cumulative). Default: last index. */
  totals?: number[]
  /** Up color. Default emerald. */
  upColor?: string
  /** Down color. Default red. */
  downColor?: string
  /** Total color. Default blue. */
  totalColor?: string
  /** Show connector lines between bars. Default true. */
  connectors?: boolean
}

/**
 * Waterfall chart — running totals with floating bars.
 * Each value is a delta from the previous running total.
 * Positive = up (green), negative = down (red), totals = absolute (blue).
 */
export const waterfallChartType = defineChartType({
  type: 'waterfall',
  useBandScale: true,


  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    const prepared = prepareData(data, options)

    const wOpts = options as WaterfallOptions
    const series = data.series[0]
    if (!series) return prepared

    const totals = new Set(wOpts.totals ?? [series.values.length - 1])

    // Compute running totals to find proper y bounds
    let running = 0
    let yMin = 0
    let yMax = 0
    for (let i = 0; i < series.values.length; i++) {
      if (totals.has(i)) {
        running = series.values[i]!
      } else {
        running += series.values[i]!
      }
      if (running < yMin) yMin = running
      if (running > yMax) yMax = running
    }

    // Include 0 in range
    prepared.bounds.yMin = Math.min(0, yMin)
    prepared.bounds.yMax = Math.max(0, yMax)

    return prepared
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, xScale, yScale, options, theme } = ctx
    const nodes: RenderNode[] = []

    const series = data.series[0]
    if (!series || series.values.length === 0) return nodes

    const wOpts = options as WaterfallOptions
    const totals = new Set(wOpts.totals ?? [series.values.length - 1])
    const upColor = wOpts.upColor ?? 'var(--color-emerald-500, #10b981)'
    const downColor = wOpts.downColor ?? 'var(--color-red-500, #ef4444)'
    const totalColor = wOpts.totalColor ?? 'var(--color-blue-500, #3b82f6)'
    const showConnectors = wOpts.connectors ?? true

    const bw = getBandwidth(xScale)
    const barWidth = bw * 0.6
    const barNodes: RenderNode[] = []
    const connectorNodes: RenderNode[] = []

    let running = 0
    let prevTop = yScale.map(0)

    for (let i = 0; i < series.values.length; i++) {
      const val = series.values[i]!
      const cx = xScale.map(i)
      const isTotal = totals.has(i)

      let barTop: number
      let barBottom: number
      let color: string

      if (isTotal) {
        // Total bar: from 0 to the value
        running = val
        barTop = yScale.map(Math.max(0, val))
        barBottom = yScale.map(Math.min(0, val))
        color = totalColor
      } else {
        // Delta bar: from running to running + val
        const from = running
        running += val
        barTop = yScale.map(Math.max(from, running))
        barBottom = yScale.map(Math.min(from, running))
        color = val >= 0 ? upColor : downColor
      }

      const barH = Math.max(barBottom - barTop, 1)

      barNodes.push(rect(cx - barWidth / 2, barTop, barWidth, barH, {
        rx: 3, ry: 3,
        class: 'chartts-waterfall-bar',
        fill: color,
        'data-series': 0,
        'data-index': i,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${data.labels[i] ?? i}: ${val}${isTotal ? ' (total)' : ''}`,
      }))

      // Connector line from previous bar's end to this bar's start
      if (showConnectors && i > 0 && !isTotal) {
        connectorNodes.push({
          type: 'line',
          x1: xScale.map(i - 1) + barWidth / 2,
          y1: prevTop,
          x2: cx - barWidth / 2,
          y2: prevTop,
          attrs: {
            class: 'chartts-waterfall-connector',
            stroke: theme.gridColor,
            strokeWidth: 1,
            strokeDasharray: '3,2',
          },
        })
      }

      prevTop = barTop
    }

    if (connectorNodes.length > 0) {
      nodes.push(group(connectorNodes, { class: 'chartts-waterfall-connectors' }))
    }

    nodes.push(group(barNodes, {
      class: 'chartts-series chartts-series-0',
      'data-series-name': series.name,
    }))

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, _my: number): HitResult | null {
    const { data, xScale, yScale, options } = ctx
    const series = data.series[0]
    if (!series) return null

    const wOpts = options as WaterfallOptions
    const totals = new Set(wOpts.totals ?? [series.values.length - 1])
    const bw = getBandwidth(xScale)
    const barWidth = bw * 0.6

    let running = 0
    for (let i = 0; i < series.values.length; i++) {
      const val = series.values[i]!
      const isTotal = totals.has(i)
      if (isTotal) {
        running = val
      } else {
        running += val
      }

      const cx = xScale.map(i)
      if (mx >= cx - barWidth / 2 - 4 && mx <= cx + barWidth / 2 + 4) {
        return { seriesIndex: 0, pointIndex: i, distance: Math.abs(mx - cx), x: cx, y: yScale.map(running) }
      }
    }

    return null
  },
})
