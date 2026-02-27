import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareNoAxes } from '../../utils/prepare'
import { path, text } from '../../render/tree'
import { PathBuilder } from '../../render/tree'

/**
 * Chord diagram — shows relationships between entities via ribbons
 * connecting arcs on a circle.
 *
 * Data convention:
 * - labels: entity names (placed around the circle as arcs)
 * - series[i].values[j]: flow from entity i to entity j (adjacency matrix)
 *   series.length should equal labels.length for a square matrix.
 *
 * Alternative: arrow notation like Sankey
 * - series names contain "→" or "->" (e.g., "A → B")
 */

interface ChordArc {
  index: number
  name: string
  total: number
  startAngle: number
  endAngle: number
}

interface ChordRibbon {
  source: number
  target: number
  value: number
  sourceStart: number
  sourceEnd: number
  targetStart: number
  targetEnd: number
}

export const chordChartType: ChartTypePlugin = {
  type: 'chord',
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

    const { arcs, ribbons } = buildChordLayout(data, options)
    if (arcs.length === 0) return nodes

    const cx = area.x + area.width / 2
    const cy = area.y + area.height / 2
    const outerR = Math.min(area.width, area.height) / 2 - 20
    const innerR = outerR - 14

    // Render arcs
    for (const arc of arcs) {
      if (arc.endAngle - arc.startAngle < 0.01) continue

      const color = options.colors[arc.index % options.colors.length]!
      const pb = new PathBuilder()

      const x1o = cx + outerR * Math.cos(arc.startAngle)
      const y1o = cy + outerR * Math.sin(arc.startAngle)
      const x2o = cx + outerR * Math.cos(arc.endAngle)
      const y2o = cy + outerR * Math.sin(arc.endAngle)
      const x1i = cx + innerR * Math.cos(arc.endAngle)
      const y1i = cy + innerR * Math.sin(arc.endAngle)
      const x2i = cx + innerR * Math.cos(arc.startAngle)
      const y2i = cy + innerR * Math.sin(arc.startAngle)
      const largeArc = (arc.endAngle - arc.startAngle) > Math.PI

      pb.moveTo(x1o, y1o)
      pb.arc(outerR, outerR, 0, largeArc, true, x2o, y2o)
      pb.lineTo(x1i, y1i)
      pb.arc(innerR, innerR, 0, largeArc, false, x2i, y2i)
      pb.close()

      nodes.push(path(pb.build(), {
        class: 'chartts-chord-arc',
        fill: color,
        stroke: color,
        strokeWidth: 0.5,
        'data-series': arc.index,
        'data-index': 0,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${arc.name}: ${arc.total}`,
      }))

      // Label
      const midAngle = (arc.startAngle + arc.endAngle) / 2
      const labelR = outerR + 12
      const lx = cx + labelR * Math.cos(midAngle)
      const ly = cy + labelR * Math.sin(midAngle)
      const anchor = Math.abs(Math.cos(midAngle)) < 0.01 ? 'middle' as const
        : Math.cos(midAngle) > 0 ? 'start' as const : 'end' as const

      nodes.push(text(lx, ly, arc.name, {
        class: 'chartts-chord-label',
        fill: theme.textColor,
        textAnchor: anchor,
        dominantBaseline: 'central',
        fontSize: theme.fontSizeSmall,
        fontFamily: theme.fontFamily,
      }))
    }

    // Render ribbons
    for (let ri = 0; ri < ribbons.length; ri++) {
      const ribbon = ribbons[ri]!
      const color = options.colors[ribbon.source % options.colors.length]!

      const pb = new PathBuilder()
      // Source arc on inner ring
      const sx1 = cx + innerR * Math.cos(ribbon.sourceStart)
      const sy1 = cy + innerR * Math.sin(ribbon.sourceStart)
      const sx2 = cx + innerR * Math.cos(ribbon.sourceEnd)
      const sy2 = cy + innerR * Math.sin(ribbon.sourceEnd)
      // Target arc on inner ring
      const tx1 = cx + innerR * Math.cos(ribbon.targetStart)
      const ty1 = cy + innerR * Math.sin(ribbon.targetStart)
      const tx2 = cx + innerR * Math.cos(ribbon.targetEnd)
      const ty2 = cy + innerR * Math.sin(ribbon.targetEnd)

      const srcLarge = (ribbon.sourceEnd - ribbon.sourceStart) > Math.PI
      const tgtLarge = (ribbon.targetEnd - ribbon.targetStart) > Math.PI

      pb.moveTo(sx1, sy1)
      pb.arc(innerR, innerR, 0, srcLarge, true, sx2, sy2)
      // Bezier to target
      pb.quadTo(cx, cy, tx1, ty1)
      pb.arc(innerR, innerR, 0, tgtLarge, true, tx2, ty2)
      // Bezier back to source
      pb.quadTo(cx, cy, sx1, sy1)
      pb.close()

      nodes.push(path(pb.build(), {
        class: 'chartts-chord-ribbon',
        fill: color,
        fillOpacity: 0.35,
        stroke: color,
        strokeWidth: 0.3,
        'data-series': ribbon.source,
        'data-index': ri,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${arcs[ribbon.source]!.name} → ${arcs[ribbon.target]!.name}: ${ribbon.value}`,
      }))
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area, options } = ctx
    const { arcs } = buildChordLayout(data, options)
    if (arcs.length === 0) return null

    const cx = area.x + area.width / 2
    const cy = area.y + area.height / 2
    const outerR = Math.min(area.width, area.height) / 2 - 20
    const innerR = outerR - 14

    const dx = mx - cx
    const dy = my - cy
    const dist = Math.sqrt(dx * dx + dy * dy)

    // Check arc hits
    if (dist >= innerR && dist <= outerR) {
      let angle = Math.atan2(dy, dx)
      if (angle < -Math.PI / 2) angle += Math.PI * 2

      for (const arc of arcs) {
        if (angle >= arc.startAngle && angle <= arc.endAngle) {
          const midAngle = (arc.startAngle + arc.endAngle) / 2
          const midR = (innerR + outerR) / 2
          return { seriesIndex: arc.index, pointIndex: 0, distance: 0, x: cx + midR * Math.cos(midAngle), y: cy + midR * Math.sin(midAngle) }
        }
      }
    }

    return null
  },
}

// ---------------------------------------------------------------------------
// Layout computation
// ---------------------------------------------------------------------------

function buildChordLayout(
  data: PreparedData,
  _options: ResolvedOptions,
): { arcs: ChordArc[]; ribbons: ChordRibbon[]; matrix: number[][] } {
  const arcs: ChordArc[] = []
  const ribbons: ChordRibbon[] = []

  // Check for arrow notation
  const hasArrows = data.series.some(s => s.name.includes('→') || s.name.includes('->'))

  // Build adjacency matrix
  const nodeNames: string[] = []
  const nodeMap = new Map<string, number>()

  function getOrCreate(name: string): number {
    if (nodeMap.has(name)) return nodeMap.get(name)!
    const idx = nodeNames.length
    nodeMap.set(name, idx)
    nodeNames.push(name)
    return idx
  }

  if (hasArrows) {
    // Parse arrow notation
    for (const series of data.series) {
      const parts = series.name.split(/\s*(?:→|->)\s*/)
      if (parts.length < 2) continue
      getOrCreate(parts[0]!.trim())
      getOrCreate(parts[1]!.trim())
    }
  } else {
    for (let i = 0; i < data.labels.length; i++) {
      getOrCreate(String(data.labels[i]))
    }
  }

  const n = nodeNames.length
  if (n === 0) return { arcs, ribbons, matrix: [] }

  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))

  if (hasArrows) {
    for (const series of data.series) {
      const parts = series.name.split(/\s*(?:→|->)\s*/)
      if (parts.length < 2) continue
      const src = getOrCreate(parts[0]!.trim())
      const tgt = getOrCreate(parts[1]!.trim())
      const val = series.values[0] ?? 0
      if (val > 0) matrix[src]![tgt]! += val
    }
  } else {
    for (let si = 0; si < data.series.length && si < n; si++) {
      for (let j = 0; j < data.series[si]!.values.length && j < n; j++) {
        const val = data.series[si]!.values[j]!
        if (val > 0) matrix[si]![j]! = val
      }
    }
  }

  // Compute totals per node
  const totals = nodeNames.map((_, i) => {
    let total = 0
    for (let j = 0; j < n; j++) {
      total += matrix[i]![j]!
      total += matrix[j]![i]!
    }
    return total
  })

  const grandTotal = totals.reduce((s, t) => s + t, 0)
  if (grandTotal === 0) return { arcs, ribbons, matrix }

  // Layout arcs
  const padAngle = 0.04
  const totalPad = padAngle * n
  const available = Math.PI * 2 - totalPad

  let angle = -Math.PI / 2
  for (let i = 0; i < n; i++) {
    const span = (totals[i]! / grandTotal) * available
    arcs.push({
      index: i,
      name: nodeNames[i]!,
      total: totals[i]!,
      startAngle: angle,
      endAngle: angle + span,
    })
    angle += span + padAngle
  }

  // Layout ribbons — track offsets within each arc
  const arcOffsets = arcs.map(a => a.startAngle)

  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const val = matrix[i]![j]! + matrix[j]![i]!
      if (val <= 0) continue

      const srcSpan = (matrix[i]![j]! / Math.max(totals[i]!, 1)) * (arcs[i]!.endAngle - arcs[i]!.startAngle)
      const tgtSpan = (matrix[j]![i]! / Math.max(totals[j]!, 1)) * (arcs[j]!.endAngle - arcs[j]!.startAngle)

      ribbons.push({
        source: i,
        target: j,
        value: val,
        sourceStart: arcOffsets[i]!,
        sourceEnd: arcOffsets[i]! + srcSpan,
        targetStart: arcOffsets[j]!,
        targetEnd: arcOffsets[j]! + tgtSpan,
      })

      arcOffsets[i]! += srcSpan
      arcOffsets[j]! += tgtSpan
    }
  }

  return { arcs, ribbons, matrix }
}
