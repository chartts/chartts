import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareNoAxes } from '../../utils/prepare'
import { group, rect, text } from '../../render/tree'

/**
 * Heatmap chart — displays a matrix of colored cells.
 *
 * Data format: each series is a row, each value is a cell.
 * Labels are column headers, series names are row headers.
 * Cell color intensity is proportional to value.
 */
export const heatmapChartType: ChartTypePlugin = {
  type: 'heatmap',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme, options } = ctx
    const nodes: RenderNode[] = []

    const rowCount = data.series.length
    const colCount = data.labels.length
    if (rowCount === 0 || colCount === 0) return nodes

    // Find min/max values for color interpolation
    let vMin = Infinity
    let vMax = -Infinity
    for (const s of data.series) {
      for (const v of s.values) {
        if (v < vMin) vMin = v
        if (v > vMax) vMax = v
      }
    }
    if (vMin === vMax) vMax = vMin + 1

    // Layout: leave space for labels
    const labelW = Math.min(60, area.width * 0.15)
    const labelH = Math.min(24, area.height * 0.1)
    const gridX = area.x + labelW
    const gridY = area.y + labelH
    const gridW = area.width - labelW
    const gridH = area.height - labelH
    const cellW = gridW / colCount
    const cellH = gridH / rowCount
    const gap = 1.5

    // Column labels (top)
    for (let c = 0; c < colCount; c++) {
      const x = gridX + cellW * (c + 0.5)
      nodes.push(text(x, area.y + labelH * 0.5, String(data.labels[c]!), {
        class: 'chartts-heatmap-col-label',
        fill: theme.textMuted,
        textAnchor: 'middle',
        dominantBaseline: 'central',
        fontSize: Math.min(theme.fontSizeSmall, cellW * 0.35),
        fontFamily: theme.fontFamily,
      }))
    }

    // Row labels (left) + cells
    for (let r = 0; r < rowCount; r++) {
      const series = data.series[r]!
      const ry = gridY + cellH * r

      // Row label
      nodes.push(text(area.x + labelW - 4, ry + cellH / 2, series.name, {
        class: 'chartts-heatmap-row-label',
        fill: theme.textMuted,
        textAnchor: 'end',
        dominantBaseline: 'central',
        fontSize: Math.min(theme.fontSizeSmall, cellH * 0.45),
        fontFamily: theme.fontFamily,
      }))

      const cellNodes: RenderNode[] = []

      for (let c = 0; c < colCount; c++) {
        const value = series.values[c] ?? 0
        const t = (value - vMin) / (vMax - vMin)
        const color = interpolateColor(options.colors[0]!, t)

        cellNodes.push(rect(
          gridX + cellW * c + gap / 2,
          ry + gap / 2,
          cellW - gap,
          cellH - gap,
          {
            class: 'chartts-heatmap-cell',
            fill: color,
            rx: 4,
            ry: 2,
            'data-series': r,
            'data-index': c,
            tabindex: 0,
            role: 'img',
            ariaLabel: `${series.name}, ${data.labels[c]}: ${value}`,
          },
        ))
      }

      nodes.push(group(cellNodes, {
        class: `chartts-series chartts-series-${r}`,
        'data-series-name': series.name,
      }))
    }

    return nodes
  },

  getHighlightNodes(ctx: RenderContext, hit: HitResult): RenderNode[] {
    const { data, area, options } = ctx
    const rowCount = data.series.length
    const colCount = data.labels.length
    if (rowCount === 0 || colCount === 0) return []

    const labelW = Math.min(60, area.width * 0.15)
    const labelH = Math.min(24, area.height * 0.1)
    const gridX = area.x + labelW
    const gridY = area.y + labelH
    const gridW = area.width - labelW
    const gridH = area.height - labelH
    const cellW = gridW / colCount
    const cellH = gridH / rowCount

    const col = hit.pointIndex
    const row = hit.seriesIndex
    const color = options.colors[0] ?? '#3b82f6'

    return [
      rect(gridX + cellW * col, gridY + cellH * row, cellW, cellH, {
        class: 'chartts-highlight-cell',
        fill: 'none',
        stroke: color,
        strokeWidth: 2,
      }),
    ]
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area } = ctx
    const rowCount = data.series.length
    const colCount = data.labels.length
    if (rowCount === 0 || colCount === 0) return null

    const labelW = Math.min(60, area.width * 0.15)
    const labelH = Math.min(24, area.height * 0.1)
    const gridX = area.x + labelW
    const gridY = area.y + labelH
    const gridW = area.width - labelW
    const gridH = area.height - labelH
    const cellW = gridW / colCount
    const cellH = gridH / rowCount

    if (mx < gridX || mx > gridX + gridW || my < gridY || my > gridY + gridH) return null

    const col = Math.floor((mx - gridX) / cellW)
    const row = Math.floor((my - gridY) / cellH)

    if (row >= 0 && row < rowCount && col >= 0 && col < colCount) {
      return { seriesIndex: row, pointIndex: col, distance: 0, x: gridX + col * cellW + cellW / 2, y: gridY + row * cellH + cellH / 2 }
    }

    return null
  },
}

/** Interpolate from transparent to the given color based on t (0..1) */
function interpolateColor(baseColor: string, t: number): string {
  // Extract hex fallback from var(--color-xxx, #hex) format
  const hexMatch = baseColor.match(/#([0-9a-fA-F]{6})/)
  if (!hexMatch) return `rgba(59, 130, 246, ${(0.1 + t * 0.9).toFixed(2)})`

  const hex = hexMatch[1]!
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)

  const opacity = 0.1 + t * 0.9
  return `rgba(${r}, ${g}, ${b}, ${opacity.toFixed(2)})`
}
