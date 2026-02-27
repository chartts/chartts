import type {
  ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult,
} from '../../types'
import { defineChartType } from '../../api/define'
import { prepareNoAxes } from '../../utils/prepare'
import { group, rect, text, path, line } from '../../render/tree'
import { PathBuilder } from '../../render/tree'

/**
 * Gantt chart — horizontal task bars on a timeline.
 *
 * Data convention:
 * - labels: task names
 * - series[0].values: start values (day offsets or timestamps)
 * - series[1].values: end values
 * - series[2].values (optional): progress 0-100
 *
 * When start === end, renders a milestone diamond.
 */

export const ganttChartType = defineChartType({
  type: 'gantt',
  suppressAxes: true,

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme, options } = ctx
    const nodes: RenderNode[] = []

    const startSeries = data.series[0]
    const endSeries = data.series[1]
    if (!startSeries || !endSeries) return nodes

    const progressSeries = data.series[2]
    const taskCount = data.labels.length
    if (taskCount === 0) return nodes

    // Find time range
    let tMin = Infinity
    let tMax = -Infinity
    for (let i = 0; i < taskCount; i++) {
      const s = startSeries.values[i] ?? 0
      const e = endSeries.values[i] ?? 0
      if (s < tMin) tMin = s
      if (e > tMax) tMax = e
    }
    if (tMin === tMax) tMax = tMin + 1

    const labelWidth = area.width * 0.22
    const chartX = area.x + labelWidth
    const chartW = area.width - labelWidth
    const rowH = area.height / Math.max(taskCount, 1)
    const barH = Math.min(rowH * 0.55, 28)
    const tRange = tMax - tMin

    // Grid lines (vertical time ticks)
    const gridNodes: RenderNode[] = []
    const tickCount = Math.min(Math.max(Math.floor(chartW / 60), 3), 10)
    for (let t = 0; t <= tickCount; t++) {
      const frac = t / tickCount
      const x = chartX + frac * chartW
      gridNodes.push(line(x, area.y, x, area.y + area.height, {
        stroke: theme.gridColor,
        strokeWidth: 0.5,
        strokeDasharray: '3,3',
      }))
      // Time label at bottom
      const val = Math.round(tMin + frac * tRange)
      gridNodes.push(text(x, area.y + area.height + 14, String(val), {
        fill: theme.textColor,
        textAnchor: 'middle',
        fontSize: theme.fontSizeSmall,
        fontFamily: theme.fontFamily,
      }))
    }
    nodes.push(group(gridNodes, { class: 'chartts-gantt-grid' }))

    // Row separators
    const sepNodes: RenderNode[] = []
    for (let i = 1; i < taskCount; i++) {
      const y = area.y + i * rowH
      sepNodes.push(line(chartX, y, chartX + chartW, y, {
        stroke: theme.gridColor,
        strokeWidth: 0.5,
      }))
    }
    if (sepNodes.length > 0) {
      nodes.push(group(sepNodes, { class: 'chartts-gantt-rows' }))
    }

    // Task bars
    const barNodes: RenderNode[] = []
    for (let i = 0; i < taskCount; i++) {
      const s = startSeries.values[i] ?? 0
      const e = endSeries.values[i] ?? 0
      const progress = progressSeries ? (progressSeries.values[i] ?? 0) : -1
      const color = options.colors[i % options.colors.length]!

      const cy = area.y + i * rowH + rowH / 2

      // Task label
      barNodes.push(text(chartX - 8, cy, String(data.labels[i] ?? ''), {
        fill: theme.textColor,
        textAnchor: 'end',
        dominantBaseline: 'central',
        fontSize: theme.fontSizeSmall,
        fontFamily: theme.fontFamily,
      }))

      if (s === e) {
        // Milestone — diamond shape
        const mx = chartX + ((s - tMin) / tRange) * chartW
        const sz = barH * 0.45
        const pb = new PathBuilder()
        pb.moveTo(mx, cy - sz)
        pb.lineTo(mx + sz, cy)
        pb.lineTo(mx, cy + sz)
        pb.lineTo(mx - sz, cy)
        pb.close()

        barNodes.push(path(pb.build(), {
          class: 'chartts-gantt-milestone',
          fill: color,
          'data-series': 0,
          'data-index': i,
          tabindex: 0,
          role: 'img',
          ariaLabel: `${data.labels[i] ?? i}: milestone at ${s}`,
        }))
      } else {
        // Bar
        const x1 = chartX + ((s - tMin) / tRange) * chartW
        const x2 = chartX + ((e - tMin) / tRange) * chartW
        const bw = Math.max(x2 - x1, 2)
        const by = cy - barH / 2

        barNodes.push(rect(x1, by, bw, barH, {
          rx: 4, ry: 4,
          class: 'chartts-gantt-bar',
          fill: color,
          opacity: 0.75,
          'data-series': 0,
          'data-index': i,
          tabindex: 0,
          role: 'img',
          ariaLabel: `${data.labels[i] ?? i}: ${s} to ${e}`,
        }))

        // Progress overlay
        if (progress >= 0 && progress <= 100) {
          const pw = bw * (progress / 100)
          barNodes.push(rect(x1, by, pw, barH, {
            rx: 4, ry: 4,
            class: 'chartts-gantt-progress',
            fill: color,
            opacity: 1,
          }))
        }
      }
    }

    nodes.push(group(barNodes, {
      class: 'chartts-series chartts-series-0',
      'data-series-name': 'Gantt',
    }))

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area } = ctx
    const startSeries = data.series[0]
    const endSeries = data.series[1]
    if (!startSeries || !endSeries) return null

    const taskCount = data.labels.length
    if (taskCount === 0) return null

    let tMin = Infinity
    let tMax = -Infinity
    for (let i = 0; i < taskCount; i++) {
      const s = startSeries.values[i] ?? 0
      const e = endSeries.values[i] ?? 0
      if (s < tMin) tMin = s
      if (e > tMax) tMax = e
    }
    if (tMin === tMax) tMax = tMin + 1

    const labelWidth = area.width * 0.22
    const chartX = area.x + labelWidth
    const chartW = area.width - labelWidth
    const rowH = area.height / Math.max(taskCount, 1)
    const tRange = tMax - tMin

    for (let i = 0; i < taskCount; i++) {
      const s = startSeries.values[i] ?? 0
      const e = endSeries.values[i] ?? 0
      const cy = area.y + i * rowH + rowH / 2
      const x1 = chartX + ((s - tMin) / tRange) * chartW
      const x2 = chartX + ((e - tMin) / tRange) * chartW

      if (my >= cy - rowH / 2 && my <= cy + rowH / 2 &&
          mx >= x1 - 5 && mx <= Math.max(x2, x1 + 10) + 5) {
        return { seriesIndex: 0, pointIndex: i, distance: 0, x: (x1 + x2) / 2, y: cy }
      }
    }

    return null
  },
})
