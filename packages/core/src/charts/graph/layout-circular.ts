import type { GraphNode, GraphEdge } from './types'

/**
 * Circular layout — nodes arranged equally around a circle.
 *
 * Features:
 * - Connectivity-based ordering to reduce edge crossings
 * - Pin support: pinned nodes keep their position, others fill gaps
 */

export interface CircularLayoutOpts {
  area: { x: number; y: number; width: number; height: number }
}

export function circularLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  opts: CircularLayoutOpts,
): void {
  const n = nodes.length
  if (n === 0) return

  const { area } = opts
  const cx = area.x + area.width / 2
  const cy = area.y + area.height / 2

  // Order nodes to reduce crossings (BFS from most-connected node)
  const order = connectivityOrder(nodes, edges)

  // Count unpinned nodes to distribute them evenly
  const unpinned: number[] = []
  for (const idx of order) {
    if (!nodes[idx]!.pin) unpinned.push(idx)
  }

  const count = Math.max(unpinned.length, 1)
  const angleStep = (2 * Math.PI) / count

  // Use elliptical layout to fill non-square areas better
  const maxNodeW = Math.max(...nodes.map(nd => nd.width), 40)
  const maxNodeH = Math.max(...nodes.map(nd => nd.height), 40)
  const margin = 10

  // Radii: fill the area minus room for the largest node
  let rx = area.width / 2 - maxNodeW / 2 - margin
  let ry = area.height / 2 - maxNodeH / 2 - margin

  // Ensure nodes don't overlap along the ellipse:
  // minimum arc spacing ≈ max(node diagonal) + gap
  if (count > 1) {
    const maxDiag = Math.max(
      ...nodes.map(nd => Math.sqrt(nd.width * nd.width + nd.height * nd.height)),
      40,
    )
    const minSpacing = maxDiag + 16
    // Approximate ellipse perimeter ≈ π * (3(a+b) - √((3a+b)(a+3b)))
    const perimApprox = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)))
    const spacingPerNode = perimApprox / count
    if (spacingPerNode < minSpacing) {
      const scale = minSpacing / spacingPerNode
      rx *= scale
      ry *= scale
    }
  }

  // Clamp so nodes stay within area
  rx = Math.max(20, Math.min(rx, area.width / 2 - margin))
  ry = Math.max(20, Math.min(ry, area.height / 2 - margin))

  const startAngle = -Math.PI / 2 // 12 o'clock

  for (let i = 0; i < unpinned.length; i++) {
    const node = nodes[unpinned[i]!]!
    const angle = startAngle + angleStep * i
    node.x = cx + rx * Math.cos(angle)
    node.y = cy + ry * Math.sin(angle)
  }

  // Apply pinned positions
  for (const node of nodes) {
    if (node.pin) {
      node.x = area.x + node.pin.x * area.width
      node.y = area.y + node.pin.y * area.height
    }
  }
}

// ---------------------------------------------------------------------------
// Connectivity-based ordering (BFS from most-connected node)
// ---------------------------------------------------------------------------

function connectivityOrder(nodes: GraphNode[], edges: GraphEdge[]): number[] {
  const n = nodes.length
  if (n === 0) return []

  // Build adjacency list
  const adj = new Array<number[]>(n)
  for (let i = 0; i < n; i++) adj[i] = []

  for (const e of edges) {
    adj[e.source]!.push(e.target)
    adj[e.target]!.push(e.source)
  }

  // Find most-connected node as BFS start
  let startNode = 0
  let maxDeg = 0
  for (let i = 0; i < n; i++) {
    if (adj[i]!.length > maxDeg) {
      maxDeg = adj[i]!.length
      startNode = i
    }
  }

  // BFS
  const visited = new Set<number>()
  const order: number[] = []
  const queue: number[] = [startNode]
  visited.add(startNode)

  while (queue.length > 0) {
    const u = queue.shift()!
    order.push(u)

    // Sort neighbors by degree (descending) for better ordering
    const neighbors = adj[u]!.filter(v => !visited.has(v))
    neighbors.sort((a, b) => adj[b]!.length - adj[a]!.length)

    for (const v of neighbors) {
      if (!visited.has(v)) {
        visited.add(v)
        queue.push(v)
      }
    }
  }

  // Add any disconnected nodes
  for (let i = 0; i < n; i++) {
    if (!visited.has(i)) order.push(i)
  }

  return order
}
