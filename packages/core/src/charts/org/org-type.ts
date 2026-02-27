import type {
  ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult,
} from '../../types'
import { defineChartType } from '../../api/define'
import { prepareNoAxes } from '../../utils/prepare'
import { group, rect, path, text } from '../../render/tree'
import { PathBuilder } from '../../render/tree'

/**
 * Org chart — hierarchical organization diagram with rectangular cards.
 *
 * Data convention (same as Tree):
 * - labels: node names with "/" separators for hierarchy (e.g., "CEO/CTO/VP Eng")
 * - series[0].values: node sizing (optional, all 1 by default)
 *
 * Difference from Tree: uses rounded rectangles with text inside (org cards)
 * instead of circles with labels beside them.
 */

interface OrgNode {
  name: string
  value: number
  children: OrgNode[]
  depth: number
  index: number
  x: number
  y: number
  leafCount: number
}

export const orgChartType = defineChartType({
  type: 'org',
  suppressAxes: true,

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme, options } = ctx
    const nodes: RenderNode[] = []

    const series = data.series[0]
    if (!series || series.values.length === 0) return nodes

    const root = buildOrgTree(data.labels, series.values)
    if (!root) return nodes

    computeLeafCounts(root)
    const maxDepth = getMaxDepth(root)

    // Card dimensions
    const cardW = Math.min(area.width / (root.leafCount + 1) * 0.85, 120)
    const cardH = Math.min(area.height / (maxDepth + 2) * 0.5, 36)

    // Layout top-down
    const levelHeight = area.height / Math.max(maxDepth + 1, 1)
    layoutVertical(root, area.y, area.x, area.x + area.width, levelHeight)

    // Render edges first
    const edgeNodes: RenderNode[] = []
    renderEdges(root, edgeNodes, theme, cardH)
    nodes.push(...edgeNodes)

    // Render cards
    let nodeIdx = 0
    const renderOrgNode = (node: OrgNode) => {
      const color = options.colors[node.depth % options.colors.length]!
      const cardNodes: RenderNode[] = []

      // Rounded rectangle card
      cardNodes.push(rect(node.x - cardW / 2, node.y - cardH / 2, cardW, cardH, {
        rx: 6, ry: 6,
        class: 'chartts-org-card',
        fill: color,
        stroke: theme.background === 'transparent' ? '#fff' : theme.background,
        strokeWidth: 1.5,
        'data-series': 0,
        'data-index': nodeIdx,
        tabindex: 0,
        role: 'img',
        ariaLabel: node.name,
      }))

      // Name label inside card
      const fontSize = Math.min(theme.fontSizeSmall, cardH * 0.38)
      const maxChars = Math.floor(cardW / (fontSize * 0.58))
      const displayName = node.name.length > maxChars
        ? node.name.slice(0, maxChars - 1) + '\u2026'
        : node.name

      cardNodes.push(text(node.x, node.y, displayName, {
        class: 'chartts-org-label',
        fill: '#fff',
        textAnchor: 'middle',
        dominantBaseline: 'central',
        fontSize,
        fontFamily: theme.fontFamily,
        fontWeight: 600,
      }))

      nodes.push(group(cardNodes, {
        class: `chartts-series chartts-series-${nodeIdx}`,
        'data-series-name': node.name,
      }))

      nodeIdx++
      for (const child of node.children) {
        renderOrgNode(child)
      }
    }

    renderOrgNode(root)

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area } = ctx
    const series = data.series[0]
    if (!series || series.values.length === 0) return null

    const root = buildOrgTree(data.labels, series.values)
    if (!root) return null

    computeLeafCounts(root)
    const maxDepth = getMaxDepth(root)

    const cardW = Math.min(area.width / (root.leafCount + 1) * 0.85, 120)
    const cardH = Math.min(area.height / (maxDepth + 2) * 0.5, 36)
    const levelHeight = area.height / Math.max(maxDepth + 1, 1)
    layoutVertical(root, area.y, area.x, area.x + area.width, levelHeight)

    let best: HitResult | null = null
    let idx = 0

    const checkNode = (node: OrgNode) => {
      if (
        mx >= node.x - cardW / 2 - 2 && mx <= node.x + cardW / 2 + 2 &&
        my >= node.y - cardH / 2 - 2 && my <= node.y + cardH / 2 + 2
      ) {
        best = { seriesIndex: 0, pointIndex: idx, distance: 0, x: node.x, y: node.y }
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
// Tree building (reused from Tree chart pattern)
// ---------------------------------------------------------------------------

function buildOrgTree(labels: (string | number | Date)[], values: number[]): OrgNode | null {
  const root: OrgNode = {
    name: 'Root', value: 0, children: [], depth: 0, index: 0,
    x: 0, y: 0, leafCount: 0,
  }

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
    root.name = String(labels[0] ?? 'Root')
    root.value = Math.abs(values[0] ?? 1)
  }

  return root
}

function computeLeafCounts(node: OrgNode): number {
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

function getMaxDepth(node: OrgNode): number {
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
  node: OrgNode, topY: number, leftX: number, rightX: number, levelHeight: number,
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

  const firstChild = node.children[0]!
  const lastChild = node.children[node.children.length - 1]!
  node.x = (firstChild.x + lastChild.x) / 2
}

// ---------------------------------------------------------------------------
// Rendering edges with curved connectors
// ---------------------------------------------------------------------------

function renderEdges(
  node: OrgNode,
  nodes: RenderNode[],
  theme: RenderContext['theme'],
  cardH: number,
): void {
  for (const child of node.children) {
    const pb = new PathBuilder()
    const startY = node.y + cardH / 2
    const endY = child.y - cardH / 2
    const midY = (startY + endY) / 2

    pb.moveTo(node.x, startY)
    pb.curveTo(node.x, midY, child.x, midY, child.x, endY)

    nodes.push(path(pb.build(), {
      class: 'chartts-org-edge',
      stroke: theme.gridColor,
      strokeWidth: 1.5,
      fill: 'none',
    }))

    renderEdges(child, nodes, theme, cardH)
  }
}
