import type {
  ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult,
} from '../../types'
import { defineChartType } from '../../api/define'
import { prepareNoAxes } from '../../utils/prepare'
import { group, rect, text } from '../../render/tree'

/**
 * Treemap chart — rectangular space-filling visualization.
 *
 * Uses the first series' values as areas. Labels are cell labels.
 * Implements a simple squarified treemap layout.
 */
export const treemapChartType = defineChartType({
  type: 'treemap',
  suppressAxes: true,


  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme, options } = ctx
    const nodes: RenderNode[] = []

    const series = data.series[0]
    if (!series || series.values.length === 0) return nodes

    // Build items sorted by value descending
    const items = series.values
      .map((v, i) => ({ value: Math.abs(v), index: i }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value)

    if (items.length === 0) return nodes

    const total = items.reduce((s, d) => s + d.value, 0)
    const gap = 2

    // Layout using slice-and-dice (simpler, works well)
    const rects = squarify(items.map(d => d.value / total), area.x, area.y, area.width, area.height)

    for (let k = 0; k < items.length; k++) {
      const item = items[k]!
      const r = rects[k]!
      const colorIndex = item.index % options.colors.length
      const color = options.colors[colorIndex]!
      const label = String(data.labels[item.index] ?? `Item ${item.index + 1}`)

      const cellNodes: RenderNode[] = []

      cellNodes.push(rect(r.x + gap / 2, r.y + gap / 2, r.w - gap, r.h - gap, {
        class: 'chartts-treemap-cell',
        fill: color,
        fillOpacity: 0.75,
        rx: 5,
        ry: 5,
        'data-series': 0,
        'data-index': item.index,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${label}: ${series.values[item.index]}`,
      }))

      // Only show label if cell is big enough
      if (r.w > 30 && r.h > 20) {
        const fontSize = Math.min(theme.fontSizeSmall, r.w * 0.15, r.h * 0.3)
        cellNodes.push(text(r.x + r.w / 2, r.y + r.h / 2 - fontSize * 0.3, label, {
          class: 'chartts-treemap-label',
          fill: '#fff',
          textAnchor: 'middle',
          dominantBaseline: 'central',
          fontSize,
          fontFamily: theme.fontFamily,
          fontWeight: 600,
        }))

        // Show value below label
        if (r.h > 35) {
          cellNodes.push(text(r.x + r.w / 2, r.y + r.h / 2 + fontSize * 0.8, String(series.values[item.index]), {
            class: 'chartts-treemap-value',
            fill: 'rgba(255,255,255,0.7)',
            textAnchor: 'middle',
            dominantBaseline: 'central',
            fontSize: fontSize * 0.85,
            fontFamily: theme.fontFamily,
          }))
        }
      }

      nodes.push(group(cellNodes, {
        class: `chartts-series chartts-series-${item.index}`,
        'data-series-name': label,
      }))
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area } = ctx
    const series = data.series[0]
    if (!series || series.values.length === 0) return null

    const items = series.values
      .map((v, i) => ({ value: Math.abs(v), index: i }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value)

    if (items.length === 0) return null
    const total = items.reduce((s, d) => s + d.value, 0)
    const rects = squarify(items.map(d => d.value / total), area.x, area.y, area.width, area.height)

    for (let k = 0; k < items.length; k++) {
      const r = rects[k]!
      if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
        return { seriesIndex: 0, pointIndex: items[k]!.index, distance: 0, x: r.x + r.w / 2, y: r.y + r.h / 2 }
      }
    }

    return null
  },
})

interface Rect { x: number; y: number; w: number; h: number }

/**
 * Squarified treemap layout.
 * Takes normalized values (sum to 1) and fills a rectangle.
 */
function squarify(values: number[], x: number, y: number, w: number, h: number): Rect[] {
  const rects: Rect[] = []
  layoutRow(values, 0, x, y, w, h, rects)
  return rects
}

function layoutRow(
  values: number[], start: number,
  x: number, y: number, w: number, h: number,
  rects: Rect[],
): void {
  if (start >= values.length) return
  if (values.length - start === 1) {
    rects.push({ x, y, w, h })
    return
  }

  const isWide = w >= h

  // Greedily add items to the current row until aspect ratio gets worse
  let rowSum = 0
  let bestWorst = Infinity
  let rowEnd = start

  for (let i = start; i < values.length; i++) {
    const newSum = rowSum + values[i]!

    // Compute row takes up fraction of the short side
    const rowFraction = newSum
    const rowThickness = isWide ? w * rowFraction : h * rowFraction
    const count = i - start + 1

    if (rowThickness <= 0) { rowSum = newSum; rowEnd = i + 1; continue }

    // Worst aspect ratio in this row
    let worst = 0
    for (let j = start; j <= i; j++) {
      const cellFrac = values[j]! / newSum
      const cellLen = isWide ? h * cellFrac : w * cellFrac
      const ar = Math.max(rowThickness / cellLen, cellLen / rowThickness)
      if (ar > worst) worst = ar
    }

    if (count === 1 || worst <= bestWorst) {
      bestWorst = worst
      rowSum = newSum
      rowEnd = i + 1
    } else {
      break
    }
  }

  if (rowEnd === start) rowEnd = start + 1
  const finalSum = values.slice(start, rowEnd).reduce((a, b) => a + b, 0)

  // Lay out this row
  const rowThickness = isWide ? w * finalSum : h * finalSum
  let offset = 0

  for (let i = start; i < rowEnd; i++) {
    const frac = finalSum > 0 ? values[i]! / finalSum : 0
    const cellLen = isWide ? h * frac : w * frac

    if (isWide) {
      rects.push({ x, y: y + offset, w: rowThickness, h: cellLen })
    } else {
      rects.push({ x: x + offset, y, w: cellLen, h: rowThickness })
    }
    offset += cellLen
  }

  // Recurse for remaining items
  if (isWide) {
    layoutRow(values, rowEnd, x + rowThickness, y, w - rowThickness, h, rects)
  } else {
    layoutRow(values, rowEnd, x, y + rowThickness, w, h - rowThickness, rects)
  }
}
