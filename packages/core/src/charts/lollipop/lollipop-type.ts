import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareData } from '../../data/prepare'
import { group, line, circle } from '../../render/tree'
import { getBandwidth } from '../../utils/scale'

/**
 * Lollipop chart — stem line + circle at end.
 *
 * A modern, cleaner alternative to bar charts.
 * Vertical stems from baseline to value with a prominent circle dot.
 */
export const lollipopChartType: ChartTypePlugin = {
  type: 'lollipop',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    const prepared = prepareData(data, options)
    if (options.yMin === undefined && prepared.bounds.yMin > 0) {
      prepared.bounds.yMin = 0
    }
    return prepared
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, options, xScale, yScale } = ctx
    const nodes: RenderNode[] = []

    const seriesCount = data.series.length
    const pointCount = data.series[0]?.values.length ?? 0
    if (pointCount === 0) return nodes

    const bw = getBandwidth(xScale)
    const groupWidth = bw * 0.8
    const stemGap = groupWidth / seriesCount
    const dotR = Math.min(8, stemGap * 0.4)
    const baselineY = yScale.map(0)

    for (const series of data.series) {
      const seriesNodes: RenderNode[] = []

      for (let i = 0; i < series.values.length; i++) {
        const cx = xScale.map(i) + (series.index - (seriesCount - 1) / 2) * stemGap
        const vy = yScale.map(series.values[i]!)
        const color = options.colors[series.index % options.colors.length]!

        // Stem line — rounded cap, slightly thicker
        seriesNodes.push(line(cx, baselineY, cx, vy, {
          class: 'chartts-lollipop-stem',
          stroke: color,
          strokeWidth: 2.5,
          strokeLinecap: 'round',
          strokeOpacity: 0.6,
        }))

        // Ambient glow behind dot
        seriesNodes.push(circle(cx, vy, dotR * 2, {
          class: 'chartts-lollipop-glow',
          fill: color,
          fillOpacity: 0.12,
        }))

        // Dot — bigger, with theme-aware stroke
        seriesNodes.push(circle(cx, vy, dotR, {
          class: 'chartts-lollipop-dot',
          fill: color,
          stroke: `var(--chartts-bg, #fff)`,
          strokeWidth: 2.5,
          'data-series': series.index,
          'data-index': i,
          tabindex: 0,
          role: 'img',
          ariaLabel: `${series.name}: ${series.values[i]}`,
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
    const { data, xScale, yScale } = ctx
    const seriesCount = data.series.length
    const pointCount = data.series[0]?.values.length ?? 0
    if (pointCount === 0) return null

    const bw = getBandwidth(xScale)
    const groupWidth = bw * 0.8
    const stemGap = groupWidth / seriesCount

    let best: HitResult | null = null
    let bestDist = 20 // tolerance

    for (const series of data.series) {
      for (let i = 0; i < series.values.length; i++) {
        const cx = xScale.map(i) + (series.index - (seriesCount - 1) / 2) * stemGap
        const vy = yScale.map(series.values[i]!)
        const dx = mx - cx
        const dy = my - vy
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < bestDist) {
          bestDist = dist
          best = { seriesIndex: series.index, pointIndex: i, distance: dist, x: cx, y: vy }
        }
      }
    }

    return best
  },
}
