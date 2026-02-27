import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareNoAxes } from '../../utils/prepare'
import { group, rect, line, text } from '../../render/tree'

/**
 * Bullet chart — compact horizontal gauge.
 *
 * Data format: each label is a metric.
 * - series[0]: actual values
 * - series[1] (optional): target values (shown as a marker line)
 *
 * Qualitative ranges (poor/satisfactory/good) are auto-generated
 * from the max value.
 */
export const bulletChartType: ChartTypePlugin = {
  type: 'bullet',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme, options } = ctx
    const nodes: RenderNode[] = []

    const actual = data.series[0]
    if (!actual || actual.values.length === 0) return nodes

    const target = data.series[1]
    const count = actual.values.length
    const labelWidth = Math.min(80, area.width * 0.2)
    const chartX = area.x + labelWidth
    const chartW = area.width - labelWidth

    const rowHeight = area.height / count
    const barHeight = Math.min(rowHeight * 0.4, 20)
    const rangeHeight = Math.min(rowHeight * 0.7, 32)

    // Find global max for scaling
    let maxVal = 0
    for (const v of actual.values) {
      if (Math.abs(v) > maxVal) maxVal = Math.abs(v)
    }
    if (target) {
      for (const v of target.values) {
        if (Math.abs(v) > maxVal) maxVal = Math.abs(v)
      }
    }
    // Extend max to give headroom for ranges
    maxVal = maxVal * 1.2
    if (maxVal === 0) maxVal = 1

    for (let i = 0; i < count; i++) {
      const cy = area.y + rowHeight * (i + 0.5)
      const val = actual.values[i]!
      const label = String(data.labels[i] ?? `Item ${i + 1}`)
      const color = options.colors[i % options.colors.length]!
      const bulletNodes: RenderNode[] = []

      // Label
      bulletNodes.push(text(area.x + labelWidth - 8, cy, label, {
        class: 'chartts-bullet-label',
        fill: theme.textMuted,
        textAnchor: 'end',
        dominantBaseline: 'central',
        fontSize: theme.fontSizeSmall,
        fontFamily: theme.fontFamily,
      }))

      // Qualitative ranges (3 bands: poor, satisfactory, good)
      const bands = [1.0, 0.75, 0.5]
      const opacities = [0.1, 0.18, 0.28]
      for (let b = 0; b < bands.length; b++) {
        const bw = chartW * bands[b]!
        bulletNodes.push(rect(chartX, cy - rangeHeight / 2, bw, rangeHeight, {
          rx: 4, ry: 4,
          class: 'chartts-bullet-range',
          fill: theme.textColor,
          opacity: opacities[b],
        }))
      }

      // Actual value bar
      const barW = (Math.abs(val) / maxVal) * chartW
      bulletNodes.push(rect(chartX, cy - barHeight / 2, barW, barHeight, {
        rx: 3, ry: 3,
        class: 'chartts-bullet-bar',
        fill: color,
        'data-series': 0,
        'data-index': i,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${label}: ${val}${target ? `, target: ${target.values[i]}` : ''}`,
      }))

      // Target marker
      if (target && target.values[i] != null) {
        const tx = chartX + (Math.abs(target.values[i]!) / maxVal) * chartW
        const markerH = rangeHeight * 0.9
        bulletNodes.push(line(tx, cy - markerH / 2, tx, cy + markerH / 2, {
          class: 'chartts-bullet-target',
          stroke: theme.textColor,
          strokeWidth: 2.5,
        }))
      }

      nodes.push(group(bulletNodes, {
        class: `chartts-series chartts-series-${i}`,
        'data-series-name': label,
      }))
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area } = ctx
    const actual = data.series[0]
    if (!actual || actual.values.length === 0) return null

    const count = actual.values.length
    const labelWidth = Math.min(80, area.width * 0.2)
    const rowHeight = area.height / count

    if (mx < area.x + labelWidth) return null

    for (let i = 0; i < count; i++) {
      const cy = area.y + rowHeight * (i + 0.5)
      const rangeHeight = Math.min(rowHeight * 0.7, 32)

      if (my >= cy - rangeHeight / 2 && my <= cy + rangeHeight / 2) {
        return { seriesIndex: 0, pointIndex: i, distance: 0, x: mx, y: cy }
      }
    }

    return null
  },
}
