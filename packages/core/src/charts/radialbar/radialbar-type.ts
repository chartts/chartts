import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareNoAxes } from '../../utils/prepare'
import { group, path, text } from '../../render/tree'
import { PathBuilder } from '../../render/tree'

/**
 * Radial bar chart — concentric arcs radiating from center.
 *
 * Each category gets its own ring. Arc length is proportional to value.
 * Uses the first series' values.
 */
export const radialBarChartType: ChartTypePlugin = {
  type: 'radial-bar',
  suppressAxes: true,

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

    const values = series.values
    const count = values.length
    let maxVal = 0
    for (const v of values) {
      if (Math.abs(v) > maxVal) maxVal = Math.abs(v)
    }
    if (maxVal === 0) maxVal = 1

    const cx = area.x + area.width / 2
    const cy = area.y + area.height / 2
    const outerR = Math.min(area.width, area.height) / 2 - 20
    const innerR = outerR * 0.2
    const ringGap = 3
    const ringWidth = (outerR - innerR - ringGap * (count - 1)) / count
    const startAngle = -Math.PI / 2 // 12 o'clock

    for (let i = 0; i < count; i++) {
      const value = Math.abs(values[i]!)
      const fraction = value / maxVal
      const sweepAngle = fraction * Math.PI * 2 * 0.95 // max 95% of circle
      const endAngle = startAngle + sweepAngle

      const rOuter = innerR + (count - i) * (ringWidth + ringGap) - ringGap
      const rInner = rOuter - ringWidth

      const colorIndex = i % options.colors.length
      const color = options.colors[colorIndex]!
      const label = String(data.labels[i] ?? `Item ${i + 1}`)

      // Track arc (full background ring) — rounded caps
      const trackPb = new PathBuilder()
      const trackEnd = startAngle + Math.PI * 2 * 0.95
      strokeArc(trackPb, cx, cy, (rOuter + rInner) / 2, startAngle, trackEnd)
      nodes.push(path(trackPb.build(), {
        class: 'chartts-radialbar-track',
        stroke: theme.gridColor,
        strokeWidth: ringWidth,
        strokeLinecap: 'round',
        fill: 'none',
        opacity: 0.15,
      }))

      // Value arc — rounded caps for polished look
      if (sweepAngle > 0.01) {
        const arcPb = new PathBuilder()
        strokeArc(arcPb, cx, cy, (rOuter + rInner) / 2, startAngle, endAngle)

        const arcNodes: RenderNode[] = [
          path(arcPb.build(), {
            class: 'chartts-radialbar-arc',
            stroke: color,
            strokeWidth: ringWidth,
            strokeLinecap: 'round',
            fill: 'none',
            opacity: 0.85,
            'data-series': 0,
            'data-index': i,
            tabindex: 0,
            role: 'img',
            ariaLabel: `${label}: ${values[i]}`,
          }),
        ]

        // Label on the left side of the ring
        const ringMidR = (rOuter + rInner) / 2
        arcNodes.push(text(cx - outerR - 6, cy - ringMidR + cy - cy, label, {
          class: 'chartts-radialbar-label',
          fill: theme.textMuted,
          textAnchor: 'end',
          dominantBaseline: 'central',
          fontSize: Math.min(theme.fontSizeSmall, ringWidth * 0.9),
          fontFamily: theme.fontFamily,
        }))

        nodes.push(group(arcNodes, {
          class: `chartts-series chartts-series-${i}`,
          'data-series-name': label,
        }))
      }
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area } = ctx
    const series = data.series[0]
    if (!series || series.values.length === 0) return null

    const count = series.values.length
    const cx = area.x + area.width / 2
    const cy = area.y + area.height / 2
    const outerR = Math.min(area.width, area.height) / 2 - 20
    const innerR = outerR * 0.2
    const ringGap = 3
    const ringWidth = (outerR - innerR - ringGap * (count - 1)) / count

    const dx = mx - cx
    const dy = my - cy
    const dist = Math.sqrt(dx * dx + dy * dy)

    for (let i = 0; i < count; i++) {
      const rOuter = innerR + (count - i) * (ringWidth + ringGap) - ringGap
      const rInner = rOuter - ringWidth

      if (dist >= rInner && dist <= rOuter) {
        const midR = (rInner + rOuter) / 2
        const hitAngle = Math.atan2(dy, dx)
        return { seriesIndex: 0, pointIndex: i, distance: 0, x: cx + midR * Math.cos(hitAngle), y: cy + midR * Math.sin(hitAngle) }
      }
    }

    return null
  },
}

function strokeArc(pb: PathBuilder, cx: number, cy: number, r: number, startAngle: number, endAngle: number): void {
  const x1 = cx + r * Math.cos(startAngle)
  const y1 = cy + r * Math.sin(startAngle)
  const x2 = cx + r * Math.cos(endAngle)
  const y2 = cy + r * Math.sin(endAngle)
  const largeArc = (endAngle - startAngle) > Math.PI

  pb.moveTo(x1, y1)
  pb.arc(r, r, 0, largeArc, true, x2, y2)
}
