import type { RenderNode, ThemeConfig } from '../../types'
import type { GraphNode, GraphEdge, GraphOptions } from './types'
import { path, rect, text, line } from '../../render/tree'
import { PathBuilder } from '../../render/tree'
import { clipToNodeBoundary } from './shapes'

// ---------------------------------------------------------------------------
// Arrowhead helper
// ---------------------------------------------------------------------------

function renderArrowhead(
  tipX: number,
  tipY: number,
  angle: number,
  size: number,
  color: string,
): RenderNode {
  const cosA = Math.cos(angle)
  const sinA = Math.sin(angle)

  // Base center (back from the tip along the edge direction)
  const baseX = tipX - cosA * size
  const baseY = tipY - sinA * size

  // Perpendicular offset
  const perpX = -sinA * size * 0.4
  const perpY = cosA * size * 0.4

  const leftX = baseX + perpX
  const leftY = baseY + perpY
  const rightX = baseX - perpX
  const rightY = baseY - perpY

  const pb = new PathBuilder()
  pb.moveTo(tipX, tipY)
    .lineTo(leftX, leftY)
    .lineTo(rightX, rightY)
    .close()

  return path(pb.build(), {
    fill: color,
    class: 'chartts-graph-arrow',
  })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function renderEdges(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: GraphOptions,
  theme: ThemeConfig,
): RenderNode[] {
  const result: RenderNode[] = []

  // Build a map of (source,target) pair counts so we can alternate curve
  // direction for multi-edges between the same pair.
  const pairIndex = new Map<string, number>()

  for (const edge of edges) {
    const src = nodes[edge.source]
    const tgt = nodes[edge.target]
    if (!src || !tgt) continue

    // --- 1. Connection points ------------------------------------------
    const angle = Math.atan2(tgt.y - src.y, tgt.x - src.x)
    const start = clipToNodeBoundary(src, angle)
    const end = clipToNodeBoundary(tgt, angle + Math.PI)

    // Edge attrs shared between straight / curved
    const edgeColor = edge.color ?? theme.gridColor
    const edgeAttrs = {
      class: 'chartts-graph-edge',
      stroke: edgeColor,
      strokeWidth: Math.max(1, Math.min(3, edge.weight * 0.5)),
      strokeDasharray:
        edge.style === 'dashed'
          ? '8,4'
          : edge.style === 'dotted'
            ? '2,4'
            : undefined,
      opacity: 0.6,
      fill: 'none',
    }

    // --- 2. Edge path ---------------------------------------------------
    let arrowAngle = angle // angle at the target end for the arrowhead
    let labelX = (start.x + end.x) / 2
    let labelY = (start.y + end.y) / 2

    if (options.edgeStyle === 'straight' || options.edgeStyle === undefined) {
      // Default: straight line
      result.push(line(start.x, start.y, end.x, end.y, edgeAttrs))
    } else {
      // Curved: quadratic bezier
      const pairKey =
        Math.min(edge.source, edge.target) +
        ':' +
        Math.max(edge.source, edge.target)
      const idx = pairIndex.get(pairKey) ?? 0
      pairIndex.set(pairKey, idx + 1)

      // Alternate direction: even indices go one way, odd the other
      const sign = idx % 2 === 0 ? 1 : -1

      const offset = Math.max(edge.weight * 8, 15)

      const mx = (start.x + end.x) / 2
      const my = (start.y + end.y) / 2

      // Perpendicular direction to the edge
      const perpAngle = angle + Math.PI / 2
      const cx = mx + Math.cos(perpAngle) * offset * sign
      const cy = my + Math.sin(perpAngle) * offset * sign

      const pb = new PathBuilder()
      pb.moveTo(start.x, start.y).quadTo(cx, cy, end.x, end.y)

      result.push(path(pb.build(), edgeAttrs))

      // For curved edges the arrow should follow the last segment direction
      // (from control point to end point)
      arrowAngle = Math.atan2(end.y - cy, end.x - cx)

      // Label at the midpoint of the quadratic bezier: Q(0.5) = 0.25*P0 + 0.5*CP + 0.25*P1
      labelX = 0.25 * start.x + 0.5 * cx + 0.25 * end.x
      labelY = 0.25 * start.y + 0.5 * cy + 0.25 * end.y
    }

    // --- 3. Arrowhead ---------------------------------------------------
    if (options.arrows !== false) {
      const arrowSize = 8
      result.push(renderArrowhead(end.x, end.y, arrowAngle, arrowSize, edgeColor))
    }

    // --- 4. Edge label --------------------------------------------------
    if (edge.label != null) {
      const lx = labelX
      const ly = labelY

      // Estimate label dimensions for background rect
      const charWidth = (theme.fontSizeSmall - 1) * 0.6
      const pw = edge.label.length * charWidth + 8
      const ph = (theme.fontSizeSmall - 1) + 6

      const bgFill =
        theme.background === 'transparent' ? '#fff' : theme.background

      result.push(
        rect(lx - pw / 2, ly - ph / 2, pw, ph, {
          fill: bgFill,
          rx: 3,
        }),
      )

      result.push(
        text(lx, ly, edge.label, {
          fill: theme.textMuted,
          textAnchor: 'middle',
          dominantBaseline: 'central',
          fontSize: theme.fontSizeSmall - 1,
          fontFamily: theme.fontFamily,
        }),
      )
    }
  }

  return result
}
