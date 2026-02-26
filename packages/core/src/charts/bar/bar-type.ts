import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareData } from '../../data/prepare'
import { group, rect, path } from '../../render/tree'
import { formatNum } from '../../utils/format'
import { getBandwidth } from '../../utils/scale'

export const barChartType: ChartTypePlugin = {
  type: 'bar',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    const prepared = prepareData(data, options)

    // Bar charts should always include 0 in the y-axis range
    // unless the user explicitly set yMin/yMax
    if (options.yMin === undefined && prepared.bounds.yMin > 0) {
      prepared.bounds.yMin = 0
    }
    if (options.yMax === undefined && prepared.bounds.yMax < 0) {
      prepared.bounds.yMax = 0
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
    const groupWidth = bw * (1 - options.barGap)
    const barWidth = groupWidth / seriesCount
    const groupOffset = -groupWidth / 2

    const baseline = yScale.map(Math.max(0, yScale.getDomain()[0] as number))

    for (const series of data.series) {
      const barNodes: RenderNode[] = []

      for (let i = 0; i < series.values.length; i++) {
        const cx = xScale.map(i)
        const barX = cx + groupOffset + series.index * barWidth
        const vy = yScale.map(series.values[i]!)

        // Handle positive and negative values
        const y = series.values[i]! >= 0 ? vy : baseline
        const h = Math.abs(vy - baseline)

        const r = Math.min(options.barRadius, barWidth / 2, h / 2)
        const isPositive = series.values[i]! >= 0

        const barFill = `url(#chartts-bar-${series.index})`

        if (r > 0 && h > r * 2) {
          const d = isPositive
            ? `M${formatNum(barX)},${formatNum(y + h)}V${formatNum(y + r)}Q${formatNum(barX)},${formatNum(y)},${formatNum(barX + r)},${formatNum(y)}H${formatNum(barX + barWidth - r)}Q${formatNum(barX + barWidth)},${formatNum(y)},${formatNum(barX + barWidth)},${formatNum(y + r)}V${formatNum(y + h)}Z`
            : `M${formatNum(barX)},${formatNum(y)}V${formatNum(y + h - r)}Q${formatNum(barX)},${formatNum(y + h)},${formatNum(barX + r)},${formatNum(y + h)}H${formatNum(barX + barWidth - r)}Q${formatNum(barX + barWidth)},${formatNum(y + h)},${formatNum(barX + barWidth)},${formatNum(y + h - r)}V${formatNum(y)}Z`

          barNodes.push(path(d, {
            class: 'chartts-bar',
            fill: barFill,
            'data-series': series.index,
            'data-index': i,
            tabindex: 0,
            role: 'img',
            ariaLabel: `${series.name}: ${series.values[i]}`,
          }))
        } else {
          barNodes.push(rect(barX, y, barWidth, h, {
            class: 'chartts-bar',
            fill: barFill,
            'data-series': series.index,
            'data-index': i,
            tabindex: 0,
            role: 'img',
            ariaLabel: `${series.name}: ${series.values[i]}`,
          }))
        }
      }

      nodes.push(group(barNodes, {
        class: `chartts-series chartts-series-${series.index}`,
        'data-series-name': series.name,
      }))
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, xScale, yScale, options } = ctx
    const seriesCount = data.series.length
    const pointCount = data.series[0]?.values.length ?? 0
    if (pointCount === 0) return null

    const bw = getBandwidth(xScale)
    const groupWidth = bw * (1 - options.barGap)
    const barWidth = groupWidth / seriesCount
    const groupOffset = -groupWidth / 2
    const baseline = yScale.map(Math.max(0, yScale.getDomain()[0] as number))

    let best: HitResult | null = null
    let bestDist = Infinity

    for (const series of data.series) {
      for (let i = 0; i < series.values.length; i++) {
        const cx = xScale.map(i)
        const barX = cx + groupOffset + series.index * barWidth
        const vy = yScale.map(series.values[i]!)
        const y = series.values[i]! >= 0 ? vy : baseline
        const h = Math.abs(vy - baseline)

        // Check if mouse is inside bar bounds (with small padding)
        if (mx >= barX - 2 && mx <= barX + barWidth + 2 && my >= y - 2 && my <= y + h + 2) {
          const dist = 0
          if (dist < bestDist) {
            bestDist = dist
            best = { seriesIndex: series.index, pointIndex: i, distance: dist }
          }
        }
      }
    }

    return best
  },
}
