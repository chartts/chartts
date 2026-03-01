import type {
  ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { defineChartType } from '../../api/define'
import { prepareNoAxes } from '../../utils/prepare'
import { rect, text, group } from '../../render/tree'

/**
 * Matrix chart — grid layout with color-coded cells.
 *
 * Data convention:
 * - labels: row/column names (for square matrices) or column names
 * - series[i].name: row name, series[i].values[j]: cell value at row i, col j
 *
 * Options:
 * - showValues: display values in cells (default true)
 * - cellRadius: border-radius for cells (default 2)
 * - colorScale: 'sequential' | 'diverging' (default 'sequential')
 * - minColor: color for minimum value
 * - maxColor: color for maximum value
 */

export interface MatrixOptions extends ResolvedOptions {
  showValues?: boolean
  cellRadius?: number
  colorScale?: 'sequential' | 'diverging'
  minColor?: string
  maxColor?: string
}

export const matrixChartType = defineChartType({
  type: 'matrix',
  suppressAxes: true,

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'categorical' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme, options } = ctx
    const nodes: RenderNode[] = []

    const mOpts = options as MatrixOptions
    const showValues = mOpts.showValues !== false
    const cellRadius = mOpts.cellRadius ?? 2
    const colorScale = mOpts.colorScale ?? 'sequential'

    const rows = data.series.length
    const cols = data.labels.length
    if (rows === 0 || cols === 0) return nodes

    // Gather all values for color scale
    let allMin = Infinity, allMax = -Infinity
    for (const s of data.series) {
      for (const v of s.values) {
        if (v < allMin) allMin = v
        if (v > allMax) allMax = v
      }
    }
    if (!isFinite(allMin)) allMin = 0
    if (!isFinite(allMax)) allMax = 1
    const valRange = allMax - allMin || 1

    // Layout
    const labelPadLeft = 60
    const labelPadTop = 30
    const gap = 2
    const gridW = area.width - labelPadLeft - 10
    const gridH = area.height - labelPadTop - 10
    const cellW = (gridW - gap * (cols - 1)) / cols
    const cellH = (gridH - gap * (rows - 1)) / rows
    const gridX = area.x + labelPadLeft
    const gridY = area.y + labelPadTop

    // Column headers
    for (let c = 0; c < cols; c++) {
      const cx = gridX + c * (cellW + gap) + cellW / 2
      nodes.push(text(cx, gridY - 8, String(data.labels[c] ?? ''), {
        class: 'chartts-matrix-col-label',
        fill: theme.textMuted,
        textAnchor: 'middle',
        dominantBaseline: 'auto',
        fontSize: Math.min(theme.fontSizeSmall, cellW * 0.35),
        fontFamily: theme.fontFamily,
      }))
    }

    // Row labels + cells
    for (let r = 0; r < rows; r++) {
      const series = data.series[r]!
      const ry = gridY + r * (cellH + gap)

      // Row label
      nodes.push(text(gridX - 6, ry + cellH / 2, series.name, {
        class: 'chartts-matrix-row-label',
        fill: theme.textMuted,
        textAnchor: 'end',
        dominantBaseline: 'central',
        fontSize: Math.min(theme.fontSizeSmall, cellH * 0.4),
        fontFamily: theme.fontFamily,
      }))

      const rowNodes: RenderNode[] = []
      for (let c = 0; c < cols; c++) {
        const val = series.values[c] ?? 0
        const cx = gridX + c * (cellW + gap)

        // Color interpolation
        const color = getCellColor(val, allMin, allMax, valRange, colorScale, options.colors)
        const textColor = getContrastColor(val, allMin, allMax, valRange, colorScale)

        rowNodes.push(rect(cx, ry, cellW, cellH, {
          class: 'chartts-matrix-cell',
          fill: color,
          rx: cellRadius,
          ry: cellRadius,
          'data-series': r,
          'data-index': c,
          tabindex: 0,
          role: 'img',
          ariaLabel: `${series.name} × ${data.labels[c]}: ${val}`,
        }))

        // Value text
        if (showValues && cellW > 18 && cellH > 14) {
          const displayVal = Number.isInteger(val) ? String(val)
            : Math.abs(val) < 10 ? val.toFixed(2) : val.toFixed(1)

          rowNodes.push(text(cx + cellW / 2, ry + cellH / 2, displayVal, {
            class: 'chartts-matrix-value',
            fill: textColor,
            textAnchor: 'middle',
            dominantBaseline: 'central',
            fontSize: Math.min(theme.fontSizeSmall, cellW * 0.3, cellH * 0.4),
            fontFamily: theme.fontFamily,
            fontWeight: 600,
            pointerEvents: 'none',
          }))
        }
      }

      nodes.push(group(rowNodes, {
        class: `chartts-series chartts-series-${r}`,
        'data-series-name': series.name,
      }))
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area } = ctx
    const rows = data.series.length
    const cols = data.labels.length
    if (rows === 0 || cols === 0) return null

    const labelPadLeft = 60
    const labelPadTop = 30
    const gap = 2
    const gridW = area.width - labelPadLeft - 10
    const gridH = area.height - labelPadTop - 10
    const cellW = (gridW - gap * (cols - 1)) / cols
    const cellH = (gridH - gap * (rows - 1)) / rows
    const gridX = area.x + labelPadLeft
    const gridY = area.y + labelPadTop

    const col = Math.floor((mx - gridX) / (cellW + gap))
    const row = Math.floor((my - gridY) / (cellH + gap))

    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      return { seriesIndex: row, pointIndex: col, distance: 0, x: gridX + col * (cellW + gap) + cellW / 2, y: gridY + row * (cellH + gap) + cellH / 2 }
    }
    return null
  },
})

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function getCellColor(
  val: number, min: number, max: number, range: number,
  scale: string, colors: readonly string[],
): string {
  if (scale === 'diverging') {
    const mid = (min + max) / 2
    if (val >= mid) {
      const t = (val - mid) / ((max - mid) || 1)
      return interpolateOpacity(colors[0] ?? '#3b82f6', 0.15 + t * 0.85)
    } else {
      const t = (mid - val) / ((mid - min) || 1)
      return interpolateOpacity(colors[1] ?? '#ef4444', 0.15 + t * 0.85)
    }
  }
  // Sequential
  const t = (val - min) / range
  return interpolateOpacity(colors[0] ?? '#3b82f6', 0.08 + t * 0.9)
}

function getContrastColor(
  val: number, min: number, max: number, range: number, scale: string,
): string {
  if (scale === 'diverging') {
    const mid = (min + max) / 2
    const t = Math.abs(val - mid) / ((max - min) / 2 || 1)
    return t > 0.5 ? '#ffffff' : '#1f2937'
  }
  const t = (val - min) / range
  return t > 0.55 ? '#ffffff' : '#1f2937'
}

function interpolateOpacity(baseColor: string, opacity: number): string {
  // For CSS var() colors, we use opacity approach
  // Return as rgba-compatible format
  const hex = baseColor.includes('#') ? baseColor : '#3b82f6'
  const r = parseInt(hex.slice(1, 3), 16) || 59
  const g = parseInt(hex.slice(3, 5), 16) || 130
  const b = parseInt(hex.slice(5, 7), 16) || 246
  return `rgba(${r},${g},${b},${opacity.toFixed(2)})`
}
