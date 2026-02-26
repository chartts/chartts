import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareNoAxes } from '../../utils/prepare'
import { group, line, circle, text } from '../../render/tree'
import { createHorizontalMapper } from '../../utils/scale'

/**
 * Dumbbell / connected dot chart.
 *
 * Two dots per category connected by a line.
 * Horizontal layout — categories on y-axis, values on x-axis.
 * Requires exactly 2 series. Shows before/after or comparison.
 */
export const dumbbellChartType: ChartTypePlugin = {
  type: 'dumbbell',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme, options, yScale } = ctx
    const nodes: RenderNode[] = []

    if (data.series.length < 2) return nodes
    const s1 = data.series[0]!
    const s2 = data.series[1]!
    const count = Math.min(s1.values.length, s2.values.length)
    if (count === 0) return nodes

    const labelWidth = Math.min(80, area.width * 0.2)
    const chartX = area.x + labelWidth
    const chartW = area.width - labelWidth
    const rowHeight = area.height / count
    const dotR = Math.min(6, rowHeight * 0.2)

    const color1 = options.colors[0]!
    const color2 = options.colors[1 % options.colors.length]!

    const valueToX = createHorizontalMapper(yScale, area, chartX, chartW)

    for (let i = 0; i < count; i++) {
      const cy = area.y + rowHeight * (i + 0.5)
      const v1 = s1.values[i]!
      const v2 = s2.values[i]!
      const x1 = valueToX(v1)
      const x2 = valueToX(v2)
      const label = String(data.labels[i] ?? `Item ${i + 1}`)

      const rowNodes: RenderNode[] = []

      // Label
      rowNodes.push(text(area.x + labelWidth - 8, cy, label, {
        class: 'chartts-dumbbell-label',
        fill: theme.textMuted,
        textAnchor: 'end',
        dominantBaseline: 'central',
        fontSize: theme.fontSizeSmall,
        fontFamily: theme.fontFamily,
      }))

      // Connecting line
      rowNodes.push(line(x1, cy, x2, cy, {
        class: 'chartts-dumbbell-connector',
        stroke: theme.gridColor,
        strokeWidth: 2,
      }))

      // Dot 1 (series 0)
      rowNodes.push(circle(x1, cy, dotR, {
        class: 'chartts-dumbbell-dot',
        fill: color1,
        stroke: '#fff',
        strokeWidth: 1.5,
        'data-series': 0,
        'data-index': i,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${label} — ${s1.name}: ${v1}`,
      }))

      // Dot 2 (series 1)
      rowNodes.push(circle(x2, cy, dotR, {
        class: 'chartts-dumbbell-dot',
        fill: color2,
        stroke: '#fff',
        strokeWidth: 1.5,
        'data-series': 1,
        'data-index': i,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${label} — ${s2.name}: ${v2}`,
      }))

      nodes.push(group(rowNodes, {
        class: `chartts-series chartts-series-${i}`,
        'data-series-name': label,
      }))
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area, yScale } = ctx
    if (data.series.length < 2) return null
    const s1 = data.series[0]!
    const s2 = data.series[1]!
    const count = Math.min(s1.values.length, s2.values.length)
    if (count === 0) return null

    const labelWidth = Math.min(80, area.width * 0.2)
    const chartX = area.x + labelWidth
    const chartW = area.width - labelWidth
    const rowHeight = area.height / count

    const valueToX = createHorizontalMapper(yScale, area, chartX, chartW)

    let best: HitResult | null = null
    let bestDist = 15

    for (let i = 0; i < count; i++) {
      const cy = area.y + rowHeight * (i + 0.5)

      for (const [si, series] of [s1, s2].entries()) {
        const vx = valueToX(series.values[i]!)
        const dx = mx - vx
        const dy = my - cy
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < bestDist) {
          bestDist = dist
          best = { seriesIndex: si, pointIndex: i, distance: dist }
        }
      }
    }

    return best
  },
}
