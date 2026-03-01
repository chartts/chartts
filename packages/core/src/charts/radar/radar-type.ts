import type {
  ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult,
} from '../../types'
import { defineChartType } from '../../api/define'
import { prepareNoAxes } from '../../utils/prepare'
import { group, path, circle, text } from '../../render/tree'
import { PathBuilder } from '../../render/tree'

/**
 * Radar / Spider chart — plots multi-dimensional data on radial axes.
 * Each category becomes an axis radiating from center.
 */
export const radarChartType = defineChartType({
  type: 'radar',
  suppressAxes: true,


  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme } = ctx
    const nodes: RenderNode[] = []

    const labelCount = data.labels.length
    if (labelCount < 3) return nodes

    const cx = area.x + area.width / 2
    const cy = area.y + area.height / 2
    const radius = Math.min(area.width, area.height) / 2 - 24

    // Find the max value across all series for scaling
    let maxVal = 0
    for (const series of data.series) {
      for (const v of series.values) {
        if (Math.abs(v) > maxVal) maxVal = Math.abs(v)
      }
    }
    if (maxVal === 0) maxVal = 1

    const angleStep = (Math.PI * 2) / labelCount
    const startAngle = -Math.PI / 2 // start from top

    // Draw grid rings (3 levels)
    const gridLevels = 3
    for (let level = 1; level <= gridLevels; level++) {
      const r = (radius * level) / gridLevels
      const pb = new PathBuilder()
      for (let i = 0; i <= labelCount; i++) {
        const angle = startAngle + (i % labelCount) * angleStep
        const x = cx + r * Math.cos(angle)
        const y = cy + r * Math.sin(angle)
        if (i === 0) pb.moveTo(x, y)
        else pb.lineTo(x, y)
      }
      nodes.push(path(pb.build(), {
        class: 'chartts-radar-grid',
        stroke: theme.gridColor,
        strokeWidth: theme.gridWidth,
        fillOpacity: 0,
        fill: 'none',
      }))
    }

    // Draw axis lines from center to each vertex
    for (let i = 0; i < labelCount; i++) {
      const angle = startAngle + i * angleStep
      const x = cx + radius * Math.cos(angle)
      const y = cy + radius * Math.sin(angle)

      nodes.push({
        type: 'line',
        x1: cx,
        y1: cy,
        x2: x,
        y2: y,
        attrs: {
          class: 'chartts-radar-axis',
          stroke: theme.gridColor,
          strokeWidth: theme.gridWidth,
        },
      })

      // Label at vertex
      const labelR = radius + 14
      const lx = cx + labelR * Math.cos(angle)
      const ly = cy + labelR * Math.sin(angle)
      const anchor = Math.abs(Math.cos(angle)) < 0.01 ? 'middle' as const
        : Math.cos(angle) > 0 ? 'start' as const : 'end' as const

      nodes.push(text(lx, ly, String(data.labels[i]!), {
        class: 'chartts-radar-label',
        fill: theme.textMuted,
        textAnchor: anchor,
        dominantBaseline: 'central',
        fontSize: theme.fontSizeSmall,
        fontFamily: theme.fontFamily,
      }))
    }

    // Draw series polygons
    for (const series of data.series) {
      const pb = new PathBuilder()
      const points: { x: number; y: number }[] = []

      for (let i = 0; i < labelCount; i++) {
        const val = series.values[i] ?? 0
        const r = (Math.abs(val) / maxVal) * radius
        const angle = startAngle + i * angleStep
        const x = cx + r * Math.cos(angle)
        const y = cy + r * Math.sin(angle)
        points.push({ x, y })

        if (i === 0) pb.moveTo(x, y)
        else pb.lineTo(x, y)
      }
      pb.close()

      const seriesNodes: RenderNode[] = []

      // Fill
      seriesNodes.push(path(pb.build(), {
        class: 'chartts-radar-area',
        fill: series.color,
        fillOpacity: 0.2,
        stroke: series.color,
        strokeWidth: theme.lineWidth,
        'data-series': series.index,
      }))

      // Points
      for (let i = 0; i < points.length; i++) {
        seriesNodes.push(circle(points[i]!.x, points[i]!.y, theme.pointRadius, {
          class: 'chartts-radar-point',
          fill: series.color,
          'data-series': series.index,
          'data-index': i,
          tabindex: 0,
          role: 'img',
          ariaLabel: `${series.name} ${data.labels[i]}: ${series.values[i]}`,
        }))
      }

      nodes.push(group(seriesNodes, {
        class: `chartts-series chartts-series-${series.index}`,
        'data-series-name': series.name,
      }))
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area } = ctx
    const labelCount = data.labels.length
    if (labelCount < 3) return null

    const cx = area.x + area.width / 2
    const cy = area.y + area.height / 2
    const radius = Math.min(area.width, area.height) / 2 - 24
    const angleStep = (Math.PI * 2) / labelCount
    const startAngle = -Math.PI / 2

    let maxVal = 0
    for (const series of data.series) {
      for (const v of series.values) {
        if (Math.abs(v) > maxVal) maxVal = Math.abs(v)
      }
    }
    if (maxVal === 0) return null

    let best: HitResult | null = null
    let bestDist = Infinity
    const hitRadius = 15

    for (const series of data.series) {
      for (let i = 0; i < labelCount; i++) {
        const val = series.values[i] ?? 0
        const r = (Math.abs(val) / maxVal) * radius
        const angle = startAngle + i * angleStep
        const px = cx + r * Math.cos(angle)
        const py = cy + r * Math.sin(angle)
        const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2)
        if (dist < bestDist && dist < hitRadius) {
          bestDist = dist
          best = { seriesIndex: series.index, pointIndex: i, distance: dist, x: px, y: py }
        }
      }
    }

    return best
  },
})
