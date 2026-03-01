import type {
  ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult,
} from '../../types'
import { defineChartType } from '../../api/define'
import { prepareNoAxes } from '../../utils/prepare'
import { text } from '../../render/tree'

/**
 * Word Cloud chart — words sized proportional to their value.
 *
 * Labels are the words, series[0] values control font size.
 * Uses Archimedean spiral placement with bounding-box collision detection.
 */
export const wordcloudChartType = defineChartType({
  type: 'wordcloud',
  suppressAxes: true,


  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme, options } = ctx
    const nodes: RenderNode[] = []

    const series = data.series[0]
    if (!series || series.values.length === 0) return nodes

    const values = series.values
    const maxVal = Math.max(...values.map(Math.abs))
    const minVal = Math.min(...values.filter(v => v > 0))
    const valRange = maxVal - minVal || 1

    // Map values to font sizes
    const minFont = Math.max(10, area.height * 0.03)
    const maxFont = Math.min(area.height * 0.15, area.width * 0.08)

    const items = values
      .map((v, i) => ({
        index: i,
        label: String(data.labels[i] ?? ''),
        value: Math.abs(v),
        fontSize: minFont + ((Math.abs(v) - minVal) / valRange) * (maxFont - minFont),
      }))
      .filter(d => d.value > 0 && d.label.length > 0)
      .sort((a, b) => b.value - a.value)

    if (items.length === 0) return nodes

    // Place words using Archimedean spiral
    const placed = placeWords(items, area)

    for (let idx = 0; idx < placed.length; idx++) {
      const pw = placed[idx]!
      const color = options.colors[pw.index % options.colors.length]!
      const opacity = 0.5 + (pw.value - minVal) / valRange * 0.5

      nodes.push(text(pw.x, pw.y, pw.label, {
        class: 'chartts-wordcloud-word',
        fill: color,
        fillOpacity: opacity,
        textAnchor: 'middle',
        dominantBaseline: 'central',
        fontSize: pw.fontSize,
        fontFamily: theme.fontFamily,
        fontWeight: pw.fontSize > (minFont + maxFont) / 2 ? 700 : 500,
        style: `--chartts-i:${idx}`,
        'data-series': 0,
        'data-index': pw.index,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${pw.label}: ${pw.value}`,
      }))
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area } = ctx
    const series = data.series[0]
    if (!series || series.values.length === 0) return null

    const values = series.values
    const maxVal = Math.max(...values.map(Math.abs))
    const minVal = Math.min(...values.filter(v => v > 0))
    const valRange = maxVal - minVal || 1
    const minFont = Math.max(10, area.height * 0.03)
    const maxFont = Math.min(area.height * 0.15, area.width * 0.08)

    const items = values
      .map((v, i) => ({
        index: i,
        label: String(data.labels[i] ?? ''),
        value: Math.abs(v),
        fontSize: minFont + ((Math.abs(v) - minVal) / valRange) * (maxFont - minFont),
      }))
      .filter(d => d.value > 0 && d.label.length > 0)
      .sort((a, b) => b.value - a.value)

    const placed = placeWords(items, area)

    // Check bounding boxes (smallest first for specificity)
    for (let i = placed.length - 1; i >= 0; i--) {
      const pw = placed[i]!
      const halfW = pw.label.length * pw.fontSize * 0.35
      const halfH = pw.fontSize * 0.6

      if (mx >= pw.x - halfW && mx <= pw.x + halfW &&
          my >= pw.y - halfH && my <= pw.y + halfH) {
        return { seriesIndex: 0, pointIndex: pw.index, distance: 0, x: pw.x, y: pw.y }
      }
    }

    return null
  },
})

interface WordItem {
  index: number
  label: string
  value: number
  fontSize: number
}

interface PlacedWord extends WordItem {
  x: number
  y: number
}

interface BBox {
  x1: number; y1: number; x2: number; y2: number
}

function placeWords(
  items: WordItem[],
  area: { x: number; y: number; width: number; height: number },
): PlacedWord[] {
  const cx = area.x + area.width / 2
  const cy = area.y + area.height / 2
  const placed: PlacedWord[] = []
  const boxes: BBox[] = []

  for (const item of items) {
    // Approximate word bbox dimensions
    const halfW = item.label.length * item.fontSize * 0.35
    const halfH = item.fontSize * 0.6

    // Archimedean spiral search
    let found = false
    for (let t = 0; t < 600; t++) {
      const angle = t * 0.15
      const r = 2 * angle
      const x = cx + r * Math.cos(angle) * (area.width / area.height)
      const y = cy + r * Math.sin(angle)

      // Check bounds
      if (x - halfW < area.x || x + halfW > area.x + area.width ||
          y - halfH < area.y || y + halfH > area.y + area.height) {
        continue
      }

      // Check overlap with placed words
      const newBox: BBox = { x1: x - halfW, y1: y - halfH, x2: x + halfW, y2: y + halfH }
      let overlaps = false

      for (const box of boxes) {
        if (newBox.x1 < box.x2 && newBox.x2 > box.x1 &&
            newBox.y1 < box.y2 && newBox.y2 > box.y1) {
          overlaps = true
          break
        }
      }

      if (!overlaps) {
        placed.push({ ...item, x, y })
        boxes.push(newBox)
        found = true
        break
      }
    }

    // Skip words that don't fit
    if (!found) continue
  }

  return placed
}
