import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareNoAxes } from '../../utils/prepare'
import { group, path, text } from '../../render/tree'
import { PathBuilder } from '../../render/tree'

/**
 * Polar / Radial bar chart (Nightingale rose diagram).
 *
 * Each category is a wedge whose radius is proportional to its value.
 * Uses the first series' values as wedge sizes.
 */
export const polarChartType: ChartTypePlugin = {
  type: 'polar',

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
    const outerR = Math.min(area.width, area.height) / 2 - 16
    const angleStep = (Math.PI * 2) / count
    const padAngle = 0.02 // radians gap between wedges

    // Draw concentric grid rings
    const ringCount = 3
    for (let r = 1; r <= ringCount; r++) {
      const ringR = (outerR * r) / ringCount
      const pb = new PathBuilder()
      // Full circle as a path
      pb.moveTo(cx + ringR, cy)
      pb.arc(ringR, ringR, 0, false, true, cx - ringR, cy)
      pb.arc(ringR, ringR, 0, false, true, cx + ringR, cy)

      nodes.push(path(pb.build(), {
        class: 'chartts-polar-grid',
        stroke: theme.gridColor,
        strokeWidth: theme.gridWidth,
        fill: 'none',
        opacity: 0.3,
      }))
    }

    // Draw wedges
    for (let i = 0; i < count; i++) {
      const value = Math.abs(values[i]!)
      const wedgeR = (value / maxVal) * outerR
      const startAngle = -Math.PI / 2 + i * angleStep + padAngle / 2
      const endAngle = -Math.PI / 2 + (i + 1) * angleStep - padAngle / 2

      if (endAngle <= startAngle || wedgeR < 1) continue

      const colorIndex = i % options.colors.length
      const color = options.colors[colorIndex]!

      const pb = new PathBuilder()
      const x1 = cx + wedgeR * Math.cos(startAngle)
      const y1 = cy + wedgeR * Math.sin(startAngle)
      const x2 = cx + wedgeR * Math.cos(endAngle)
      const y2 = cy + wedgeR * Math.sin(endAngle)
      const largeArc = angleStep - padAngle > Math.PI

      pb.moveTo(cx, cy)
      pb.lineTo(x1, y1)
      pb.arc(wedgeR, wedgeR, 0, largeArc, true, x2, y2)
      pb.close()

      const wedgeNodes: RenderNode[] = [
        path(pb.build(), {
          class: 'chartts-polar-wedge',
          fill: color,
          fillOpacity: 0.75,
          stroke: color,
          strokeWidth: 1,
          'data-series': 0,
          'data-index': i,
          tabindex: 0,
          role: 'img',
          ariaLabel: `${data.labels[i] ?? `Item ${i + 1}`}: ${values[i]}`,
        }),
      ]

      // Label at the outer edge
      const midAngle = (startAngle + endAngle) / 2
      const labelR = outerR + 10
      const lx = cx + labelR * Math.cos(midAngle)
      const ly = cy + labelR * Math.sin(midAngle)
      const anchor = Math.abs(Math.cos(midAngle)) < 0.01 ? 'middle' as const
        : Math.cos(midAngle) > 0 ? 'start' as const : 'end' as const

      wedgeNodes.push(text(lx, ly, String(data.labels[i] ?? ''), {
        class: 'chartts-polar-label',
        fill: theme.textMuted,
        textAnchor: anchor,
        dominantBaseline: 'central',
        fontSize: theme.fontSizeSmall,
        fontFamily: theme.fontFamily,
      }))

      nodes.push(group(wedgeNodes, {
        class: `chartts-series chartts-series-${i}`,
        'data-series-name': String(data.labels[i] ?? `Item ${i + 1}`),
      }))
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area } = ctx
    const series = data.series[0]
    if (!series || series.values.length === 0) return null

    const values = series.values
    const count = values.length
    let maxVal = 0
    for (const v of values) {
      if (Math.abs(v) > maxVal) maxVal = Math.abs(v)
    }
    if (maxVal === 0) return null

    const cx = area.x + area.width / 2
    const cy = area.y + area.height / 2
    const outerR = Math.min(area.width, area.height) / 2 - 16
    const angleStep = (Math.PI * 2) / count

    const dx = mx - cx
    const dy = my - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > outerR) return null

    let angle = Math.atan2(dy, dx)
    // Normalize to start from -PI/2
    if (angle < -Math.PI / 2) angle += Math.PI * 2

    const offset = angle + Math.PI / 2
    const normalizedAngle = offset < 0 ? offset + Math.PI * 2 : offset
    const idx = Math.floor(normalizedAngle / angleStep)

    if (idx >= 0 && idx < count) {
      const wedgeR = (Math.abs(values[idx]!) / maxVal) * outerR
      if (dist <= wedgeR) {
        return { seriesIndex: 0, pointIndex: idx, distance: dist }
      }
    }

    return null
  },
}
