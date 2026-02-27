import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareNoAxes } from '../../utils/prepare'
import { group } from '../../render/tree'
import type { GraphNode, GraphEdge, GraphOptions, GraphLayout } from './types'
import { parseGraphData } from './parse'
import { measureNodeSize } from './text-measure'
import { renderNodeShape } from './shapes'
import { renderEdges } from './edges'
import { forceLayout } from './layout-force'
import { hierarchyLayout } from './layout-hierarchy'
import { circularLayout } from './layout-circular'

/**
 * Graph / Network chart — rich node-link diagram.
 *
 * Supports:
 * - 5 node shapes (rect, circle, diamond, hexagon, stadium)
 * - 3 layouts (force, hierarchical, circular)
 * - Edge arrows, labels, and dash styles
 * - Pin support (data-driven + interactive via enableGraphDrag)
 * - 3 data formats: rich, arrow-notation, adjacency matrix
 */
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
    const graphOpts = options as unknown as GraphOptions
    const result: RenderNode[] = []

    // 1. Parse data into nodes + edges
    const { graphNodes, graphEdges } = parseGraphData(data, options)
    if (graphNodes.length === 0) return result

    // 2. Measure text for each node to compute width/height
    for (const node of graphNodes) {
      const size = measureNodeSize(node.label, theme.fontSizeSmall, node.shape)
      node.width = size.width
      node.height = size.height
    }

    // 3. Layout
    runLayout(graphNodes, graphEdges, graphOpts, area)

    // 4. Render edges first (behind nodes)
    const edgeNodes = renderEdges(graphNodes, graphEdges, graphOpts, theme)
    if (edgeNodes.length > 0) {
      result.push(group(edgeNodes, { class: 'chartts-graph-edges' }))
    }

    // 5. Render node shapes
    for (const node of graphNodes) {
      const color = node.color ?? options.colors[node.index % options.colors.length]!
      const shapeNodes = renderNodeShape(node, color, theme)

      result.push(group(shapeNodes, {
        class: `chartts-series chartts-series-${node.index}`,
        'data-series-name': node.label,
      }))
    }

    return result
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area, theme, options } = ctx
    const graphOpts = options as unknown as GraphOptions

    const { graphNodes, graphEdges } = parseGraphData(data, options)
    if (graphNodes.length === 0) return null

    // Measure + layout (same as render)
    for (const node of graphNodes) {
      const size = measureNodeSize(node.label, theme.fontSizeSmall, node.shape)
      node.width = size.width
      node.height = size.height
    }
    runLayout(graphNodes, graphEdges, graphOpts, area)

    // Shape-aware hit testing
    let best: HitResult | null = null
    let bestDist = Infinity

    for (const node of graphNodes) {
      const dist = shapeDistance(node, mx, my)
      if (dist < bestDist && dist < 8) {
        bestDist = dist
        best = { seriesIndex: node.index, pointIndex: 0, distance: dist, x: node.x, y: node.y }
      }
    }

    return best
  },
}

// ---------------------------------------------------------------------------
// Layout dispatcher
// ---------------------------------------------------------------------------

function runLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  opts: GraphOptions,
  area: { x: number; y: number; width: number; height: number },
): void {
  const layout: GraphLayout = opts.layout ?? 'force'

  switch (layout) {
    case 'hierarchical':
      hierarchyLayout(nodes, edges, {
        area,
        direction: opts.direction ?? 'TB',
      })
      break

    case 'circular':
      circularLayout(nodes, edges, { area })
      break

    case 'force':
    default:
      forceLayout(nodes, edges, {
        area,
        iterations: opts.iterations ?? 120,
      })
      break
  }
}

// ---------------------------------------------------------------------------
// Shape-aware distance (0 = inside shape, >0 = outside)
// ---------------------------------------------------------------------------

function shapeDistance(node: GraphNode, mx: number, my: number): number {
  const dx = mx - node.x
  const dy = my - node.y
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)

  switch (node.shape) {
    case 'circle': {
      const r = Math.max(node.width, node.height) / 2
      const dist = Math.sqrt(dx * dx + dy * dy)
      return Math.max(0, dist - r)
    }

    case 'diamond': {
      const hw = node.width / 2
      const hh = node.height / 2
      // Diamond implicit: |x|/hw + |y|/hh <= 1
      const d = absDx / hw + absDy / hh
      return d <= 1 ? 0 : Math.sqrt(dx * dx + dy * dy) * (d - 1)
    }

    case 'hexagon': {
      const rx = node.width / 2
      const ry = node.height / 2
      // Simplified: check if inside bounding ellipse
      const d = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry)
      return d <= 1 ? 0 : Math.sqrt(dx * dx + dy * dy) * (Math.sqrt(d) - 1)
    }

    // rect, stadium
    default: {
      const hw = node.width / 2
      const hh = node.height / 2
      const ox = Math.max(0, absDx - hw)
      const oy = Math.max(0, absDy - hh)
      return Math.sqrt(ox * ox + oy * oy)
    }
  }
}
