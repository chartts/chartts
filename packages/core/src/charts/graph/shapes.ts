import type { RenderNode, ThemeConfig } from '../../types'
import type { GraphNode } from './types'
import { path, rect, circle, text } from '../../render/tree'
import { PathBuilder } from '../../render/tree'

// ---------------------------------------------------------------------------
// renderNodeShape — returns [shape, label] RenderNodes for a graph node
// ---------------------------------------------------------------------------

export function renderNodeShape(
  node: GraphNode,
  color: string,
  theme: ThemeConfig,
): RenderNode[] {
  const cx = node.x
  const cy = node.y
  const w = node.width
  const h = node.height

  const baseAttrs = {
    class: 'chartts-graph-node',
    fill: color,
    fillOpacity: 0.85,
    stroke: color,
    strokeWidth: 1.5,
    'data-series': node.index,
    'data-index': 0,
    tabindex: 0,
    role: 'img',
    ariaLabel: `${node.label}: ${node.value}`,
  } as const

  let shapeNode: RenderNode

  switch (node.shape) {
    case 'circle': {
      const r = Math.max(w, h) / 2
      shapeNode = circle(cx, cy, r, { ...baseAttrs })
      break
    }

    case 'diamond': {
      const pb = new PathBuilder()
      pb.moveTo(cx, cy - h / 2)
        .lineTo(cx + w / 2, cy)
        .lineTo(cx, cy + h / 2)
        .lineTo(cx - w / 2, cy)
        .close()
      shapeNode = path(pb.build(), { ...baseAttrs })
      break
    }

    case 'hexagon': {
      const rx = w / 2
      const ry = h / 2
      const pb = new PathBuilder()
      // flat-top hexagon: vertices at 0°, 60°, 120°, 180°, 240°, 300°
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 180) * (i * 60)
        const px = cx + rx * Math.cos(angle)
        const py = cy + ry * Math.sin(angle)
        if (i === 0) pb.moveTo(px, py)
        else pb.lineTo(px, py)
      }
      pb.close()
      shapeNode = path(pb.build(), { ...baseAttrs })
      break
    }

    case 'stadium': {
      shapeNode = rect(cx - w / 2, cy - h / 2, w, h, {
        ...baseAttrs,
        rx: h / 2,
      })
      break
    }

    // 'rect' is the default
    default: {
      shapeNode = rect(cx - w / 2, cy - h / 2, w, h, {
        ...baseAttrs,
        rx: 8,
      })
      break
    }
  }

  const labelNode = text(cx, cy, node.label, {
    class: 'chartts-graph-label',
    fill: '#fff',
    textAnchor: 'middle',
    dominantBaseline: 'central',
    fontSize: theme.fontSizeSmall,
    fontFamily: theme.fontFamily,
    fontWeight: 600,
  })

  return [shapeNode, labelNode]
}

// ---------------------------------------------------------------------------
// clipToNodeBoundary — find the point on a shape boundary at given angle
// ---------------------------------------------------------------------------

/** Small outward padding so edges don't touch the shape directly. */
const PAD = 3

export function clipToNodeBoundary(
  node: GraphNode,
  angle: number,
): { x: number; y: number } {
  const cx = node.x
  const cy = node.y
  const w = node.width
  const h = node.height
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  let bx: number
  let by: number

  switch (node.shape) {
    case 'circle': {
      const r = Math.max(w, h) / 2
      bx = cx + r * cos
      by = cy + r * sin
      break
    }

    case 'diamond': {
      // Diamond has 4 edges.  The half-extents along x/y are w/2 and h/2.
      // For a diamond with vertices at (0,-h/2), (w/2,0), (0,h/2), (-w/2,0)
      // the boundary along direction (cos,sin) can be found via the Minkowski
      // support function.  For a rhombus the implicit equation is
      //   |x|/(w/2) + |y|/(h/2) = 1
      // so the ray t*(cos,sin) hits the boundary at
      //   t = 1 / (|cos|/(w/2) + |sin|/(h/2))
      const hw = w / 2
      const hh = h / 2
      const t = 1 / (Math.abs(cos) / hw + Math.abs(sin) / hh)
      bx = cx + t * cos
      by = cy + t * sin
      break
    }

    case 'hexagon': {
      // Flat-top hexagon with rx = w/2, ry = h/2.
      // Vertices at angles 0°,60°,120°,180°,240°,300°.
      // Find which edge segment the ray intersects and compute intersection.
      const rx = w / 2
      const ry = h / 2
      const pt = hexBoundary(cx, cy, rx, ry, angle, cos, sin)
      bx = pt.x
      by = pt.y
      break
    }

    // rect and stadium share the same rectangular bounding box logic
    default: {
      const hw = w / 2
      const hh = h / 2
      const cornerAngle = Math.atan2(hh, hw)
      // Normalize angle into [0, 2π)
      let a = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)

      if (a < cornerAngle || a >= 2 * Math.PI - cornerAngle) {
        // hits right edge
        const t = hw / Math.abs(cos)
        bx = cx + hw
        by = cy + t * sin
      } else if (a < Math.PI - cornerAngle) {
        // hits bottom edge
        const t = hh / Math.abs(sin)
        bx = cx + t * cos
        by = cy + hh
      } else if (a < Math.PI + cornerAngle) {
        // hits left edge
        const t = hw / Math.abs(cos)
        bx = cx - hw
        by = cy + t * sin
      } else {
        // hits top edge
        const t = hh / Math.abs(sin)
        bx = cx + t * cos
        by = cy - hh
      }
      break
    }
  }

  // Apply outward padding
  bx += PAD * cos
  by += PAD * sin

  return { x: bx, y: by }
}

// ---------------------------------------------------------------------------
// Hexagon boundary helper
// ---------------------------------------------------------------------------

function hexBoundary(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  _angle: number,
  cos: number,
  sin: number,
): { x: number; y: number } {
  // Compute the 6 vertices of the flat-top hexagon
  const verts: Array<{ x: number; y: number }> = []
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (i * 60)
    verts.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) })
  }

  // Ray from center: P(t) = (cx + t*cos, cy + t*sin), t > 0
  // Test intersection with each of the 6 edges
  let bestT = Infinity
  let bestPt = { x: cx + rx * cos, y: cy + ry * sin } // fallback

  for (let i = 0; i < 6; i++) {
    const v0 = verts[i]!
    const v1 = verts[(i + 1) % 6]!

    // Edge: Q(s) = v0 + s*(v1 - v0), s in [0,1]
    // Solve: (cx + t*cos, cy + t*sin) = (v0.x + s*dx, v0.y + s*dy)
    const dx = v1.x - v0.x
    const dy = v1.y - v0.y

    const denom = cos * dy - sin * dx
    if (Math.abs(denom) < 1e-12) continue // parallel

    const t = ((v0.x - cx) * dy - (v0.y - cy) * dx) / denom
    const s = cos !== 0
      ? ((cx + t * cos) - v0.x) / dx
      : ((cy + t * sin) - v0.y) / dy

    if (t > 1e-6 && s >= -1e-6 && s <= 1 + 1e-6 && t < bestT) {
      bestT = t
      bestPt = { x: cx + t * cos, y: cy + t * sin }
    }
  }

  return bestPt
}
