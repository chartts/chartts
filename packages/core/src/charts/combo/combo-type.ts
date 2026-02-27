import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareData } from '../../data/prepare'
import { group, rect, path, circle } from '../../render/tree'
import { PathBuilder } from '../../render/tree'
import { formatNum } from '../../utils/format'
import { getBandwidth } from '../../utils/scale'

/**
 * Combo / Mixed chart — overlays bar + line on the same axes.
 *
 * Convention: series with `fill: true` or series at index 0 render as bars.
 * Remaining series render as lines with points.
 * Use the series `fill` flag to control: fill=false (or omitted after first) → line.
 *
 * Simple heuristic:
 * - series[0] → bars
 * - series[1..N] → lines
 */
export const comboChartType: ChartTypePlugin = {
  type: 'combo',
  useBandScale: true,

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    const prepared = prepareData(data, options)
    if (options.yMin === undefined && prepared.bounds.yMin > 0) {
      prepared.bounds.yMin = 0
    }
    if (options.yMax === undefined && prepared.bounds.yMax < 0) {
      prepared.bounds.yMax = 0
    }
    return prepared
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, options, xScale, yScale } = ctx
    const nodes: RenderNode[] = []

    if (data.series.length === 0) return nodes
    const pointCount = data.series[0]?.values.length ?? 0
    if (pointCount === 0) return nodes

    // Bars for series[0]
    const barSeries = data.series[0]!
    const bw = getBandwidth(xScale)
    const barWidth = bw * (1 - options.barGap)
    const baseline = yScale.map(Math.max(0, yScale.getDomain()[0] as number))

    const barNodes: RenderNode[] = []
    for (let i = 0; i < barSeries.values.length; i++) {
      if (isNaN(barSeries.values[i]!)) continue // skip missing data
      const cx = xScale.map(i)
      const barX = cx - barWidth / 2
      const vy = yScale.map(barSeries.values[i]!)
      const isPositive = barSeries.values[i]! >= 0
      const y = isPositive ? vy : baseline
      const h = Math.abs(vy - baseline)

      const barFill = `url(#chartts-bar-${barSeries.index})`
      const r = Math.min(options.barRadius, barWidth / 2, h / 2)

      if (r > 0 && h > r * 2) {
        const d = isPositive
          ? `M${formatNum(barX)},${formatNum(y + h)}V${formatNum(y + r)}Q${formatNum(barX)},${formatNum(y)},${formatNum(barX + r)},${formatNum(y)}H${formatNum(barX + barWidth - r)}Q${formatNum(barX + barWidth)},${formatNum(y)},${formatNum(barX + barWidth)},${formatNum(y + r)}V${formatNum(y + h)}Z`
          : `M${formatNum(barX)},${formatNum(y)}V${formatNum(y + h - r)}Q${formatNum(barX)},${formatNum(y + h)},${formatNum(barX + r)},${formatNum(y + h)}H${formatNum(barX + barWidth - r)}Q${formatNum(barX + barWidth)},${formatNum(y + h)},${formatNum(barX + barWidth)},${formatNum(y + h - r)}V${formatNum(y)}Z`
        barNodes.push(path(d, {
          class: 'chartts-bar',
          fill: barFill,
          'data-series': barSeries.index,
          'data-index': i,
          tabindex: 0,
          role: 'img',
          ariaLabel: `${barSeries.name}: ${barSeries.values[i]}`,
        }))
      } else {
        barNodes.push(rect(barX, y, barWidth, h, {
          class: 'chartts-bar',
          fill: barFill,
          'data-series': barSeries.index,
          'data-index': i,
          tabindex: 0,
          role: 'img',
          ariaLabel: `${barSeries.name}: ${barSeries.values[i]}`,
        }))
      }
    }
    nodes.push(group(barNodes, {
      class: `chartts-series chartts-series-${barSeries.index}`,
      'data-series-name': barSeries.name,
    }))

    // Lines for series[1..N]
    for (let si = 1; si < data.series.length; si++) {
      const series = data.series[si]!
      const color = options.colors[series.index % options.colors.length]!
      const lineNodes: RenderNode[] = []

      // Build line path
      const pb = new PathBuilder()
      let started = false
      for (let i = 0; i < series.values.length; i++) {
        if (isNaN(series.values[i]!)) { started = false; continue } // break line at NaN
        const px = xScale.map(i)
        const py = yScale.map(series.values[i]!)
        if (!started) {
          pb.moveTo(px, py)
          started = true
        } else {
          pb.lineTo(px, py)
        }
      }

      lineNodes.push(path(pb.build(), {
        class: 'chartts-line chartts-combo-line',
        stroke: color,
        strokeWidth: 2,
        fill: 'none',
      }))

      // Points
      for (let i = 0; i < series.values.length; i++) {
        if (isNaN(series.values[i]!)) continue // skip missing data
        const px = xScale.map(i)
        const py = yScale.map(series.values[i]!)
        lineNodes.push(circle(px, py, 4, {
          class: 'chartts-point chartts-combo-point',
          fill: color,
          stroke: '#fff',
          strokeWidth: 1.5,
          'data-series': series.index,
          'data-index': i,
          tabindex: 0,
          role: 'img',
          ariaLabel: `${series.name}: ${series.values[i]}`,
        }))
      }

      nodes.push(group(lineNodes, {
        class: `chartts-series chartts-series-${series.index}`,
        'data-series-name': series.name,
      }))
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, xScale, yScale, options } = ctx
    if (data.series.length === 0) return null

    let best: HitResult | null = null
    let bestDist = Infinity

    // Check bar hits first (series[0])
    const barSeries = data.series[0]!
    const bw = getBandwidth(xScale)
    const barWidth = bw * (1 - options.barGap)
    const baseline = yScale.map(Math.max(0, yScale.getDomain()[0] as number))

    for (let i = 0; i < barSeries.values.length; i++) {
      if (isNaN(barSeries.values[i]!)) continue
      const cx = xScale.map(i)
      const barX = cx - barWidth / 2
      const vy = yScale.map(barSeries.values[i]!)
      const y = barSeries.values[i]! >= 0 ? vy : baseline
      const h = Math.abs(vy - baseline)

      if (mx >= barX - 2 && mx <= barX + barWidth + 2 && my >= y - 2 && my <= y + h + 2) {
        best = { seriesIndex: barSeries.index, pointIndex: i, distance: 0, x: cx, y: vy }
        return best
      }
    }

    // Check line point hits (series[1..N])
    for (let si = 1; si < data.series.length; si++) {
      const series = data.series[si]!
      for (let i = 0; i < series.values.length; i++) {
        if (isNaN(series.values[i]!)) continue
        const px = xScale.map(i)
        const py = yScale.map(series.values[i]!)
        const dx = mx - px
        const dy = my - py
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < bestDist && dist < 20) {
          bestDist = dist
          best = { seriesIndex: series.index, pointIndex: i, distance: dist, x: px, y: py }
        }
      }
    }

    return best
  },
}
