import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareNoAxes } from '../../utils/prepare'
import { group, circle, text, line } from '../../render/tree'

/**
 * Graph / Network chart — node-link diagram with force-directed layout.
 *
 * Data convention:
 * - labels: node names
 * - series[0].values: node values (controls circle radius)
 * - Edge encoding: series names contain "→" or "->" (e.g., "A → B")
 *   with values[0] = edge weight. Same as Sankey convention.
 *
 * Alternative: adjacency matrix
 * - series[i].values[j] > 0 means there's an edge from node i to node j.
 *
 * Uses a simple force simulation (no external deps):
 * - Repulsion between all nodes (Coulomb's law)
 * - Attraction along edges (Hooke's law)
 * - Gravity toward center
 */

interface GraphNode {
  name: string
  index: number
  value: number
  x: number
  y: number
  vx: number
  vy: number
}

interface GraphEdge {
  source: number
  target: number
  weight: number
}

export const graphChartType: ChartTypePlugin = {
  type: 'graph',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme, options } = ctx
    const nodes: RenderNode[] = []

    const { graphNodes, graphEdges } = parseGraphData(data, options)
    if (graphNodes.length === 0) return nodes

    // Run force simulation
    forceLayout(graphNodes, graphEdges, area, 80)

    // Render edges
    for (let ei = 0; ei < graphEdges.length; ei++) {
      const edge = graphEdges[ei]!
      const src = graphNodes[edge.source]!
      const tgt = graphNodes[edge.target]!

      nodes.push(line(src.x, src.y, tgt.x, tgt.y, {
        class: 'chartts-graph-edge',
        stroke: theme.gridColor,
        strokeWidth: Math.max(1, Math.min(3, edge.weight * 0.5)),
        opacity: 0.5,
      }))
    }

    // Compute node radii
    const maxVal = Math.max(...graphNodes.map(n => n.value), 1)
    const minR = 5
    const maxR = Math.min(20, Math.min(area.width, area.height) * 0.06)

    // Render nodes
    for (let ni = 0; ni < graphNodes.length; ni++) {
      const gn = graphNodes[ni]!
      const color = options.colors[ni % options.colors.length]!
      const r = minR + (gn.value / maxVal) * (maxR - minR)
      const nodeGroup: RenderNode[] = []

      nodeGroup.push(circle(gn.x, gn.y, r, {
        class: 'chartts-graph-node',
        fill: color,
        fillOpacity: 0.85,
        stroke: color,
        strokeWidth: 1.5,
        'data-series': ni,
        'data-index': 0,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${gn.name}: ${gn.value}`,
      }))

      // Label
      nodeGroup.push(text(gn.x, gn.y - r - 5, gn.name, {
        class: 'chartts-graph-label',
        fill: theme.textColor,
        textAnchor: 'middle',
        dominantBaseline: 'auto',
        fontSize: theme.fontSizeSmall,
        fontFamily: theme.fontFamily,
      }))

      nodes.push(group(nodeGroup, {
        class: `chartts-series chartts-series-${ni}`,
        'data-series-name': gn.name,
      }))
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area, options } = ctx
    const { graphNodes, graphEdges } = parseGraphData(data, options)
    if (graphNodes.length === 0) return null

    forceLayout(graphNodes, graphEdges, area, 80)

    const maxVal = Math.max(...graphNodes.map(n => n.value), 1)
    const minR = 5
    const maxR = Math.min(20, Math.min(area.width, area.height) * 0.06)

    let best: HitResult | null = null
    let bestDist = Infinity

    for (let ni = 0; ni < graphNodes.length; ni++) {
      const gn = graphNodes[ni]!
      const r = minR + (gn.value / maxVal) * (maxR - minR)
      const dist = Math.sqrt((mx - gn.x) ** 2 + (my - gn.y) ** 2)
      if (dist < bestDist && dist < r + 8) {
        bestDist = dist
        best = { seriesIndex: ni, pointIndex: 0, distance: dist }
      }
    }

    return best
  },
}

// ---------------------------------------------------------------------------
// Data parsing
// ---------------------------------------------------------------------------

function parseGraphData(
  data: PreparedData,
  _options: ResolvedOptions,
): { graphNodes: GraphNode[]; graphEdges: GraphEdge[] } {
  const graphNodes: GraphNode[] = []
  const graphEdges: GraphEdge[] = []
  const nodeMap = new Map<string, number>()

  function getOrCreateNode(name: string, value = 1): number {
    if (nodeMap.has(name)) return nodeMap.get(name)!
    const idx = graphNodes.length
    nodeMap.set(name, idx)
    graphNodes.push({
      name, index: idx, value,
      x: 0, y: 0, vx: 0, vy: 0,
    })
    return idx
  }

  const hasArrows = data.series.some(s => s.name.includes('→') || s.name.includes('->'))

  if (hasArrows) {
    // Edge list format
    for (const series of data.series) {
      const parts = series.name.split(/\s*(?:→|->)\s*/)
      if (parts.length < 2) continue
      const srcName = parts[0]!.trim()
      const tgtName = parts[1]!.trim()
      const weight = series.values[0] ?? 1

      const src = getOrCreateNode(srcName)
      const tgt = getOrCreateNode(tgtName)
      graphEdges.push({ source: src, target: tgt, weight })
      graphNodes[src]!.value += weight
      graphNodes[tgt]!.value += weight
    }
  } else {
    // Adjacency matrix or node list
    for (let i = 0; i < data.labels.length; i++) {
      getOrCreateNode(String(data.labels[i]), Math.abs(data.series[0]?.values[i] ?? 1))
    }

    // If multiple series with matching dimensions, treat as adjacency matrix
    if (data.series.length > 1 && data.series.length === data.labels.length) {
      for (let si = 0; si < data.series.length; si++) {
        for (let j = 0; j < data.series[si]!.values.length; j++) {
          const val = data.series[si]!.values[j]!
          if (val > 0 && si !== j) {
            graphEdges.push({ source: si, target: j, weight: val })
          }
        }
      }
    }
  }

  return { graphNodes, graphEdges }
}

// ---------------------------------------------------------------------------
// Force-directed layout (simple Fruchterman-Reingold style)
// ---------------------------------------------------------------------------

function forceLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  area: { x: number; y: number; width: number; height: number },
  iterations: number,
): void {
  const cx = area.x + area.width / 2
  const cy = area.y + area.height / 2
  const n = nodes.length

  if (n === 0) return

  // Initialize positions in a circle
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n
    const r = Math.min(area.width, area.height) * 0.3
    nodes[i]!.x = cx + r * Math.cos(angle)
    nodes[i]!.y = cy + r * Math.sin(angle)
    nodes[i]!.vx = 0
    nodes[i]!.vy = 0
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

    // Repulsion between all pairs
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = nodes[i]!.x - nodes[j]!.x
        const dy = nodes[i]!.y - nodes[j]!.y
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
        const force = repulsion / (dist * dist)
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        nodes[i]!.vx += fx
        nodes[i]!.vy += fy
        nodes[j]!.vx -= fx
        nodes[j]!.vy -= fy
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
      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy)
      if (speed > 0) {
        const capped = Math.min(speed, temp)
        node.x += (node.vx / speed) * capped
        node.y += (node.vy / speed) * capped
      }

      // Constrain to area
      const margin = 20
      node.x = Math.max(area.x + margin, Math.min(area.x + area.width - margin, node.x))
      node.y = Math.max(area.y + margin, Math.min(area.y + area.height - margin, node.y))
    }
  }
}
