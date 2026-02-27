import type { PreparedData, ResolvedOptions } from '../../types'
import type { GraphNode, GraphEdge, GraphOptions, NodeShape } from './types'

/**
 * Parse graph data from three possible input formats into internal
 * GraphNode[] and GraphEdge[] arrays.
 *
 * Auto-detection order:
 * 1. Rich format — options contain `.nodes` or `.edges`
 * 2. Arrow notation — any series name contains `→` or `->`
 * 3. Adjacency matrix — fallback
 */
export function parseGraphData(
  data: PreparedData,
  options: ResolvedOptions,
): { graphNodes: GraphNode[]; graphEdges: GraphEdge[] } {
  const opts = options as unknown as GraphOptions
  const defaultShape: NodeShape = opts.nodeShape ?? 'rect'

  // --- 1. Rich format ---
  if (opts.nodes || opts.edges) {
    return parseRichFormat(data, opts, defaultShape)
  }

  // --- 2. Arrow notation ---
  const hasArrow = data.series.some(
    (s) => s.name.includes('→') || s.name.includes('->'),
  )
  if (hasArrow) {
    return parseArrowNotation(data, defaultShape)
  }

  // --- 3. Adjacency matrix ---
  return parseAdjacencyMatrix(data, defaultShape)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNode(
  id: string,
  label: string,
  index: number,
  value: number,
  shape: NodeShape,
  color: string | null,
  pin: { x: number; y: number } | null,
): GraphNode {
  return {
    id,
    label,
    index,
    value,
    shape,
    color,
    pin,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    width: 0,
    height: 0,
  }
}

function makeEdge(
  source: number,
  target: number,
  weight: number,
  label: string | null,
  style: 'solid' | 'dashed' | 'dotted',
  color: string | null,
): GraphEdge {
  return { source, target, weight, label, style, color }
}

// ---------------------------------------------------------------------------
// Rich format
// ---------------------------------------------------------------------------

function parseRichFormat(
  _data: PreparedData,
  opts: GraphOptions,
  defaultShape: NodeShape,
): { graphNodes: GraphNode[]; graphEdges: GraphEdge[] } {
  const graphNodes: GraphNode[] = []
  const idToIndex = new Map<string, number>()

  // Create nodes from opts.nodes
  if (opts.nodes) {
    for (const nodeDef of opts.nodes) {
      const idx = graphNodes.length
      idToIndex.set(nodeDef.id, idx)
      graphNodes.push(
        makeNode(
          nodeDef.id,
          nodeDef.label ?? nodeDef.id,
          idx,
          1,
          nodeDef.shape ?? defaultShape,
          nodeDef.color ?? null,
          nodeDef.pin ?? null,
        ),
      )
    }
  }

  const graphEdges: GraphEdge[] = []

  if (opts.edges) {
    for (const edgeDef of opts.edges) {
      // Auto-create source node if not declared
      if (!idToIndex.has(edgeDef.source)) {
        const idx = graphNodes.length
        idToIndex.set(edgeDef.source, idx)
        graphNodes.push(
          makeNode(edgeDef.source, edgeDef.source, idx, 1, defaultShape, null, null),
        )
      }

      // Auto-create target node if not declared
      if (!idToIndex.has(edgeDef.target)) {
        const idx = graphNodes.length
        idToIndex.set(edgeDef.target, idx)
        graphNodes.push(
          makeNode(edgeDef.target, edgeDef.target, idx, 1, defaultShape, null, null),
        )
      }

      const srcIdx = idToIndex.get(edgeDef.source)!
      const tgtIdx = idToIndex.get(edgeDef.target)!

      graphEdges.push(
        makeEdge(
          srcIdx,
          tgtIdx,
          edgeDef.weight ?? 1,
          edgeDef.label ?? null,
          edgeDef.style ?? 'solid',
          edgeDef.color ?? null,
        ),
      )
    }
  }

  return { graphNodes, graphEdges }
}

// ---------------------------------------------------------------------------
// Arrow notation
// ---------------------------------------------------------------------------

const ARROW_RE = /\s*(?:→|->)\s*/

function parseArrowNotation(
  data: PreparedData,
  defaultShape: NodeShape,
): { graphNodes: GraphNode[]; graphEdges: GraphEdge[] } {
  const graphNodes: GraphNode[] = []
  const nameToIndex = new Map<string, number>()
  const graphEdges: GraphEdge[] = []

  function getOrCreateNode(name: string): number {
    let idx = nameToIndex.get(name)
    if (idx !== undefined) return idx
    idx = graphNodes.length
    nameToIndex.set(name, idx)
    graphNodes.push(makeNode(name, name, idx, 0, defaultShape, null, null))
    return idx
  }

  for (const series of data.series) {
    const parts = series.name.split(ARROW_RE)
    if (parts.length < 2) continue

    const srcName = parts[0]!
    const tgtName = parts[1]!
    const weight = series.values[0] ?? 1

    const srcIdx = getOrCreateNode(srcName)
    const tgtIdx = getOrCreateNode(tgtName)

    // Accumulate value from edge weights
    graphNodes[srcIdx]!.value += weight
    graphNodes[tgtIdx]!.value += weight

    graphEdges.push(makeEdge(srcIdx, tgtIdx, weight, null, 'solid', null))
  }

  return { graphNodes, graphEdges }
}

// ---------------------------------------------------------------------------
// Adjacency matrix
// ---------------------------------------------------------------------------

function parseAdjacencyMatrix(
  data: PreparedData,
  defaultShape: NodeShape,
): { graphNodes: GraphNode[]; graphEdges: GraphEdge[] } {
  const graphNodes: GraphNode[] = []

  // Create nodes from labels
  for (let i = 0; i < data.labels.length; i++) {
    const name = String(data.labels[i])
    const value = Math.abs(data.series[0]?.values[i] ?? 1)
    graphNodes.push(makeNode(name, name, i, value, defaultShape, null, null))
  }

  const graphEdges: GraphEdge[] = []

  // If series count > 1 and matches label count, treat as adjacency matrix
  if (data.series.length > 1 && data.series.length === data.labels.length) {
    for (let i = 0; i < data.series.length; i++) {
      const row = data.series[i]!
      for (let j = 0; j < row.values.length; j++) {
        const weight = row.values[j] ?? 0
        if (weight > 0) {
          graphEdges.push(makeEdge(i, j, weight, null, 'solid', null))
        }
      }
    }
  }

  return { graphNodes, graphEdges }
}
