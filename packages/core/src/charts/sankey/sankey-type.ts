import type {
  ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult,
} from '../../types'
import { defineChartType } from '../../api/define'
import { prepareNoAxes } from '../../utils/prepare'
import { group, path, rect, text } from '../../render/tree'
import { PathBuilder } from '../../render/tree'

/**
 * Sankey / flow diagram.
 *
 * Data convention:
 * - labels: node names (unique). First N are source layer, rest are target layer.
 * - series[i]: a flow. series[i].name = "Source → Target", series[i].values = [flowValue]
 *
 * Alternative (simpler): encode flows as a flat list.
 * - labels: all unique node names
 * - series[0].values: flat list of flow values
 * - options.links: array of { source: number, target: number, value: number }
 *
 * This implementation auto-detects the format:
 * If series names contain "→" or "->", parse as source→target flows.
 * Otherwise treat as adjacency: series[i] = from node i, values[j] = flow to node j.
 */

interface SankeyNode {
  name: string
  index: number
  column: number
  y: number
  height: number
  totalIn: number
  totalOut: number
}

interface SankeyLink {
  source: number
  target: number
  value: number
  sy: number   // source y offset
  ty: number   // target y offset
  width: number
}

export const sankeyChartType = defineChartType({
  type: 'sankey',
  suppressAxes: true,


  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme, options } = ctx
    const nodes: RenderNode[] = []

    const { sankeyNodes, sankeyLinks } = parseSankeyData(data, options)
    if (sankeyNodes.length === 0 || sankeyLinks.length === 0) return nodes

    // Layout
    const columns = layoutColumns(sankeyNodes, sankeyLinks, area)
    const nodeWidth = Math.min(20, area.width * 0.04)
    const nodePadding = 8

    // Position nodes within columns
    for (const col of columns) {
      const colNodes = sankeyNodes.filter(n => n.column === col)
      const totalHeight = colNodes.reduce((s, n) => s + n.height, 0)
      const gaps = Math.max(0, colNodes.length - 1) * nodePadding
      const scale = (area.height - gaps) / Math.max(totalHeight, 1)

      let y = area.y
      for (const node of colNodes) {
        node.height = node.height * scale
        node.y = y
        y += node.height + nodePadding
      }
    }

    // Compute link positions
    computeLinkPositions(sankeyNodes, sankeyLinks)

    // Render links (curved bands)
    for (let li = 0; li < sankeyLinks.length; li++) {
      const link = sankeyLinks[li]!
      const src = sankeyNodes[link.source]!
      const tgt = sankeyNodes[link.target]!
      const x0 = src.y !== undefined ? getNodeX(src, columns, area, nodeWidth) + nodeWidth : 0
      const x1 = tgt.y !== undefined ? getNodeX(tgt, columns, area, nodeWidth) : 0
      const y0 = src.y + link.sy
      const y1 = tgt.y + link.ty
      const w = link.width

      const pb = new PathBuilder()
      const cx = (x0 + x1) / 2
      pb.moveTo(x0, y0)
      pb.curveTo(cx, y0, cx, y1, x1, y1)
      pb.vTo(y1 + w)
      pb.curveTo(cx, y1 + w, cx, y0 + w, x0, y0 + w)
      pb.close()

      const color = options.colors[link.source % options.colors.length]!

      nodes.push(path(pb.build(), {
        class: 'chartts-sankey-link',
        fill: color,
        fillOpacity: 0.3,
        'data-series': link.source,
        'data-index': li,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${src.name} → ${tgt.name}: ${link.value}`,
      }))
    }

    // Render nodes (rectangles + labels)
    for (let ni = 0; ni < sankeyNodes.length; ni++) {
      const node = sankeyNodes[ni]!
      const x = getNodeX(node, columns, area, nodeWidth)
      const color = options.colors[ni % options.colors.length]!
      const nodeGroup: RenderNode[] = []

      nodeGroup.push(rect(x, node.y, nodeWidth, Math.max(node.height, 2), {
        rx: 3, ry: 3,
        class: 'chartts-sankey-node',
        fill: color,
        'data-series': ni,
        'data-index': 0,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${node.name}: ${Math.max(node.totalIn, node.totalOut)}`,
      }))

      // Label
      const isLeft = node.column < columns.length / 2
      const labelX = isLeft ? x + nodeWidth + 6 : x - 6
      const anchor = isLeft ? 'start' : 'end'

      nodeGroup.push(text(labelX, node.y + node.height / 2, node.name, {
        class: 'chartts-sankey-label',
        fill: theme.textColor,
        textAnchor: anchor as 'start' | 'end',
        dominantBaseline: 'central',
        fontSize: theme.fontSizeSmall,
        fontFamily: theme.fontFamily,
      }))

      nodes.push(group(nodeGroup, {
        class: `chartts-series chartts-series-${ni}`,
        'data-series-name': node.name,
      }))
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area, options } = ctx
    const { sankeyNodes, sankeyLinks } = parseSankeyData(data, options)
    if (sankeyNodes.length === 0) return null

    const columns = layoutColumns(sankeyNodes, sankeyLinks, area)
    const nodeWidth = Math.min(20, area.width * 0.04)
    const nodePadding = 8

    // Re-layout (same as render)
    for (const col of columns) {
      const colNodes = sankeyNodes.filter(n => n.column === col)
      const totalHeight = colNodes.reduce((s, n) => s + n.height, 0)
      const gaps = Math.max(0, colNodes.length - 1) * nodePadding
      const scale = (area.height - gaps) / Math.max(totalHeight, 1)
      let y = area.y
      for (const node of colNodes) {
        node.height = node.height * scale
        node.y = y
        y += node.height + nodePadding
      }
    }

    // Check node hits
    for (let ni = 0; ni < sankeyNodes.length; ni++) {
      const node = sankeyNodes[ni]!
      const x = getNodeX(node, columns, area, nodeWidth)
      if (mx >= x && mx <= x + nodeWidth && my >= node.y && my <= node.y + node.height) {
        return { seriesIndex: ni, pointIndex: 0, distance: 0, x: x + nodeWidth / 2, y: node.y + node.height / 2 }
      }
    }

    return null
  },
})

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

function parseSankeyData(
  data: PreparedData,
  _options: ResolvedOptions,
): { sankeyNodes: SankeyNode[]; sankeyLinks: SankeyLink[] } {
  const sankeyNodes: SankeyNode[] = []
  const sankeyLinks: SankeyLink[] = []
  const nodeMap = new Map<string, number>()

  function getOrCreateNode(name: string): number {
    if (nodeMap.has(name)) return nodeMap.get(name)!
    const idx = sankeyNodes.length
    nodeMap.set(name, idx)
    sankeyNodes.push({
      name,
      index: idx,
      column: -1,
      y: 0,
      height: 0,
      totalIn: 0,
      totalOut: 0,
    })
    return idx
  }

  // Check if series names contain arrow notation
  const hasArrows = data.series.some(s => s.name.includes('→') || s.name.includes('->'))

  if (hasArrows) {
    // Format: each series is a flow "Source → Target"
    for (const series of data.series) {
      const parts = series.name.split(/\s*(?:→|->)\s*/)
      if (parts.length < 2) continue
      const srcName = parts[0]!.trim()
      const tgtName = parts[1]!.trim()
      const value = series.values[0] ?? 0
      if (value <= 0) continue

      const src = getOrCreateNode(srcName)
      const tgt = getOrCreateNode(tgtName)
      sankeyLinks.push({ source: src, target: tgt, value, sy: 0, ty: 0, width: 0 })
      sankeyNodes[src]!.totalOut += value
      sankeyNodes[tgt]!.totalIn += value
    }
  } else {
    // Format: adjacency matrix. labels = node names, series[i].values[j] = flow i→j
    for (let i = 0; i < data.labels.length; i++) {
      getOrCreateNode(String(data.labels[i]))
    }
    for (let si = 0; si < data.series.length; si++) {
      for (let j = 0; j < data.series[si]!.values.length; j++) {
        const value = data.series[si]!.values[j]!
        if (value <= 0 || si === j) continue
        if (si >= sankeyNodes.length || j >= sankeyNodes.length) continue
        sankeyLinks.push({ source: si, target: j, value, sy: 0, ty: 0, width: 0 })
        sankeyNodes[si]!.totalOut += value
        sankeyNodes[j]!.totalIn += value
      }
    }
  }

  return { sankeyNodes, sankeyLinks }
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

function layoutColumns(
  nodes: SankeyNode[],
  links: SankeyLink[],
  _area: { width: number; height: number },
): number[] {
  // Assign columns via topological ordering (longest path from source)
  const adj = new Map<number, number[]>()
  const inDegree = new Map<number, number>()

  for (const n of nodes) {
    adj.set(n.index, [])
    inDegree.set(n.index, 0)
  }
  for (const l of links) {
    adj.get(l.source)!.push(l.target)
    inDegree.set(l.target, (inDegree.get(l.target) ?? 0) + 1)
  }

  // BFS for column assignment
  const queue: number[] = []
  for (const n of nodes) {
    if ((inDegree.get(n.index) ?? 0) === 0) {
      n.column = 0
      queue.push(n.index)
    }
  }

  while (queue.length > 0) {
    const idx = queue.shift()!
    const node = nodes[idx]!
    for (const tgt of adj.get(idx)!) {
      const tgtNode = nodes[tgt]!
      tgtNode.column = Math.max(tgtNode.column, node.column + 1)
      // Only add to queue once all predecessors processed
      const allPredsDone = links
        .filter(l => l.target === tgt)
        .every(l => nodes[l.source]!.column >= 0)
      if (allPredsDone && !queue.includes(tgt)) {
        queue.push(tgt)
      }
    }
  }

  // Handle any unassigned nodes (cycles or disconnected)
  for (const n of nodes) {
    if (n.column < 0) n.column = 0
  }

  // Set initial heights proportional to flow
  for (const n of nodes) {
    n.height = Math.max(n.totalIn, n.totalOut, 1)
  }

  // Get unique columns sorted
  const cols = [...new Set(nodes.map(n => n.column))].sort((a, b) => a - b)
  return cols
}

function getNodeX(
  node: SankeyNode,
  columns: number[],
  area: { x: number; width: number },
  nodeWidth: number,
): number {
  const maxCol = Math.max(...columns, 1)
  if (maxCol === 0) return area.x
  const usableWidth = area.width - nodeWidth
  return area.x + (node.column / maxCol) * usableWidth
}

function computeLinkPositions(nodes: SankeyNode[], links: SankeyLink[]): void {
  // Total flow for normalization
  const sourceOffsets = new Map<number, number>()
  const targetOffsets = new Map<number, number>()

  for (const n of nodes) {
    sourceOffsets.set(n.index, 0)
    targetOffsets.set(n.index, 0)
  }

  // Sort links by target position for visual clarity
  links.sort((a, b) => {
    const na = nodes[a.target]!
    const nb = nodes[b.target]!
    return na.y - nb.y || na.column - nb.column
  })

  for (const link of links) {
    const src = nodes[link.source]!
    const tgt = nodes[link.target]!

    const srcTotal = Math.max(src.totalOut, 1)
    const tgtTotal = Math.max(tgt.totalIn, 1)

    link.width = (link.value / srcTotal) * src.height
    const tgtWidth = (link.value / tgtTotal) * tgt.height

    link.sy = sourceOffsets.get(link.source)!
    link.ty = targetOffsets.get(link.target)!

    sourceOffsets.set(link.source, link.sy + link.width)
    targetOffsets.set(link.target, link.ty + tgtWidth)
  }
}
