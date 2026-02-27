import type { GraphNode, GraphEdge, LayoutDirection } from './types'

/**
 * Hierarchical layout — simplified Sugiyama algorithm.
 *
 * Steps:
 * 1. Layer assignment (longest-path from roots)
 * 2. Ordering (barycenter heuristic, 3 passes)
 * 3. Coordinate assignment (even distribution per layer)
 * 4. Direction mapping (TB / BT / LR / RL)
 *
 * Cycles are handled by detecting back-edges and temporarily reversing them
 * during layout, then restoring original direction.
 */

export interface HierarchyLayoutOpts {
  area: { x: number; y: number; width: number; height: number }
  direction: LayoutDirection
}

export function hierarchyLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  opts: HierarchyLayoutOpts,
): void {
  const n = nodes.length
  if (n === 0) return

  const { area, direction } = opts

  // Build adjacency lists
  const outgoing = new Array<number[]>(n)
  const incoming = new Array<number[]>(n)
  for (let i = 0; i < n; i++) {
    outgoing[i] = []
    incoming[i] = []
  }

  // Detect and break cycles via DFS
  const edgesCopy = edges.map(e => ({ ...e }))
  breakCycles(edgesCopy, n, outgoing, incoming)

  // 1. Layer assignment (longest path from roots)
  const layers = assignLayers(n, outgoing, incoming)

  // 2. Ordering within layers (barycenter heuristic)
  const layerGroups = groupByLayer(layers, n)
  orderLayers(layerGroups, outgoing, incoming, 3)

  // 3. Coordinate assignment
  const isHorizontal = direction === 'LR' || direction === 'RL'
  const maxLayer = Math.max(...layers, 0)

  const availW = area.width
  const availH = area.height

  // Layer spacing
  const layerCount = maxLayer + 1
  const layerGap = isHorizontal
    ? availW / (layerCount + 1)
    : availH / (layerCount + 1)

  for (let layer = 0; layer <= maxLayer; layer++) {
    const group = layerGroups[layer] ?? []
    if (group.length === 0) continue

    const nodeGap = isHorizontal
      ? availH / (group.length + 1)
      : availW / (group.length + 1)

    for (let pos = 0; pos < group.length; pos++) {
      const node = nodes[group[pos]!]!

      // Pinned nodes override layout
      if (node.pin) {
        node.x = area.x + node.pin.x * area.width
        node.y = area.y + node.pin.y * area.height
        continue
      }

      let layerCoord = area.x + layerGap * (layer + 1)
      let posCoord = area.y + nodeGap * (pos + 1)

      if (isHorizontal) {
        // layerCoord = x, posCoord = y
        // already correct
      } else {
        // layerCoord = y, posCoord = x
        const tmp = layerCoord
        layerCoord = posCoord
        posCoord = tmp
      }

      // Direction flipping
      switch (direction) {
        case 'TB':
          node.x = layerCoord
          node.y = posCoord
          break
        case 'BT':
          node.x = layerCoord
          node.y = area.y + area.height - (posCoord - area.y)
          break
        case 'LR':
          node.x = layerCoord
          node.y = posCoord
          break
        case 'RL':
          node.x = area.x + area.width - (layerCoord - area.x)
          node.y = posCoord
          break
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Cycle breaking via DFS
// ---------------------------------------------------------------------------

function breakCycles(
  edges: GraphEdge[],
  n: number,
  outgoing: number[][],
  incoming: number[][],
): void {
  // Build adjacency from edges
  for (const e of edges) {
    outgoing[e.source]!.push(e.target)
    incoming[e.target]!.push(e.source)
  }

  // DFS-based cycle detection — reverse back-edges
  const WHITE = 0, GRAY = 1, BLACK = 2
  const color = new Array<number>(n).fill(WHITE)

  function dfs(u: number): void {
    color[u] = GRAY
    const out = outgoing[u]!
    for (let i = 0; i < out.length; i++) {
      const v = out[i]!
      if (color[v] === GRAY) {
        // Back-edge: reverse it in the edges list
        // Find the edge u → v and reverse it
        for (const e of edges) {
          if (e.source === u && e.target === v) {
            e.source = v
            e.target = u
            break
          }
        }
        // Update adjacency
        out.splice(i, 1)
        i--
        outgoing[v]!.push(u)
        incoming[u]!.push(v)
        const idx = incoming[v]!.indexOf(u)
        if (idx >= 0) incoming[v]!.splice(idx, 1)
      } else if (color[v] === WHITE) {
        dfs(v)
      }
    }
    color[u] = BLACK
  }

  for (let i = 0; i < n; i++) {
    if (color[i] === WHITE) dfs(i)
  }
}

// ---------------------------------------------------------------------------
// Layer assignment (longest path from roots)
// ---------------------------------------------------------------------------

function assignLayers(
  n: number,
  outgoing: number[][],
  incoming: number[][],
): number[] {
  const layers = new Array<number>(n).fill(-1)

  // Roots = nodes with no incoming edges
  const roots: number[] = []
  for (let i = 0; i < n; i++) {
    if (incoming[i]!.length === 0) roots.push(i)
  }

  // If no roots (all cycles broken), pick node 0
  if (roots.length === 0 && n > 0) roots.push(0)

  // BFS from roots
  const queue: number[] = []
  for (const r of roots) {
    layers[r] = 0
    queue.push(r)
  }

  let qi = 0
  while (qi < queue.length) {
    const u = queue[qi++]!
    for (const v of outgoing[u]!) {
      const newLayer = layers[u]! + 1
      if (layers[v]! < newLayer) {
        layers[v] = newLayer
        queue.push(v)
      }
    }
  }

  // Any unassigned nodes get layer 0
  for (let i = 0; i < n; i++) {
    if (layers[i]! < 0) layers[i] = 0
  }

  return layers
}

// ---------------------------------------------------------------------------
// Group nodes by layer
// ---------------------------------------------------------------------------

function groupByLayer(layers: number[], n: number): number[][] {
  const maxLayer = Math.max(...layers, 0)
  const groups: number[][] = new Array(maxLayer + 1)
  for (let i = 0; i <= maxLayer; i++) groups[i] = []

  for (let i = 0; i < n; i++) {
    groups[layers[i]!]!.push(i)
  }
  return groups
}

// ---------------------------------------------------------------------------
// Barycenter ordering
// ---------------------------------------------------------------------------

function orderLayers(
  layerGroups: number[][],
  outgoing: number[][],
  incoming: number[][],
  passes: number,
): void {
  for (let pass = 0; pass < passes; pass++) {
    // Forward pass: order each layer based on positions of predecessors
    for (let l = 1; l < layerGroups.length; l++) {
      const layer = layerGroups[l]!
      const posMap = new Map<number, number>()
      const prevLayer = layerGroups[l - 1]!
      for (let i = 0; i < prevLayer.length; i++) posMap.set(prevLayer[i]!, i)

      layer.sort((a, b) => {
        const ba = barycenter(a, incoming, posMap)
        const bb = barycenter(b, incoming, posMap)
        return ba - bb
      })
    }

    // Backward pass: order each layer based on positions of successors
    for (let l = layerGroups.length - 2; l >= 0; l--) {
      const layer = layerGroups[l]!
      const posMap = new Map<number, number>()
      const nextLayer = layerGroups[l + 1]!
      for (let i = 0; i < nextLayer.length; i++) posMap.set(nextLayer[i]!, i)

      layer.sort((a, b) => {
        const ba = barycenter(a, outgoing, posMap)
        const bb = barycenter(b, outgoing, posMap)
        return ba - bb
      })
    }
  }
}

function barycenter(
  nodeIdx: number,
  adj: number[][],
  posMap: Map<number, number>,
): number {
  const neighbors = adj[nodeIdx]!
  if (neighbors.length === 0) return 0

  let sum = 0
  let count = 0
  for (const nb of neighbors) {
    const pos = posMap.get(nb)
    if (pos !== undefined) {
      sum += pos
      count++
    }
  }
  return count > 0 ? sum / count : 0
}
