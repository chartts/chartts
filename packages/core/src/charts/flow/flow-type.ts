import type {
  ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult,
} from '../../types'
import { defineChartType } from '../../api/define'
import { prepareNoAxes } from '../../utils/prepare'
import { group, rect, path, text } from '../../render/tree'
import { PathBuilder } from '../../render/tree'

/**
 * Flow chart — process diagram with shaped nodes and directed edges.
 *
 * Data convention:
 * - labels: node names. Shape detected from naming conventions:
 *   - Starting with "[" → decision (diamond)
 *   - Starting with "(" → terminal (rounded rect / stadium)
 *   - Default → process (rect)
 * - series with " -> " in name → edge (from -> to), values[0] = weight
 * - series without " -> " → node metadata (ignored for layout)
 *
 * Layout: left-to-right layered (topological sort into columns).
 */

interface FlowNode {
  name: string
  index: number
  shape: 'rect' | 'diamond' | 'rounded'
  layer: number
  layerOrder: number
  x: number
  y: number
}

interface FlowEdge {
  from: number
  to: number
  weight: number
}

export const flowChartType = defineChartType({
  type: 'flow',
  suppressAxes: true,

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme, options } = ctx
    const nodes: RenderNode[] = []

    if (data.labels.length === 0) return nodes

    const { flowNodes, edges } = parseFlowData(data)
    if (flowNodes.length === 0) return nodes

    assignLayers(flowNodes, edges)
    layoutNodes(flowNodes, area)

    // Node dimensions
    const nodeW = Math.min(area.width / (getMaxLayer(flowNodes) + 2) * 0.65, 110)
    const nodeH = Math.min(area.height / (getMaxLayerCount(flowNodes) + 1) * 0.55, 36)

    // Render edges first (below nodes)
    const edgeNodes: RenderNode[] = []
    for (const edge of edges) {
      const from = flowNodes[edge.from]
      const to = flowNodes[edge.to]
      if (!from || !to) continue

      const pb = new PathBuilder()
      const startX = from.x + nodeW / 2
      const endX = to.x - nodeW / 2
      const midX = (startX + endX) / 2

      pb.moveTo(startX, from.y)
      pb.curveTo(midX, from.y, midX, to.y, endX, to.y)

      edgeNodes.push(path(pb.build(), {
        class: 'chartts-flow-edge',
        stroke: theme.gridColor,
        strokeWidth: 1.5,
        fill: 'none',
      }))

      // Arrowhead
      const arrowSize = 6
      const apb = new PathBuilder()
      apb.moveTo(endX, to.y)
      apb.lineTo(endX - arrowSize, to.y - arrowSize * 0.6)
      apb.lineTo(endX - arrowSize, to.y + arrowSize * 0.6)
      apb.close()

      edgeNodes.push(path(apb.build(), {
        class: 'chartts-flow-arrow',
        fill: theme.gridColor,
      }))
    }
    if (edgeNodes.length > 0) {
      nodes.push(group(edgeNodes, { class: 'chartts-flow-edges' }))
    }

    // Render nodes
    for (let i = 0; i < flowNodes.length; i++) {
      const fNode = flowNodes[i]!
      const color = options.colors[i % options.colors.length]!
      const cardNodes: RenderNode[] = []

      if (fNode.shape === 'diamond') {
        // Diamond (decision)
        const dw = nodeW * 0.6
        const dh = nodeH * 0.85
        const dpb = new PathBuilder()
        dpb.moveTo(fNode.x, fNode.y - dh)
        dpb.lineTo(fNode.x + dw, fNode.y)
        dpb.lineTo(fNode.x, fNode.y + dh)
        dpb.lineTo(fNode.x - dw, fNode.y)
        dpb.close()

        cardNodes.push(path(dpb.build(), {
          class: 'chartts-flow-node chartts-flow-decision',
          fill: color,
          'data-series': 0,
          'data-index': i,
          tabindex: 0,
          role: 'img',
          ariaLabel: fNode.name,
        }))
      } else if (fNode.shape === 'rounded') {
        // Stadium / terminal shape (very rounded rect)
        cardNodes.push(rect(fNode.x - nodeW / 2, fNode.y - nodeH / 2, nodeW, nodeH, {
          rx: nodeH / 2, ry: nodeH / 2,
          class: 'chartts-flow-node chartts-flow-terminal',
          fill: color,
          'data-series': 0,
          'data-index': i,
          tabindex: 0,
          role: 'img',
          ariaLabel: fNode.name,
        }))
      } else {
        // Rectangle (process)
        cardNodes.push(rect(fNode.x - nodeW / 2, fNode.y - nodeH / 2, nodeW, nodeH, {
          rx: 4, ry: 4,
          class: 'chartts-flow-node chartts-flow-process',
          fill: color,
          'data-series': 0,
          'data-index': i,
          tabindex: 0,
          role: 'img',
          ariaLabel: fNode.name,
        }))
      }

      // Label inside node
      const displayName = fNode.name.replace(/^\[|\]$|^\(|\)$/g, '')
      const fontSize = Math.min(theme.fontSizeSmall, nodeH * 0.38)
      const maxChars = Math.floor(nodeW / (fontSize * 0.55))
      const labelText = displayName.length > maxChars
        ? displayName.slice(0, maxChars - 1) + '\u2026'
        : displayName

      cardNodes.push(text(fNode.x, fNode.y, labelText, {
        class: 'chartts-flow-label',
        fill: '#fff',
        textAnchor: 'middle',
        dominantBaseline: 'central',
        fontSize,
        fontFamily: theme.fontFamily,
        fontWeight: 600,
      }))

      nodes.push(group(cardNodes, {
        class: `chartts-series chartts-series-${i}`,
        'data-series-name': fNode.name,
      }))
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area } = ctx
    if (data.labels.length === 0) return null

    const { flowNodes, edges } = parseFlowData(data)
    if (flowNodes.length === 0) return null

    assignLayers(flowNodes, edges)
    layoutNodes(flowNodes, area)

    const nodeW = Math.min(area.width / (getMaxLayer(flowNodes) + 2) * 0.65, 110)
    const nodeH = Math.min(area.height / (getMaxLayerCount(flowNodes) + 1) * 0.55, 36)

    for (let i = 0; i < flowNodes.length; i++) {
      const fNode = flowNodes[i]!
      if (
        mx >= fNode.x - nodeW / 2 - 4 && mx <= fNode.x + nodeW / 2 + 4 &&
        my >= fNode.y - nodeH / 2 - 4 && my <= fNode.y + nodeH / 2 + 4
      ) {
        return { seriesIndex: 0, pointIndex: i, distance: 0, x: fNode.x, y: fNode.y }
      }
    }

    return null
  },
})

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function parseFlowData(data: PreparedData): { flowNodes: FlowNode[]; edges: FlowEdge[] } {
  const labels = data.labels ?? []
  const nameToIndex = new Map<string, number>()
  const flowNodes: FlowNode[] = []

  for (let i = 0; i < labels.length; i++) {
    const name = String(labels[i] ?? '')
    let shape: FlowNode['shape'] = 'rect'
    if (name.startsWith('[')) shape = 'diamond'
    else if (name.startsWith('(')) shape = 'rounded'

    flowNodes.push({
      name,
      index: i,
      shape,
      layer: 0,
      layerOrder: 0,
      x: 0,
      y: 0,
    })
    nameToIndex.set(name, i)
  }

  const edges: FlowEdge[] = []
  for (const series of data.series) {
    if (!series.name.includes(' -> ')) continue
    const [fromName, toName] = series.name.split(' -> ').map(s => s.trim())
    const fromIdx = nameToIndex.get(fromName!)
    const toIdx = nameToIndex.get(toName!)
    if (fromIdx !== undefined && toIdx !== undefined) {
      edges.push({ from: fromIdx, to: toIdx, weight: series.values[0] ?? 1 })
    }
  }

  return { flowNodes, edges }
}

// ---------------------------------------------------------------------------
// Layer assignment (topological)
// ---------------------------------------------------------------------------

function assignLayers(flowNodes: FlowNode[], edges: FlowEdge[]): void {
  // Build adjacency
  const inDegree = new Array(flowNodes.length).fill(0) as number[]
  const adj: number[][] = flowNodes.map(() => [])

  for (const edge of edges) {
    adj[edge.from]!.push(edge.to)
    inDegree[edge.to]!++
  }

  // BFS layer assignment
  const queue: number[] = []
  for (let i = 0; i < flowNodes.length; i++) {
    if (inDegree[i] === 0) {
      queue.push(i)
      flowNodes[i]!.layer = 0
    }
  }

  const visited = new Set<number>()
  while (queue.length > 0) {
    const curr = queue.shift()!
    if (visited.has(curr)) continue
    visited.add(curr)

    for (const next of adj[curr]!) {
      flowNodes[next]!.layer = Math.max(flowNodes[next]!.layer, flowNodes[curr]!.layer + 1)
      inDegree[next]!--
      if (inDegree[next] === 0) {
        queue.push(next)
      }
    }
  }

  // Assign nodes that weren't reached (disconnected)
  for (let i = 0; i < flowNodes.length; i++) {
    if (!visited.has(i)) {
      flowNodes[i]!.layer = 0
    }
  }
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

function layoutNodes(
  flowNodes: FlowNode[],
  area: { x: number; y: number; width: number; height: number },
): void {
  const maxLayer = getMaxLayer(flowNodes)
  const layerWidth = area.width / Math.max(maxLayer + 1, 1)

  // Group by layer
  const layers: FlowNode[][] = []
  for (const node of flowNodes) {
    if (!layers[node.layer]) layers[node.layer] = []
    layers[node.layer]!.push(node)
  }

  // Position each layer
  for (let l = 0; l <= maxLayer; l++) {
    const nodesInLayer = layers[l] ?? []
    const layerH = area.height / Math.max(nodesInLayer.length, 1)

    for (let j = 0; j < nodesInLayer.length; j++) {
      const node = nodesInLayer[j]!
      node.x = area.x + l * layerWidth + layerWidth / 2
      node.y = area.y + j * layerH + layerH / 2
      node.layerOrder = j
    }
  }
}

function getMaxLayer(flowNodes: FlowNode[]): number {
  let max = 0
  for (const n of flowNodes) {
    if (n.layer > max) max = n.layer
  }
  return max
}

function getMaxLayerCount(flowNodes: FlowNode[]): number {
  const counts = new Map<number, number>()
  for (const n of flowNodes) {
    counts.set(n.layer, (counts.get(n.layer) ?? 0) + 1)
  }
  let max = 0
  for (const c of counts.values()) {
    if (c > max) max = c
  }
  return max
}
