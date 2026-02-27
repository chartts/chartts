import type {
  ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult,
} from '../../types'
import { defineChartType } from '../../api/define'
import { prepareData } from '../../data/prepare'
import { group, rect, path, circle, text, line } from '../../render/tree'
import { PathBuilder } from '../../render/tree'
import { getBandwidth } from '../../utils/scale'

/**
 * Pareto chart — bars sorted descending + cumulative percentage line + 80% threshold.
 *
 * Data convention:
 * - Single series — values are auto-sorted descending.
 * - Labels are reordered to match.
 * - Cumulative percentages are computed automatically.
 *
 * Renders: bars (primary color) + cumulative line (secondary) + 80% dashed line.
 */

export const paretoChartType = defineChartType({
  type: 'pareto',
  useBandScale: true,

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    // Sort data descending and compute cumulative percentages
    const series = data.series[0]
    if (!series) return prepareData(data, options)

    const labels = data.labels ?? []
    const indices = series.values.map((_, i) => i)
    indices.sort((a, b) => (series.values[b] ?? 0) - (series.values[a] ?? 0))

    const sortedLabels = indices.map(i => String(labels[i] ?? ''))
    const sortedValues = indices.map(i => series.values[i] ?? 0)
    const total = sortedValues.reduce((s, v) => s + v, 0)

    // Compute cumulative percentages for y-axis range
    let cumPct = 0
    const cumValues: number[] = []
    for (const v of sortedValues) {
      cumPct += total > 0 ? (v / total) * 100 : 0
      cumValues.push(cumPct)
    }

    const sortedData: ChartData = {
      labels: sortedLabels,
      series: [
        { name: series.name, values: sortedValues },
        { name: 'Cumulative %', values: cumValues },
      ],
    }

    const prepared = prepareData(sortedData, options)

    // Ensure y starts at 0
    if (options.yMin === undefined && prepared.bounds.yMin > 0) {
      prepared.bounds.yMin = 0
    }

    return prepared
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, options, xScale, yScale, area, theme } = ctx
    const nodes: RenderNode[] = []

    const barSeries = data.series[0]
    if (!barSeries || barSeries.values.length === 0) return nodes

    const cumSeries = data.series[1]
    const bw = getBandwidth(xScale)
    const barWidth = bw * (1 - options.barGap)
    const baseline = yScale.map(0)

    const barColor = options.colors[0] ?? '#3b82f6'
    const lineColor = options.colors[1] ?? '#f59e0b'

    // Bars
    const barNodes: RenderNode[] = []
    for (let i = 0; i < barSeries.values.length; i++) {
      const val = barSeries.values[i]!
      if (isNaN(val)) continue
      const cx = xScale.map(i)
      const barX = cx - barWidth / 2
      const vy = yScale.map(val)
      const y = vy
      const h = Math.abs(baseline - vy)

      barNodes.push(rect(barX, y, barWidth, h, {
        rx: 3, ry: 3,
        class: 'chartts-pareto-bar',
        fill: barColor,
        'data-series': 0,
        'data-index': i,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${data.labels[i] ?? i}: ${val}`,
      }))
    }
    nodes.push(group(barNodes, {
      class: 'chartts-series chartts-series-0',
      'data-series-name': barSeries.name,
    }))

    // Cumulative percentage line
    if (cumSeries && cumSeries.values.length > 0) {
      const yDomain = yScale.getDomain()
      const yMax = yDomain[1] as number

      const lineNodes: RenderNode[] = []
      const pb = new PathBuilder()
      let started = false

      for (let i = 0; i < cumSeries.values.length; i++) {
        const cumPct = cumSeries.values[i]!
        // Map cumulative % (0-100) proportionally onto the y scale
        // cumPct maps to (cumPct / 100) * yMax on the value scale
        const mappedVal = (cumPct / 100) * yMax
        const px = xScale.map(i)
        const py = yScale.map(mappedVal)

        if (!started) {
          pb.moveTo(px, py)
          started = true
        } else {
          pb.lineTo(px, py)
        }

        lineNodes.push(circle(px, py, 3.5, {
          class: 'chartts-pareto-point',
          fill: lineColor,
          stroke: '#fff',
          strokeWidth: 1.5,
          'data-series': 1,
          'data-index': i,
          tabindex: 0,
          role: 'img',
          ariaLabel: `Cumulative: ${cumPct.toFixed(1)}%`,
        }))
      }

      lineNodes.unshift(path(pb.build(), {
        class: 'chartts-pareto-line',
        stroke: lineColor,
        strokeWidth: 2,
        fill: 'none',
      }))

      // 80% threshold line
      const threshold80Val = (80 / 100) * yMax
      const threshold80Y = yScale.map(threshold80Val)

      lineNodes.push(line(area.x, threshold80Y, area.x + area.width, threshold80Y, {
        class: 'chartts-pareto-threshold',
        stroke: theme.gridColor,
        strokeWidth: 1,
        strokeDasharray: '6,3',
      }))

      // 80% label on right side
      lineNodes.push(text(area.x + area.width + 4, threshold80Y, '80%', {
        fill: theme.textColor,
        textAnchor: 'start',
        dominantBaseline: 'central',
        fontSize: theme.fontSizeSmall,
        fontFamily: theme.fontFamily,
      }))

      nodes.push(group(lineNodes, {
        class: 'chartts-series chartts-series-1',
        'data-series-name': 'Cumulative %',
      }))
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, xScale, yScale, options } = ctx
    const barSeries = data.series[0]
    if (!barSeries) return null

    const bw = getBandwidth(xScale)
    const barWidth = bw * (1 - options.barGap)
    const baseline = yScale.map(0)

    for (let i = 0; i < barSeries.values.length; i++) {
      const val = barSeries.values[i]!
      if (isNaN(val)) continue
      const cx = xScale.map(i)
      const barX = cx - barWidth / 2
      const vy = yScale.map(val)
      const y = Math.min(vy, baseline)
      const h = Math.abs(baseline - vy)

      if (mx >= barX - 2 && mx <= barX + barWidth + 2 && my >= y - 2 && my <= y + h + 2) {
        return { seriesIndex: 0, pointIndex: i, distance: 0, x: cx, y: vy }
      }
    }

    return null
  },
})
