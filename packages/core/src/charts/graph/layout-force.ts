import type { GraphNode, GraphEdge } from './types'

/**
 * Improved force-directed layout (Fruchterman-Reingold style).
 *
 * Features over the old layout:
 * - Node-size-aware repulsion (prevents shape overlap)
 * - Pin support (pinned nodes keep position, still repel)
 * - Velocity damping (0.8x per iteration)
 * - Layout caching for warm-start during drag
 */

export interface ForceLayoutOpts {
  iterations: number
  area: { x: number; y: number; width: number; height: number }
}

/** Module-scoped layout cache for warm-start (drag reflows). */
const layoutCache = new Map<string, Array<{ x: number; y: number }>>()

/** Build a cache key from node IDs + edge connectivity. */
function cacheKey(nodes: GraphNode[], edges: GraphEdge[]): string {
  const nk = nodes.map(n => n.id).join(',')
  const ek = edges.map(e => `${e.source}-${e.target}`).join(',')
  return nk + '|' + ek
}

export function forceLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  opts: ForceLayoutOpts,
): void {
  const { area, iterations } = opts
  const n = nodes.length
  if (n === 0) return

  const cx = area.x + area.width / 2
  const cy = area.y + area.height / 2

  // Try warm-start from cache
  const key = cacheKey(nodes, edges)
  const cached = layoutCache.get(key)

  if (cached && cached.length === n) {
    for (let i = 0; i < n; i++) {
      const node = nodes[i]!
      if (!node.pin) {
        node.x = cached[i]!.x
        node.y = cached[i]!.y
      }
    }
  } else {
    // Initialize positions: pinned nodes get their pin, others in a circle
    for (let i = 0; i < n; i++) {
      const node = nodes[i]!
      if (node.pin) {
        // Pin coordinates are 0-1 normalized — map to area
        node.x = area.x + node.pin.x * area.width
        node.y = area.y + node.pin.y * area.height
      } else {
        const angle = (2 * Math.PI * i) / n
        const r = Math.min(area.width, area.height) * 0.3
        node.x = cx + r * Math.cos(angle)
        node.y = cy + r * Math.sin(angle)
      }
      node.vx = 0
      node.vy = 0
    }
  }

  const k = Math.sqrt((area.width * area.height) / Math.max(n, 1))
  const repulsion = k * k

  for (let iter = 0; iter < iterations; iter++) {
    const temp = 0.1 * (1 - iter / iterations) * Math.min(area.width, area.height) * 0.5

    // Reset velocities
    for (const node of nodes) {
      node.vx = 0
      node.vy = 0
    }

    // Repulsion between all pairs (node-size-aware)
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const ni = nodes[i]!
        const nj = nodes[j]!
        const dx = ni.x - nj.x
        const dy = ni.y - nj.y
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1)

        // Extra repulsion for overlapping shapes
        const minDist = (Math.max(ni.width, ni.height) + Math.max(nj.width, nj.height)) / 2
        const effectiveDist = Math.max(dist - minDist * 0.6, 1)

        const force = repulsion / (effectiveDist * effectiveDist)
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force

        ni.vx += fx
        ni.vy += fy
        nj.vx -= fx
        nj.vy -= fy
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const src = nodes[edge.source]!
      const tgt = nodes[edge.target]!
      const dx = tgt.x - src.x
      const dy = tgt.y - src.y
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
      const force = (dist * dist) / k
      const fx = (dx / dist) * force * 0.1
      const fy = (dy / dist) * force * 0.1

      src.vx += fx
      src.vy += fy
      tgt.vx -= fx
      tgt.vy -= fy
    }

    // Gravity toward center
    for (const node of nodes) {
      const dx = cx - node.x
      const dy = cy - node.y
      node.vx += dx * 0.01
      node.vy += dy * 0.01
    }

    // Apply velocities with temperature damping
    for (const node of nodes) {
      // Pinned nodes don't move
      if (node.pin) continue

      // Damping
      node.vx *= 0.8
      node.vy *= 0.8

      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy)
      if (speed > 0) {
        const capped = Math.min(speed, temp)
        node.x += (node.vx / speed) * capped
        node.y += (node.vy / speed) * capped
      }

      // Constrain to area with margin for node size
      const mx = Math.max(20, node.width / 2 + 5)
      const my = Math.max(20, node.height / 2 + 5)
      node.x = Math.max(area.x + mx, Math.min(area.x + area.width - mx, node.x))
      node.y = Math.max(area.y + my, Math.min(area.y + area.height - my, node.y))
    }
  }

  // Store in cache for warm-start
  layoutCache.set(key, nodes.map(nd => ({ x: nd.x, y: nd.y })))
}

/** Clear the layout cache (call when data changes). */
export function clearForceCache(): void {
  layoutCache.clear()
}
