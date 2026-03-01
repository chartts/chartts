import type {
  ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult,
} from '../../types'
import { defineChartType } from '../../api/define'
import { prepareNoAxes } from '../../utils/prepare'
import { group, path, circle, text } from '../../render/tree'
import { PathBuilder } from '../../render/tree'

/**
 * Tree chart — hierarchical node-link diagram.
 *
 * Data convention:
 * - labels: node names. Hierarchy encoded via "Parent/Child/Grandchild" separators.
 * - series[0].values: node values (sizes for circles, optional).
 *
 * Layout: top-to-bottom by default. Configurable via treeLayout option.
 */

interface TreeNode {
  name: string
  value: number
  children: TreeNode[]
  depth: number
  index: number
  // Computed during layout
  x: number
  y: number
  leafCount: number
}

export interface TreeOptions extends ResolvedOptions {
  /** Layout direction. Default 'top-down'. */
  treeLayout?: 'top-down' | 'left-right' | 'radial'
  /** Node radius. Default 6. */
  nodeRadius?: number
  /** Show labels. Default true. */
  showLabels?: boolean
}

export const treeChartType = defineChartType({
  type: 'tree',
  suppressAxes: true,


  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme, options } = ctx
    const nodes: RenderNode[] = []

    const series = data.series[0]
    if (!series || series.values.length === 0) return nodes

    const treeOpts = options as TreeOptions
    const layout = treeOpts.treeLayout ?? 'top-down'
    const nodeRadius = treeOpts.nodeRadius ?? 6
    const showLabels = treeOpts.showLabels ?? true

    // Build tree
    const root = buildTree(data.labels, series.values)
    if (!root) return nodes

    // Compute leaf counts for spacing
    computeLeafCounts(root)

    // Layout nodes
    const maxDepth = getMaxDepth(root)
    const isHorizontal = layout === 'left-right'

    if (isHorizontal) {
      const levelWidth = area.width / Math.max(maxDepth + 1, 1)
      layoutHorizontal(root, area.x, area.y, area.y + area.height, levelWidth)
    } else {
      const levelHeight = area.height / Math.max(maxDepth + 1, 1)
      layoutVertical(root, area.y, area.x, area.x + area.width, levelHeight)
    }

    // Render edges first (below nodes)
    const edgeNodes: RenderNode[] = []
    renderEdges(root, edgeNodes, theme, isHorizontal)
    nodes.push(...edgeNodes)

    // Render nodes
    let nodeIdx = 0
    const renderTreeNode = (node: TreeNode) => {
      const color = options.colors[node.depth % options.colors.length]!
      const nodeGroup: RenderNode[] = []

      nodeGroup.push(circle(node.x, node.y, nodeRadius, {
        class: 'chartts-tree-node',
        fill: color,
        stroke: theme.background === 'transparent' ? '#fff' : theme.background,
        strokeWidth: 1.5,
        'data-series': 0,
        'data-index': nodeIdx,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${node.name}: ${node.value}`,
      }))

      if (showLabels) {
        const fontSize = theme.fontSizeSmall
        let labelX: number, labelY: number
        let anchor: 'start' | 'middle' | 'end'

        if (isHorizontal) {
          labelX = node.x
          labelY = node.y - nodeRadius - 4
          anchor = 'middle'
        } else {
          labelX = node.x + nodeRadius + 4
          labelY = node.y
          anchor = 'start'
          // For root, put label above
          if (node.depth === 0) {
            labelX = node.x
            labelY = node.y - nodeRadius - 4
            anchor = 'middle'
          }
        }

        nodeGroup.push(text(labelX, labelY, node.name, {
          class: 'chartts-tree-label',
          fill: theme.textColor,
          textAnchor: anchor,
          dominantBaseline: 'central',
          fontSize,
          fontFamily: theme.fontFamily,
        }))
      }

      nodes.push(group(nodeGroup, {
        class: `chartts-series chartts-series-${nodeIdx}`,
        'data-series-name': node.name,
      }))

      nodeIdx++
      for (const child of node.children) {
        renderTreeNode(child)
      }
    }

    renderTreeNode(root)

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area, options } = ctx
    const series = data.series[0]
    if (!series || series.values.length === 0) return null

    const treeOpts = options as TreeOptions
    const layout = treeOpts.treeLayout ?? 'top-down'
    const nodeRadius = treeOpts.nodeRadius ?? 6
    const hitRadius = nodeRadius + 5

    const root = buildTree(data.labels, series.values)
    if (!root) return null

    computeLeafCounts(root)
    const maxDepth = getMaxDepth(root)
    const isHorizontal = layout === 'left-right'

    if (isHorizontal) {
      const levelWidth = area.width / Math.max(maxDepth + 1, 1)
      layoutHorizontal(root, area.x, area.y, area.y + area.height, levelWidth)
    } else {
      const levelHeight = area.height / Math.max(maxDepth + 1, 1)
      layoutVertical(root, area.y, area.x, area.x + area.width, levelHeight)
    }

    let best: HitResult | null = null
    let bestDist = Infinity
    let idx = 0

    const checkNode = (node: TreeNode) => {
      const dist = Math.sqrt((mx - node.x) ** 2 + (my - node.y) ** 2)
      if (dist < bestDist && dist < hitRadius) {
        bestDist = dist
        best = { seriesIndex: 0, pointIndex: idx, distance: dist, x: node.x, y: node.y }
      }
      idx++
      for (const child of node.children) {
        checkNode(child)
      }
    }

    checkNode(root)
    return best
  },
})

// ---------------------------------------------------------------------------
// Tree building
// ---------------------------------------------------------------------------

function buildTree(labels: (string | number | Date)[], values: number[]): TreeNode | null {
  const root: TreeNode = {
    name: 'Root', value: 0, children: [], depth: 0, index: 0,
    x: 0, y: 0, leafCount: 0,
  }

  // Check if labels use "/" separators for hierarchy
  const hasHierarchy = labels.some(l => String(l).includes('/'))

  if (hasHierarchy) {
    for (let i = 0; i < labels.length; i++) {
      const parts = String(labels[i] ?? '').split('/')
      const value = Math.abs(values[i] ?? 1)
      let current = root

      for (let p = 0; p < parts.length; p++) {
        const part = parts[p]!.trim()
        if (!part) continue

        let child = current.children.find(c => c.name === part)
        if (!child) {
          child = {
            name: part, value: 0, children: [], depth: current.depth + 1,
            index: i, x: 0, y: 0, leafCount: 0,
          }
          current.children.push(child)
        }
        if (p === parts.length - 1) {
          child.value = value
        }
        current = child
      }
    }
  } else {
    // Flat list — all labels are direct children of root
    root.name = String(labels[0] ?? 'Root')
    root.value = Math.abs(values[0] ?? 1)

    for (let i = 1; i < labels.length; i++) {
      root.children.push({
        name: String(labels[i] ?? `Node ${i}`),
        value: Math.abs(values[i] ?? 1),
        children: [],
        depth: 1,
        index: i,
        x: 0, y: 0, leafCount: 0,
      })
    }
  }

  if (root.children.length === 0 && labels.length > 0) {
    // Single node
    root.name = String(labels[0] ?? 'Root')
    root.value = Math.abs(values[0] ?? 1)
  }

  return root
}

function computeLeafCounts(node: TreeNode): number {
  if (node.children.length === 0) {
    node.leafCount = 1
    return 1
  }
  let count = 0
  for (const child of node.children) {
    count += computeLeafCounts(child)
  }
  node.leafCount = count
  return count
}

function getMaxDepth(node: TreeNode): number {
  if (node.children.length === 0) return node.depth
  let max = node.depth
  for (const child of node.children) {
    max = Math.max(max, getMaxDepth(child))
  }
  return max
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

function layoutVertical(
  node: TreeNode, topY: number, leftX: number, rightX: number, levelHeight: number,
): void {
  node.y = topY + node.depth * levelHeight + levelHeight / 2
  const totalLeaves = node.leafCount || 1
  const slotWidth = (rightX - leftX) / totalLeaves

  if (node.children.length === 0) {
    node.x = leftX + slotWidth / 2
    return
  }

  let currentX = leftX
  for (const child of node.children) {
    const childWidth = (child.leafCount / totalLeaves) * (rightX - leftX)
    layoutVertical(child, topY, currentX, currentX + childWidth, levelHeight)
    currentX += childWidth
  }

  // Center parent above children
  const firstChild = node.children[0]!
  const lastChild = node.children[node.children.length - 1]!
  node.x = (firstChild.x + lastChild.x) / 2
}

function layoutHorizontal(
  node: TreeNode, leftX: number, topY: number, bottomY: number, levelWidth: number,
): void {
  node.x = leftX + node.depth * levelWidth + levelWidth / 2
  const totalLeaves = node.leafCount || 1
  const slotHeight = (bottomY - topY) / totalLeaves

  if (node.children.length === 0) {
    node.y = topY + slotHeight / 2
    return
  }

  let currentY = topY
  for (const child of node.children) {
    const childHeight = (child.leafCount / totalLeaves) * (bottomY - topY)
    layoutHorizontal(child, leftX, currentY, currentY + childHeight, levelWidth)
    currentY += childHeight
  }

  const firstChild = node.children[0]!
  const lastChild = node.children[node.children.length - 1]!
  node.y = (firstChild.y + lastChild.y) / 2
}

// ---------------------------------------------------------------------------
// Rendering edges
// ---------------------------------------------------------------------------

function renderEdges(
  node: TreeNode,
  nodes: RenderNode[],
  theme: RenderContext['theme'],
  isHorizontal: boolean,
): void {
  for (const child of node.children) {
    const pb = new PathBuilder()
    if (isHorizontal) {
      const midX = (node.x + child.x) / 2
      pb.moveTo(node.x, node.y)
      pb.curveTo(midX, node.y, midX, child.y, child.x, child.y)
    } else {
      const midY = (node.y + child.y) / 2
      pb.moveTo(node.x, node.y)
      pb.curveTo(node.x, midY, child.x, midY, child.x, child.y)
    }

    nodes.push(path(pb.build(), {
      class: 'chartts-tree-edge',
      stroke: theme.gridColor,
      strokeWidth: 1.5,
      fill: 'none',
    }))

    renderEdges(child, nodes, theme, isHorizontal)
  }
}
