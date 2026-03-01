import type {
  ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult,
} from '../../types'
import { defineChartType } from '../../api/define'
import { prepareNoAxes } from '../../utils/prepare'
import { group, circle, text } from '../../render/tree'

/**
 * Pack (Circle Packing) chart — nested circles where area is proportional to value.
 *
 * Uses a front-chain packing algorithm to arrange circles tightly.
 */
export const packChartType = defineChartType({
  type: 'pack',
  suppressAxes: true,


  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme, options } = ctx
    const nodes: RenderNode[] = []

    const series = data.series[0]
    if (!series || series.values.length === 0) return nodes

    const items = series.values
      .map((v, i) => ({ value: Math.abs(v), index: i }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value)

    if (items.length === 0) return nodes

    // Compute radii proportional to sqrt(value) so AREA is proportional to value
    const maxVal = items[0]!.value
    const maxR = Math.min(area.width, area.height) * 0.35
    const minR = Math.max(8, maxR * 0.06)

    const radii = items.map(d => minR + Math.sqrt(d.value / maxVal) * (maxR - minR))

    // Pack circles using a simple greedy placement
    const placed = packCircles(radii, area)

    for (let k = 0; k < items.length; k++) {
      const item = items[k]!
      const p = placed[k]
      if (!p) continue

      const color = options.colors[item.index % options.colors.length]!
      const label = String(data.labels[item.index] ?? `Item ${item.index + 1}`)
      const r = radii[k]!

      const cellNodes: RenderNode[] = []

      cellNodes.push(circle(p.x, p.y, r, {
        class: 'chartts-pack-circle',
        fill: color,
        fillOpacity: 0.6,
        stroke: color,
        strokeWidth: 1.5,
        style: `--chartts-i:${k}`,
        'data-series': 0,
        'data-index': item.index,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${label}: ${series.values[item.index]}`,
      }))

      // Label if circle is big enough
      if (r > 18) {
        const fontSize = Math.min(theme.fontSizeSmall, r * 0.45)
        cellNodes.push(text(p.x, p.y - fontSize * 0.3, label, {
          class: 'chartts-pack-label',
          fill: '#fff',
          textAnchor: 'middle',
          dominantBaseline: 'central',
          fontSize,
          fontFamily: theme.fontFamily,
          fontWeight: 600,
          pointerEvents: 'none',
        }))

        if (r > 28) {
          cellNodes.push(text(p.x, p.y + fontSize * 0.8, String(series.values[item.index]), {
            class: 'chartts-pack-value',
            fill: 'rgba(255,255,255,0.7)',
            textAnchor: 'middle',
            dominantBaseline: 'central',
            fontSize: fontSize * 0.8,
            fontFamily: theme.fontFamily,
            pointerEvents: 'none',
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

    const maxVal = items[0]!.value
    const maxR = Math.min(area.width, area.height) * 0.35
    const minR = Math.max(8, maxR * 0.06)
    const radii = items.map(d => minR + Math.sqrt(d.value / maxVal) * (maxR - minR))
    const placed = packCircles(radii, area)

    // Find smallest circle containing the mouse (most specific)
    let best: { idx: number; r: number; x: number; y: number } | null = null

    for (let k = 0; k < items.length; k++) {
      const p = placed[k]
      if (!p) continue
      const r = radii[k]!
      const dist = Math.sqrt((mx - p.x) ** 2 + (my - p.y) ** 2)
      if (dist <= r && (!best || r < best.r)) {
        best = { idx: items[k]!.index, r, x: p.x, y: p.y }
      }
    }

    if (!best) return null
    return { seriesIndex: 0, pointIndex: best.idx, distance: 0, x: best.x, y: best.y }
  },
})

interface Pos { x: number; y: number }

/** Greedy circle packing within a rectangular area. */
function packCircles(radii: number[], area: { x: number; y: number; width: number; height: number }): Pos[] {
  const cx = area.x + area.width / 2
  const cy = area.y + area.height / 2
  const result: Pos[] = []

  if (radii.length === 0) return result

  // Place first circle at center
  result.push({ x: cx, y: cy })

  for (let i = 1; i < radii.length; i++) {
    const r = radii[i]!
    let bestPos: Pos = { x: cx, y: cy }
    let bestDist = Infinity

    // Try placing tangent to each existing circle, at various angles
    for (let j = 0; j < result.length; j++) {
      const pj = result[j]!
      const rj = radii[j]!
      const gap = rj + r + 2

      for (let a = 0; a < 12; a++) {
        const angle = (a / 12) * Math.PI * 2
        const tx = pj.x + Math.cos(angle) * gap
        const ty = pj.y + Math.sin(angle) * gap

        // Check overlap with all placed circles
        let overlaps = false
        for (let k = 0; k < result.length; k++) {
          const pk = result[k]!
          const rk = radii[k]!
          const dist = Math.sqrt((tx - pk.x) ** 2 + (ty - pk.y) ** 2)
          if (dist < rk + r + 1) { overlaps = true; break }
        }

        if (!overlaps) {
          // Prefer positions closer to center
          const distFromCenter = Math.sqrt((tx - cx) ** 2 + (ty - cy) ** 2)
          if (distFromCenter < bestDist) {
            bestDist = distFromCenter
            bestPos = { x: tx, y: ty }
          }
        }
      }
    }

    result.push(bestPos)
  }

  return result
}
