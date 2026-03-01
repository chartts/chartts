import type {
  ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult,
} from '../../types'
import { defineChartType } from '../../api/define'
import { CSS_PREFIX } from '../../constants'
import { prepareData } from '../../data/prepare'
import { group, path, circle } from '../../render/tree'
import { PathBuilder } from '../../render/tree'

export interface RangeOptions extends ResolvedOptions {
  /** Upper and lower bound arrays. */
  range?: {
    upper: number[]
    lower: number[]
  }
  /** Band fill color. Default uses series color with opacity. */
  bandColor?: string
  /** Band fill opacity. Default 0.2. */
  bandOpacity?: number
  /** Show center line (series[0].values). Default true. */
  showCenter?: boolean
  /** Show data points on center line. Default false. */
  showPoints?: boolean
}

/**
 * Range / Band chart — shaded area between upper and lower bounds.
 *
 * Used for: Bollinger bands, confidence intervals, forecast ranges,
 * bid-ask spread visualization.
 */
export const rangeChartType = defineChartType({
  type: 'range',


  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    const opts = options as RangeOptions
    const range = opts.range
    const prepared = prepareData(data, options)

    // Support range from options OR from 2 series
    const resolvedRange = range ?? (data.series.length >= 2
      ? { lower: data.series[0]!.values, upper: data.series[1]!.values }
      : null)

    if (resolvedRange) {
      let yMin = prepared.bounds.yMin
      let yMax = prepared.bounds.yMax
      for (let i = 0; i < resolvedRange.upper.length; i++) {
        const u = resolvedRange.upper[i]!
        const l = resolvedRange.lower[i]!
        if (!isNaN(u) && u > yMax) yMax = u
        if (!isNaN(l) && l < yMin) yMin = l
      }
      prepared.bounds.yMin = yMin
      prepared.bounds.yMax = yMax
    }

    return prepared
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, xScale, yScale, options, theme } = ctx
    const nodes: RenderNode[] = []

    const opts = options as RangeOptions

    // Support range from options OR from 2 series (Low/High)
    let range = opts.range
    if (!range && data.series.length >= 2) {
      range = { lower: data.series[0]!.values, upper: data.series[1]!.values }
    }
    if (!range) return nodes

    const series = data.series.length >= 2
      ? { ...data.series[0]!, values: data.series[0]!.values.map((v, i) => (v + data.series[1]!.values[i]!) / 2) }
      : data.series[0]!
    if (!series) return nodes

    const showCenter = opts.showCenter ?? true
    const showPoints = opts.showPoints ?? false
    const bandOpacity = opts.bandOpacity ?? 0.2

    const seriesNodes: RenderNode[] = []

    // Build band polygon: upper path forward, lower path backward
    const pb = new PathBuilder()
    const n = range.upper.length

    // Upper path (left to right) — skip NaN
    let bandStarted = false
    for (let i = 0; i < n; i++) {
      if (isNaN(range.upper[i]!)) continue
      const x = xScale.map(i)
      const y = yScale.map(range.upper[i]!)
      if (!bandStarted) { pb.moveTo(x, y); bandStarted = true }
      else pb.lineTo(x, y)
    }

    // Lower path (right to left) — skip NaN
    for (let i = n - 1; i >= 0; i--) {
      if (isNaN(range.lower[i]!)) continue
      const x = xScale.map(i)
      const y = yScale.map(range.lower[i]!)
      pb.lineTo(x, y)
    }
    if (bandStarted) pb.close()

    seriesNodes.push(path(pb.build(), {
      class: 'chartts-range-band',
      fill: opts.bandColor ?? series.color,
      fillOpacity: bandOpacity,
      'data-series': 0,
    }))

    // Upper bound line
    const upperPath = buildLinePath(range.upper, xScale, yScale)
    seriesNodes.push(path(upperPath, {
      class: 'chartts-range-bound',
      stroke: series.color,
      strokeWidth: 1,
      strokeDasharray: '4,3',
      opacity: 0.6,
      'data-series': 0,
    }))

    // Lower bound line
    const lowerPath = buildLinePath(range.lower, xScale, yScale)
    seriesNodes.push(path(lowerPath, {
      class: 'chartts-range-bound',
      stroke: series.color,
      strokeWidth: 1,
      strokeDasharray: '4,3',
      opacity: 0.6,
      'data-series': 0,
    }))

    // Center line
    if (showCenter && series.values.length > 0) {
      const centerPath = buildLinePath(series.values, xScale, yScale)
      seriesNodes.push(path(centerPath, {
        class: 'chartts-range-center',
        stroke: series.color,
        strokeWidth: theme.lineWidth,
        'data-series': 0,
      }))

      if (showPoints) {
        for (let i = 0; i < series.values.length; i++) {
          if (isNaN(series.values[i]!)) continue
          const x = xScale.map(i)
          const y = yScale.map(series.values[i]!)
          seriesNodes.push(circle(x, y, theme.pointRadius, {
            class: 'chartts-point',
            fill: series.color,
            stroke: `var(${CSS_PREFIX}-bg, #fff)`,
            strokeWidth: 2,
            'data-series': 0,
            'data-index': i,
            tabindex: 0,
            role: 'img',
            ariaLabel: `${data.labels[i] ?? i}: ${series.values[i]} [${range.lower[i]}–${range.upper[i]}]`,
          }))
        }
      }
    }

    nodes.push(group(seriesNodes, {
      class: 'chartts-series chartts-series-0',
      'data-series-name': series.name,
    }))

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, xScale, yScale } = ctx
    const series = data.series[0]
    if (!series) return null

    let best: HitResult | null = null
    let bestDist = Infinity

    for (let i = 0; i < series.values.length; i++) {
      if (isNaN(series.values[i]!)) continue
      const x = xScale.map(i)
      const y = yScale.map(series.values[i]!)
      const dist = Math.sqrt((mx - x) ** 2 + (my - y) ** 2)
      if (dist < bestDist) {
        bestDist = dist
        best = { seriesIndex: 0, pointIndex: i, distance: dist, x, y }
      }
    }

    return best && best.distance < 30 ? best : null
  },
})

function buildLinePath(
  values: number[],
  xScale: { map(v: number | string | Date): number },
  yScale: { map(v: number | string | Date): number },
): string {
  if (values.length === 0) return ''
  const pb = new PathBuilder()
  let started = false
  for (let i = 0; i < values.length; i++) {
    if (isNaN(values[i]!)) { started = false; continue }
    const x = xScale.map(i)
    const y = yScale.map(values[i]!)
    if (!started) { pb.moveTo(x, y); started = true }
    else pb.lineTo(x, y)
  }
  return pb.build()
}
