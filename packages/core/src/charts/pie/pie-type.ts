import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareNoAxes } from '../../utils/prepare'
import { group, path, text } from '../../render/tree'
import { PathBuilder } from '../../render/tree'

export interface PieOptions {
  /** Inner radius ratio (0 = pie, 0.5+ = donut). Default 0. */
  innerRadius?: number
  /** Padding angle in degrees between slices. Default 1. */
  padAngle?: number
  /** Show value labels on slices. Default true. */
  showLabels?: boolean
}

export const pieChartType: ChartTypePlugin = {
  type: 'pie',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme } = ctx
    const nodes: RenderNode[] = []

    // Pie uses the first series' values as slice sizes
    const series = data.series[0]
    if (!series || series.values.length === 0) return nodes

    const values = series.values
    const total = values.reduce((sum, v) => sum + Math.abs(v), 0)
    if (total === 0) return nodes

    const cx = area.x + area.width / 2
    const cy = area.y + area.height / 2
    const outerR = Math.min(area.width, area.height) / 2 - 2
    const innerRatio = (ctx.options as unknown as PieOptions).innerRadius ?? 0
    const innerR = outerR * Math.max(0, Math.min(0.9, innerRatio))
    const padAngleDeg = (ctx.options as unknown as PieOptions).padAngle ?? 1
    const padAngle = (padAngleDeg * Math.PI) / 180
    const showLabels = (ctx.options as unknown as PieOptions).showLabels ?? true

    let startAngle = -Math.PI / 2

    for (let i = 0; i < values.length; i++) {
      const value = Math.abs(values[i]!)
      const sliceAngle = (value / total) * Math.PI * 2
      const endAngle = startAngle + sliceAngle

      // Apply pad angle
      const actualStart = startAngle + padAngle / 2
      const actualEnd = endAngle - padAngle / 2

      if (actualEnd <= actualStart) {
        startAngle = endAngle
        continue
      }

      const color = data.series.length > 1
        ? data.series[i % data.series.length]!.color
        : ctx.options.colors[i % ctx.options.colors.length]!

      // Build slice path
      const pb = new PathBuilder()
      const x1o = cx + outerR * Math.cos(actualStart)
      const y1o = cy + outerR * Math.sin(actualStart)
      const x2o = cx + outerR * Math.cos(actualEnd)
      const y2o = cy + outerR * Math.sin(actualEnd)
      const largeArc = sliceAngle > Math.PI

      if (innerR > 0) {
        // Donut
        const x1i = cx + innerR * Math.cos(actualEnd)
        const y1i = cy + innerR * Math.sin(actualEnd)
        const x2i = cx + innerR * Math.cos(actualStart)
        const y2i = cy + innerR * Math.sin(actualStart)

        pb.moveTo(x1o, y1o)
        pb.arc(outerR, outerR, 0, largeArc, true, x2o, y2o)
        pb.lineTo(x1i, y1i)
        pb.arc(innerR, innerR, 0, largeArc, false, x2i, y2i)
        pb.close()
      } else {
        // Pie
        pb.moveTo(cx, cy)
        pb.lineTo(x1o, y1o)
        pb.arc(outerR, outerR, 0, largeArc, true, x2o, y2o)
        pb.close()
      }

      const colorIndex = i % ctx.options.colors.length
      const sliceNodes: RenderNode[] = [
        path(pb.build(), {
          class: 'chartts-slice',
          fill: `url(#chartts-pie-${colorIndex})`,
          stroke: color,
          strokeWidth: 1,
          'data-series': 0,
          'data-index': i,
          tabindex: 0,
          role: 'img',
          ariaLabel: `${data.labels[i] ?? `Slice ${i + 1}`}: ${values[i]}`,
        }),
      ]

      // Label
      if (showLabels && sliceAngle > 0.3) {
        const midAngle = (actualStart + actualEnd) / 2
        const labelR = innerR > 0 ? (outerR + innerR) / 2 : outerR * 0.65
        const lx = cx + labelR * Math.cos(midAngle)
        const ly = cy + labelR * Math.sin(midAngle)
        const pct = Math.round((value / total) * 100)

        sliceNodes.push(text(lx, ly, `${pct}%`, {
          class: 'chartts-slice-label',
          fill: '#fff',
          textAnchor: 'middle',
          dominantBaseline: 'central',
          fontSize: theme.fontSizeSmall,
          fontFamily: theme.fontFamily,
          fontWeight: 600,
        }))
      }

      nodes.push(group(sliceNodes, {
        class: `chartts-series chartts-series-${i}`,
        'data-series-name': String(data.labels[i] ?? `Slice ${i + 1}`),
      }))

      startAngle = endAngle
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area } = ctx
    const series = data.series[0]
    if (!series || series.values.length === 0) return null

    const cx = area.x + area.width / 2
    const cy = area.y + area.height / 2
    const outerR = Math.min(area.width, area.height) / 2 - 2
    const innerRatio = (ctx.options as unknown as PieOptions).innerRadius ?? 0
    const innerR = outerR * Math.max(0, Math.min(0.9, innerRatio))

    const dx = mx - cx
    const dy = my - cy
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > outerR || dist < innerR) return null

    let angle = Math.atan2(dy, dx)
    // Normalize to start from -PI/2
    if (angle < -Math.PI / 2) angle += Math.PI * 2

    const values = series.values
    const total = values.reduce((sum, v) => sum + Math.abs(v), 0)
    if (total === 0) return null

    let startAngle = -Math.PI / 2
    for (let i = 0; i < values.length; i++) {
      const sliceAngle = (Math.abs(values[i]!) / total) * Math.PI * 2
      const endAngle = startAngle + sliceAngle

      if (angle >= startAngle && angle < endAngle) {
        return { seriesIndex: 0, pointIndex: i, distance: 0 }
      }

      startAngle = endAngle
    }

    return null
  },
}

/** Donut chart = pie with innerRadius */
export const donutChartType: ChartTypePlugin = {
  ...pieChartType,
  type: 'donut',
  render(ctx: RenderContext): RenderNode[] {
    // Force innerRadius if not set
    const opts = ctx.options as unknown as PieOptions
    if (!opts.innerRadius) {
      (opts as PieOptions).innerRadius = 0.55
    }
    return pieChartType.render(ctx)
  },
}
