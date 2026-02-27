import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareNoAxes } from '../../utils/prepare'
import { group, rect, text } from '../../render/tree'

/**
 * Calendar heatmap — GitHub-style contribution grid.
 *
 * Data format:
 * - labels: dates as strings (YYYY-MM-DD) or numbers (day index)
 * - series[0]: values for each day (intensity)
 *
 * Renders a 7-row (days of week) x N-column (weeks) grid.
 * If labels aren't dates, treats data as a flat grid: 7 rows.
 */
export const calendarChartType: ChartTypePlugin = {
  type: 'calendar',
  suppressAxes: true,

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme, options } = ctx
    const nodes: RenderNode[] = []

    const series = data.series[0]
    if (!series || series.values.length === 0) return nodes

    const values = series.values
    const count = values.length
    const rows = 7 // days of week
    const cols = Math.ceil(count / rows)

    let maxVal = 0
    for (const v of values) {
      if (Math.abs(v) > maxVal) maxVal = Math.abs(v)
    }
    if (maxVal === 0) maxVal = 1

    // Day labels
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const labelW = 30
    const gridX = area.x + labelW
    const gridW = area.width - labelW
    const gridH = area.height

    const cellW = Math.min(gridW / cols, gridH / rows) - 1
    const cellH = cellW // square cells
    const gap = Math.max(1, cellW * 0.12)

    const color = options.colors[0] ?? '#10b981'

    // Day-of-week labels
    for (let r = 0; r < rows; r++) {
      if (r % 2 === 0) { // show Mon, Wed, Fri, Sun
        nodes.push(text(area.x + labelW - 4, area.y + r * (cellH + gap) + cellH / 2, dayLabels[r]!, {
          class: 'chartts-calendar-daylabel',
          fill: theme.textMuted,
          textAnchor: 'end',
          dominantBaseline: 'central',
          fontSize: Math.min(theme.fontSizeSmall * 0.8, cellH * 0.6),
          fontFamily: theme.fontFamily,
        }))
      }
    }

    // Cells
    for (let idx = 0; idx < count; idx++) {
      const col = Math.floor(idx / rows)
      const row = idx % rows
      const val = Math.abs(values[idx]!)
      const intensity = val / maxVal

      const x = gridX + col * (cellW + gap)
      const y = area.y + row * (cellH + gap)

      const cellColor = intensity === 0
        ? (theme.gridColor ?? '#e5e7eb')
        : interpolateOpacity(color, intensity)

      const cellNodes: RenderNode[] = [
        rect(x, y, cellW, cellH, {
          class: 'chartts-calendar-cell',
          fill: cellColor,
          rx: 3,
          ry: 3,
          'data-series': 0,
          'data-index': idx,
          tabindex: 0,
          role: 'img',
          ariaLabel: `${data.labels[idx] ?? `Day ${idx + 1}`}: ${values[idx]}`,
        }),
      ]

      nodes.push(group(cellNodes, {
        class: `chartts-series chartts-series-${idx}`,
      }))
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area } = ctx
    const series = data.series[0]
    if (!series || series.values.length === 0) return null

    const count = series.values.length
    const rows = 7
    const cols = Math.ceil(count / rows)
    const labelW = 30
    const gridX = area.x + labelW
    const gridW = area.width - labelW
    const gridH = area.height

    const cellW = Math.min(gridW / cols, gridH / rows) - 1
    const cellH = cellW
    const gap = Math.max(1, cellW * 0.12)

    const col = Math.floor((mx - gridX) / (cellW + gap))
    const row = Math.floor((my - area.y) / (cellH + gap))

    if (col < 0 || col >= cols || row < 0 || row >= rows) return null

    const idx = col * rows + row
    if (idx >= count) return null

    // Check if actually within the cell bounds
    const cellX = gridX + col * (cellW + gap)
    const cellY = area.y + row * (cellH + gap)
    if (mx >= cellX && mx <= cellX + cellW && my >= cellY && my <= cellY + cellH) {
      return { seriesIndex: 0, pointIndex: idx, distance: 0, x: cellX + cellW / 2, y: cellY + cellH / 2 }
    }

    return null
  },
}

function interpolateOpacity(hexColor: string, t: number): string {
  // Parse hex
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // Blend with a minimum opacity of 0.15 up to 1.0
  const alpha = 0.15 + t * 0.85
  return `rgba(${r},${g},${b},${alpha})`
}
