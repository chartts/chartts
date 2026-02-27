import type { GraphNode, GraphEdge } from './types'

/**
 * Force-directed layout (Fruchterman-Reingold style).
 *
 * - Node-size-aware repulsion (prevents shape overlap)
 * - Pin support (pinned nodes keep position, still repel)
 * - Velocity damping (0.8x per iteration)
 */

export interface ForceLayoutOpts {
  iterations: number
  area: { x: number; y: number; width: number; height: number }
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

  // Initialize positions: pinned nodes get their pin, others in a circle
  // Use large initial spread so force simulation pushes nodes apart, not together
  for (let i = 0; i < n; i++) {
    const node = nodes[i]!
    if (node.pin) {
      node.x = area.x + node.pin.x * area.width
      node.y = area.y + node.pin.y * area.height
    } else {
      const angle = (2 * Math.PI * i) / n
      const r = Math.min(area.width, area.height) * 0.4
      node.x = cx + r * Math.cos(angle)
      node.y = cy + r * Math.sin(angle)
    }
    node.vx = 0
    node.vy = 0
  }

  // k = ideal edge length, scaled up for node sizes
  const avgNodeSize = nodes.reduce((s, nd) => s + Math.max(nd.width, nd.height), 0) / n
  const k = Math.max(
    Math.sqrt((area.width * area.height) / Math.max(n, 1)),
    avgNodeSize * 2,
  )
  const repulsion = k * k * 1.5

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

        // Minimum separation = sum of half-diagonals + gap
        const ri = Math.sqrt(ni.width * ni.width + ni.height * ni.height) / 2
        const rj = Math.sqrt(nj.width * nj.width + nj.height * nj.height) / 2
        const minDist = ri + rj + 12
        const effectiveDist = Math.max(dist - minDist * 0.5, 1)

        const force = repulsion / (effectiveDist * effectiveDist)
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force

        ni.vx += fx
        ni.vy += fy
        nj.vx -= fx
        nj.vy -= fy
      }
    }

    // Attraction along edges (weaker to let repulsion separate nodes)
    for (const edge of edges) {
      const src = nodes[edge.source]!
      const tgt = nodes[edge.target]!
      const dx = tgt.x - src.x
      const dy = tgt.y - src.y
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
      const force = (dist * dist) / k
      const fx = (dx / dist) * force * 0.08
      const fy = (dy / dist) * force * 0.08

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
      if (node.pin) continue

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

  // Post-layout overlap resolution: push apart any nodes that still overlap
  for (let pass = 0; pass < 10; pass++) {
    let moved = false
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const ni = nodes[i]!
        const nj = nodes[j]!
        if (ni.pin && nj.pin) continue

        // Axis-aligned overlap check
        const overlapX = (ni.width + nj.width) / 2 + 8 - Math.abs(ni.x - nj.x)
        const overlapY = (ni.height + nj.height) / 2 + 8 - Math.abs(ni.y - nj.y)
        if (overlapX <= 0 || overlapY <= 0) continue

        // Push apart along the axis with less overlap
        const pushX = overlapX < overlapY
        const push = (pushX ? overlapX : overlapY) / 2 + 1

        if (pushX) {
          const dir = ni.x >= nj.x ? 1 : -1
          if (!ni.pin) ni.x += dir * push
          if (!nj.pin) nj.x -= dir * push
        } else {
          const dir = ni.y >= nj.y ? 1 : -1
          if (!ni.pin) ni.y += dir * push
          if (!nj.pin) nj.y -= dir * push
        }
        moved = true
      }
    }
    if (!moved) break

    // Re-constrain
    for (const node of nodes) {
      if (node.pin) continue
      const mx = Math.max(20, node.width / 2 + 5)
      const my = Math.max(20, node.height / 2 + 5)
      node.x = Math.max(area.x + mx, Math.min(area.x + area.width - mx, node.x))
      node.y = Math.max(area.y + my, Math.min(area.y + area.height - my, node.y))
    }
  }
}
