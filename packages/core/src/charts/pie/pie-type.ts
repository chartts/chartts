import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareNoAxes } from '../../utils/prepare'
import { group, path, text } from '../../render/tree'
import { roundedSlicePath } from '../../utils/slice-path'

export interface PieOptions extends ResolvedOptions {
  /** Inner radius ratio (0 = pie, 0.5+ = donut). Default 0.08 (small center gap). */
  innerRadius?: number
  /** Uniform pixel gap between slices. Default 4. */
  gap?: number
  /** Corner radius in px for rounded slice edges. Default 6. */
  cornerRadius?: number
  /** Show value labels on slices. Default true. */
  showLabels?: boolean
}

// ---------------------------------------------------------------------------
// Pie chart type
// ---------------------------------------------------------------------------

export const pieChartType: ChartTypePlugin = {
  type: 'pie',
  suppressAxes: true,

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme } = ctx
    const nodes: RenderNode[] = []

    const series = data.series[0]
    if (!series || series.values.length === 0) return nodes

    const values = series.values
    const total = values.reduce((sum, v) => sum + Math.abs(v), 0)
    if (total === 0) return nodes

    const cx = area.x + area.width / 2
    const cy = area.y + area.height / 2
    const outerR = Math.min(area.width, area.height) / 2 - 2
    const opts = ctx.options as PieOptions
    const innerRatio = opts.innerRadius ?? 0.08
    const innerR = outerR * Math.max(0, Math.min(0.9, innerRatio))
    const gapPx = opts.gap ?? 4
    const halfGap = gapPx / 2
    const cornerRadius = opts.cornerRadius ?? 6
    const showLabels = opts.showLabels ?? true

    // Angular gap offsets per radius.
    // At the outer edge, uniform pixel gap is straightforward.
    // At the inner edge, clamp the pad angle so it never eats more than 15%
    // of the smallest slice — otherwise the inner path self-intersects.
    // When innerR is tiny, use the same angle as outer (gap tapers to center).
    const outerPadAngle = halfGap / outerR
    const rawInnerPad = innerR > 0 ? halfGap / innerR : 0
    const innerPadAngle = Math.min(rawInnerPad, outerPadAngle * 3)

    let startAngle = -Math.PI / 2

    for (let i = 0; i < values.length; i++) {
      const value = Math.abs(values[i]!)
      const sliceAngle = (value / total) * Math.PI * 2
      const endAngle = startAngle + sliceAngle

      // Check if slice is too small to render with gap
      if (sliceAngle < outerPadAngle * 2 + 0.01) {
        startAngle = endAngle
        continue
      }

      // Per-slice clamp: inner pad must not exceed 15% of the slice angle
      const sliceInnerPad = Math.min(innerPadAngle, sliceAngle * 0.15)

      const d = roundedSlicePath(
        cx, cy, outerR, innerR,
        startAngle + outerPadAngle, endAngle - outerPadAngle,
        startAngle + sliceInnerPad, endAngle - sliceInnerPad,
        cornerRadius,
      )

      const colorIndex = i % ctx.options.colors.length
      const sliceNodes: RenderNode[] = [
        path(d, {
          class: 'chartts-slice',
          fill: `url(#chartts-pie-${colorIndex})`,
          'data-series': 0,
          'data-index': i,
          tabindex: 0,
          role: 'img',
          ariaLabel: `${data.labels[i] ?? `Slice ${i + 1}`}: ${values[i]}`,
        }),
      ]

      // Label
      if (showLabels && sliceAngle > 0.3) {
        const midAngle = (startAngle + endAngle) / 2
        const labelR = (outerR + innerR) / 2
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

  getHighlightNodes(ctx: RenderContext, hit: HitResult): RenderNode[] {
    const { data, area } = ctx
    const series = data.series[0]
    if (!series || series.values.length === 0) return []

    const values = series.values
    const total = values.reduce((sum, v) => sum + Math.abs(v), 0)
    if (total === 0) return []

    const cx = area.x + area.width / 2
    const cy = area.y + area.height / 2
    const outerR = Math.min(area.width, area.height) / 2 - 2
    const opts = ctx.options as PieOptions
    const innerRatio = opts.innerRadius ?? 0.08
    const innerR = outerR * Math.max(0, Math.min(0.9, innerRatio))

    // Find the hit slice angles
    let startAngle = -Math.PI / 2
    for (let i = 0; i < values.length; i++) {
      const sliceAngle = (Math.abs(values[i]!) / total) * Math.PI * 2
      const endAngle = startAngle + sliceAngle
      if (i === hit.pointIndex) {
        // Draw a bright outline around this slice
        const d = roundedSlicePath(cx, cy, outerR + 3, innerR - 2, startAngle, endAngle, startAngle, endAngle, 0)
        return [
          path(d, {
            class: 'chartts-highlight-slice',
            fill: 'none',
            stroke: series.color,
            strokeWidth: 2,
            strokeOpacity: 0.8,
          }),
        ]
      }
      startAngle = endAngle
    }
    return []
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area } = ctx
    const series = data.series[0]
    if (!series || series.values.length === 0) return null

    const cx = area.x + area.width / 2
    const cy = area.y + area.height / 2
    const outerR = Math.min(area.width, area.height) / 2 - 2
    const innerRatio = (ctx.options as PieOptions).innerRadius ?? 0.08
    const innerR = outerR * Math.max(0, Math.min(0.9, innerRatio))

    const dx = mx - cx
    const dy = my - cy
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > outerR || dist < innerR) return null

    let angle = Math.atan2(dy, dx)
    if (angle < -Math.PI / 2) angle += Math.PI * 2

    const values = series.values
    const total = values.reduce((sum, v) => sum + Math.abs(v), 0)
    if (total === 0) return null

    let startAngle = -Math.PI / 2
    for (let i = 0; i < values.length; i++) {
      const sliceAngle = (Math.abs(values[i]!) / total) * Math.PI * 2
      const endAngle = startAngle + sliceAngle

      if (angle >= startAngle && angle < endAngle) {
        const midAngle = (startAngle + endAngle) / 2
        const midR = (innerR + outerR) / 2
        return { seriesIndex: 0, pointIndex: i, distance: 0, x: cx + midR * Math.cos(midAngle), y: cy + midR * Math.sin(midAngle) }
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
  suppressAxes: true,
  render(ctx: RenderContext): RenderNode[] {
    const opts = ctx.options as PieOptions
    if (!opts.innerRadius || opts.innerRadius < 0.3) {
      // Create new context to avoid mutating shared options
      const donutCtx = {
        ...ctx,
        options: { ...ctx.options, innerRadius: 0.55 } as typeof ctx.options,
      }
      return pieChartType.render(donutCtx)
    }
    return pieChartType.render(ctx)
  },
}
