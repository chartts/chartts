import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareNoAxes } from '../../utils/prepare'
import { path, text } from '../../render/tree'
import { roundedSlicePath } from '../../utils/slice-path'

/**
 * Sunburst chart — hierarchical radial visualization.
 *
 * Data convention:
 * - labels: leaf node names
 * - series[0].values: leaf values (sizes)
 * - Hierarchy is encoded via label separators: "A/B/C" means root→A→B→C
 *   If no separators, falls back to flat ring layout (single ring).
 *
 * The chart draws concentric rings from center outward, one ring per depth level.
 */

interface SunburstNode {
  name: string
  fullPath: string
  value: number
  children: SunburstNode[]
  depth: number
  startAngle: number
  endAngle: number
  // Computed during layout
  totalValue: number
}

export const sunburstChartType: ChartTypePlugin = {
  type: 'sunburst',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme, options } = ctx
    const nodes: RenderNode[] = []

    const series = data.series[0]
    if (!series || series.values.length === 0) return nodes

    // Build tree from labels
    const root = buildTree(data.labels, series.values)
    if (root.totalValue === 0) return nodes

    const cx = area.x + area.width / 2
    const cy = area.y + area.height / 2
    const maxRadius = Math.min(area.width, area.height) / 2 - 4
    const innerRadius = maxRadius * 0.15

    // Compute max depth for ring sizing
    const maxDepth = getMaxDepth(root)
    const ringWidth = (maxRadius - innerRadius) / Math.max(maxDepth, 1)

    // Layout angles recursively
    layoutAngles(root, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2)

    // Render all non-root nodes
    let colorIdx = 0
    const renderNode = (node: SunburstNode, parentColorIdx: number) => {
      if (node.depth === 0) {
        // Root — render children with cycling colors
        for (let i = 0; i < node.children.length; i++) {
          renderNode(node.children[i]!, i)
        }
        return
      }

      const ci = node.depth === 1 ? parentColorIdx : parentColorIdx
      const color = options.colors[ci % options.colors.length]!
      const r0 = innerRadius + (node.depth - 1) * ringWidth
      const r1 = r0 + ringWidth - 1 // 1px gap between rings

      const sliceAngle = node.endAngle - node.startAngle
      if (sliceAngle < 0.005) return // Skip tiny slices

      // Uniform pixel gap: different angular offsets at different radii
      const gapPx = 3
      const halfGap = gapPx / 2
      const outerPadAngle = halfGap / r1
      const innerPadAngle = r0 > 0 ? halfGap / r0 : 0

      if (sliceAngle < outerPadAngle * 2 + 0.005) return

      const cr = Math.min(4, ringWidth * 0.2)

      const d = roundedSlicePath(
        cx, cy, r1, r0,
        node.startAngle + outerPadAngle, node.endAngle - outerPadAngle,
        node.startAngle + innerPadAngle, node.endAngle - innerPadAngle,
        cr,
      )

      const opacity = 1 - (node.depth - 1) * 0.15

      nodes.push(path(d, {
        class: 'chartts-sunburst-sector',
        fill: color,
        fillOpacity: Math.max(0.4, opacity),
        'data-series': 0,
        'data-index': colorIdx,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${node.name}: ${node.totalValue}`,
      }))

      // Label for larger sectors
      if (sliceAngle > 0.3 && ringWidth > 20) {
        const midAngle = (node.startAngle + node.endAngle) / 2
        const labelR = (r0 + r1) / 2
        const lx = cx + labelR * Math.cos(midAngle)
        const ly = cy + labelR * Math.sin(midAngle)

        const fontSize = Math.min(theme.fontSizeSmall, ringWidth * 0.35)
        nodes.push(text(lx, ly, node.name, {
          class: 'chartts-sunburst-label',
          fill: '#fff',
          textAnchor: 'middle',
          dominantBaseline: 'central',
          fontSize,
          fontFamily: theme.fontFamily,
          fontWeight: 600,
        }))
      }

      colorIdx++

      // Render children
      for (let i = 0; i < node.children.length; i++) {
        renderNode(node.children[i]!, parentColorIdx)
      }
    }

    renderNode(root, 0)

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area } = ctx
    const series = data.series[0]
    if (!series || series.values.length === 0) return null

    const cx = area.x + area.width / 2
    const cy = area.y + area.height / 2
    const maxRadius = Math.min(area.width, area.height) / 2 - 4
    const innerRadius = maxRadius * 0.15

    const dx = mx - cx
    const dy = my - cy
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > maxRadius || dist < innerRadius) return null

    const root = buildTree(data.labels, series.values)
    const maxDepth = getMaxDepth(root)
    const ringWidth = (maxRadius - innerRadius) / Math.max(maxDepth, 1)

    layoutAngles(root, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2)

    let angle = Math.atan2(dy, dx)
    if (angle < -Math.PI / 2) angle += Math.PI * 2

    // Find which ring (depth) the point is in
    const depthFloat = (dist - innerRadius) / ringWidth
    const depth = Math.floor(depthFloat) + 1

    // Find sector at this depth and angle
    const hit = findSector(root, depth, angle)
    if (hit) {
      return { seriesIndex: 0, pointIndex: hit, distance: 0, x: mx, y: my }
    }

    return null
  },
}

// ---------------------------------------------------------------------------
// Tree building
// ---------------------------------------------------------------------------

function buildTree(labels: (string | number | Date)[], values: number[]): SunburstNode {
  const root: SunburstNode = {
    name: 'root', fullPath: '', value: 0,
    children: [], depth: 0, startAngle: 0, endAngle: 0, totalValue: 0,
  }

  for (let i = 0; i < labels.length; i++) {
    const label = String(labels[i] ?? `Item ${i}`)
    const value = Math.abs(values[i] ?? 0)
    if (value <= 0) continue

    const parts = label.includes('/') ? label.split('/') : [label]
    let current = root

    for (let p = 0; p < parts.length; p++) {
      const part = parts[p]!.trim()
      let child = current.children.find(c => c.name === part)

      if (!child) {
        child = {
          name: part,
          fullPath: parts.slice(0, p + 1).join('/'),
          value: 0,
          children: [],
          depth: p + 1,
          startAngle: 0,
          endAngle: 0,
          totalValue: 0,
        }
        current.children.push(child)
      }

      if (p === parts.length - 1) {
        child.value = value
      }
      current = child
    }
  }

  // Compute totals bottom-up
  computeTotals(root)

  return root
}

function computeTotals(node: SunburstNode): number {
  if (node.children.length === 0) {
    node.totalValue = node.value
    return node.totalValue
  }
  let sum = 0
  for (const child of node.children) {
    sum += computeTotals(child)
  }
  node.totalValue = Math.max(sum, node.value)
  return node.totalValue
}

function layoutAngles(node: SunburstNode, start: number, end: number): void {
  node.startAngle = start
  node.endAngle = end

  if (node.children.length === 0 || node.totalValue === 0) return

  let current = start
  for (const child of node.children) {
    const fraction = child.totalValue / node.totalValue
    const childEnd = current + fraction * (end - start)
    layoutAngles(child, current, childEnd)
    current = childEnd
  }
}

function getMaxDepth(node: SunburstNode): number {
  if (node.children.length === 0) return node.depth
  let max = node.depth
  for (const child of node.children) {
    max = Math.max(max, getMaxDepth(child))
  }
  return max
}

function findSector(node: SunburstNode, targetDepth: number, angle: number): number | null {
  if (node.depth === targetDepth) {
    if (angle >= node.startAngle && angle < node.endAngle) {
      return node.depth // Return something non-null to indicate a hit
    }
    return null
  }

  for (const child of node.children) {
    if (angle >= child.startAngle && angle < child.endAngle) {
      const result = findSector(child, targetDepth, angle)
      if (result !== null) return result
    }
  }

  return null
}
