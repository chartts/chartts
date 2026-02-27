import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareNoAxes } from '../../utils/prepare'
import { group, path, text } from '../../render/tree'
import { PathBuilder } from '../../render/tree'

export interface FunnelOptions extends ResolvedOptions {
  /** Gap between steps in px. Default 2. */
  stepGap?: number
  /** Show percentage labels. Default true. */
  showLabels?: boolean
  /** Show value labels. Default true. */
  showValues?: boolean
}

/**
 * Funnel chart — tapered horizontal bars representing conversion steps.
 * Uses the first series. Values should be descending (largest to smallest).
 */
export const funnelChartType: ChartTypePlugin = {
  type: 'funnel',
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

    const fOpts = options as FunnelOptions
    const stepGap = fOpts.stepGap ?? 4
    const showLabels = fOpts.showLabels ?? true
    const showValues = fOpts.showValues ?? true

    const values = series.values
    const maxVal = Math.max(...values.map(Math.abs))
    if (maxVal === 0) return nodes

    const stepCount = values.length
    const totalGap = stepGap * (stepCount - 1)
    const stepHeight = (area.height - totalGap) / stepCount
    const centerX = area.x + area.width / 2

    for (let i = 0; i < stepCount; i++) {
      const val = Math.abs(values[i]!)
      const nextVal = i < stepCount - 1 ? Math.abs(values[i + 1]!) : val * 0.7

      const topWidth = (val / maxVal) * area.width
      const bottomWidth = (nextVal / maxVal) * area.width
      const y = area.y + i * (stepHeight + stepGap)

      const color = options.colors[i % options.colors.length]!

      // Trapezoid path
      const pb = new PathBuilder()
      pb.moveTo(centerX - topWidth / 2, y)
      pb.lineTo(centerX + topWidth / 2, y)
      pb.lineTo(centerX + bottomWidth / 2, y + stepHeight)
      pb.lineTo(centerX - bottomWidth / 2, y + stepHeight)
      pb.close()

      const stepNodes: RenderNode[] = []

      const colorIndex = i % options.colors.length
      stepNodes.push(path(pb.build(), {
        class: 'chartts-funnel-step',
        fill: `url(#chartts-bar-${colorIndex})`,
        stroke: color,
        strokeWidth: 0.5,
        'data-series': 0,
        'data-index': i,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${data.labels[i] ?? `Step ${i + 1}`}: ${values[i]}`,
      }))

      // Label text
      const textY = y + stepHeight / 2
      if (showLabels) {
        const label = String(data.labels[i] ?? `Step ${i + 1}`)
        const pct = maxVal > 0 ? Math.round((val / maxVal) * 100) : 0

        const labelStr = showValues
          ? `${label}: ${values[i]} (${pct}%)`
          : `${label} (${pct}%)`

        stepNodes.push(text(centerX, textY, labelStr, {
          class: 'chartts-funnel-label',
          fill: '#fff',
          textAnchor: 'middle',
          dominantBaseline: 'central',
          fontSize: theme.fontSize,
          fontFamily: theme.fontFamily,
          fontWeight: 600,
        }))
      }

      nodes.push(group(stepNodes, {
        class: `chartts-series chartts-series-${i}`,
        'data-series-name': String(data.labels[i] ?? `Step ${i + 1}`),
      }))
    }

    return nodes
  },

  hitTest(ctx: RenderContext, _mx: number, my: number): HitResult | null {
    const { data, area, options } = ctx
    const series = data.series[0]
    if (!series || series.values.length === 0) return null

    const fOpts = options as FunnelOptions
    const stepGap = fOpts.stepGap ?? 2
    const stepCount = series.values.length
    const totalGap = stepGap * (stepCount - 1)
    const stepHeight = (area.height - totalGap) / stepCount

    for (let i = 0; i < stepCount; i++) {
      const y = area.y + i * (stepHeight + stepGap)
      if (my >= y && my <= y + stepHeight) {
        return { seriesIndex: 0, pointIndex: i, distance: 0, x: area.x + area.width / 2, y: y + stepHeight / 2 }
      }
    }

    return null
  },
}
