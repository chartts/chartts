import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareNoAxes } from '../../utils/prepare'
import { circle, text, group } from '../../render/tree'
import { PathBuilder } from '../../render/tree'
import { path } from '../../render/tree'

/**
 * Lines (flow lines) chart — curved connection lines between named points.
 *
 * Data convention:
 * - labels: point/city names
 * - series use arrow notation: "A → B" with values[0] = flow magnitude
 *
 * Options:
 * - points: array of {name, x, y} defining positions in 0..1 normalized space
 * - showNodes: show circles at point positions (default true)
 * - showArrows: show arrowheads (default true)
 * - showLabels: show point name labels (default true)
 * - curvature: bezier curve amount 0..1 (default 0.3)
 */

export interface LinesPoint {
  name: string
  x: number  // 0..1 normalized
  y: number  // 0..1 normalized
}

export interface LinesOptions {
  points?: LinesPoint[]
  showNodes?: boolean
  showArrows?: boolean
  showLabels?: boolean
  curvature?: number
}

interface ParsedFlow {
  source: string
  target: string
  value: number
}

export const linesChartType: ChartTypePlugin = {
  type: 'lines',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme, options } = ctx
    const nodes: RenderNode[] = []

    const lOpts = options as unknown as LinesOptions
    const showNodes = lOpts.showNodes !== false
    const showArrows = lOpts.showArrows !== false
    const showLabels = lOpts.showLabels !== false
    const curvature = lOpts.curvature ?? 0.3

    // Build point positions
    const pointMap = new Map<string, { x: number; y: number }>()

    if (lOpts.points) {
      for (const p of lOpts.points) {
        pointMap.set(p.name, {
          x: area.x + p.x * area.width,
          y: area.y + p.y * area.height,
        })
      }
    } else {
      // Auto-layout: arrange points in a circle
      const names = new Set<string>()
      for (const s of data.series) {
        const parts = s.name.split(/\s*(?:→|->)\s*/)
        if (parts.length >= 2) {
          names.add(parts[0]!.trim())
          names.add(parts[1]!.trim())
        }
      }
      // Also add labels
      for (const l of data.labels) names.add(String(l))

      const nameArr = [...names]
      const cx = area.x + area.width / 2
      const cy = area.y + area.height / 2
      const r = Math.min(area.width, area.height) / 2 - 40

      nameArr.forEach((name, i) => {
        const angle = (i / nameArr.length) * Math.PI * 2 - Math.PI / 2
        pointMap.set(name, {
          x: cx + r * Math.cos(angle),
          y: cy + r * Math.sin(angle),
        })
      })
    }

    // Parse flows from series
    const flows: ParsedFlow[] = []
    for (const s of data.series) {
      const parts = s.name.split(/\s*(?:→|->)\s*/)
      if (parts.length >= 2) {
        flows.push({
          source: parts[0]!.trim(),
          target: parts[1]!.trim(),
          value: s.values[0] ?? 1,
        })
      }
    }

    if (flows.length === 0 && pointMap.size === 0) return nodes

    // Max flow for line width scaling
    const maxFlow = Math.max(...flows.map(f => Math.abs(f.value)), 1)

    // Render flow lines
    for (let fi = 0; fi < flows.length; fi++) {
      const flow = flows[fi]!
      const src = pointMap.get(flow.source)
      const tgt = pointMap.get(flow.target)
      if (!src || !tgt) continue

      const color = options.colors[fi % options.colors.length]!
      const lineWidth = 1 + (Math.abs(flow.value) / maxFlow) * 4

      // Curved bezier
      const dx = tgt.x - src.x
      const dy = tgt.y - src.y
      const mx = (src.x + tgt.x) / 2
      const my = (src.y + tgt.y) / 2
      const cpx = mx - dy * curvature
      const cpy = my + dx * curvature

      const pb = new PathBuilder()
      pb.moveTo(src.x, src.y)
      pb.quadTo(cpx, cpy, tgt.x, tgt.y)

      nodes.push(path(pb.build(), {
        class: 'chartts-lines-flow',
        fill: 'none',
        stroke: color,
        strokeWidth: lineWidth,
        strokeOpacity: 0.6,
        strokeLinecap: 'round',
        'data-series': fi,
        'data-index': 0,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${flow.source} → ${flow.target}: ${flow.value}`,
      }))

      // Arrowhead at target
      if (showArrows) {
        const t = 0.95 // position along curve for arrow direction
        const ax = (1 - t) * (1 - t) * src.x + 2 * (1 - t) * t * cpx + t * t * tgt.x
        const ay = (1 - t) * (1 - t) * src.y + 2 * (1 - t) * t * cpy + t * t * tgt.y
        const angle = Math.atan2(tgt.y - ay, tgt.x - ax)
        const arrowSize = 6 + lineWidth

        const apb = new PathBuilder()
        apb.moveTo(tgt.x, tgt.y)
        apb.lineTo(
          tgt.x - arrowSize * Math.cos(angle - 0.4),
          tgt.y - arrowSize * Math.sin(angle - 0.4),
        )
        apb.lineTo(
          tgt.x - arrowSize * Math.cos(angle + 0.4),
          tgt.y - arrowSize * Math.sin(angle + 0.4),
        )
        apb.close()

        nodes.push(path(apb.build(), {
          class: 'chartts-lines-arrow',
          fill: color,
          fillOpacity: 0.8,
        }))
      }
    }

    // Render nodes
    if (showNodes) {
      const nodeNodes: RenderNode[] = []
      let idx = 0
      for (const [name, pos] of pointMap) {
        const color = options.colors[idx % options.colors.length]!

        nodeNodes.push(circle(pos.x, pos.y, 6, {
          class: 'chartts-lines-node',
          fill: color,
          stroke: theme.background === 'transparent' ? '#fff' : theme.background,
          strokeWidth: 2,
          'data-series': idx,
          'data-index': 0,
        }))

        if (showLabels) {
          nodeNodes.push(text(pos.x, pos.y - 14, name, {
            class: 'chartts-lines-label',
            fill: theme.textColor,
            textAnchor: 'middle',
            dominantBaseline: 'auto',
            fontSize: theme.fontSizeSmall,
            fontFamily: theme.fontFamily,
            fontWeight: 600,
          }))
        }
        idx++
      }
      nodes.push(group(nodeNodes, { class: 'chartts-lines-nodes' }))
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { options } = ctx
    const lOpts = options as unknown as LinesOptions
    const pointMap = new Map<string, { x: number; y: number }>()

    if (lOpts.points) {
      const { area } = ctx
      for (const p of lOpts.points) {
        pointMap.set(p.name, {
          x: area.x + p.x * area.width,
          y: area.y + p.y * area.height,
        })
      }
    }

    let idx = 0
    for (const [, pos] of pointMap) {
      const dx = mx - pos.x
      const dy = my - pos.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 12) {
        return { seriesIndex: idx, pointIndex: 0, distance: dist, x: pos.x, y: pos.y }
      }
      idx++
    }
    return null
  },
}
