import type {
  ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult,
} from '../../types'
import { defineChartType } from '../../api/define'
import { prepareData } from '../../data/prepare'
import { group, rect, path } from '../../render/tree'
import { formatNum } from '../../utils/format'
import { getBandwidth } from '../../utils/scale'

/**
 * Stacked bar chart — all series at the same x position are stacked vertically.
 */
export const stackedBarChartType = defineChartType({
  type: 'stacked-bar',
  useBandScale: true,


  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    const prepared = prepareData(data, options)

    // y-axis range should cover cumulative totals per x-index
    const pointCount = prepared.series[0]?.values.length ?? 0
    let maxTotal = 0
    let minTotal = 0

    for (let i = 0; i < pointCount; i++) {
      let posSum = 0
      let negSum = 0
      for (const s of prepared.series) {
        const v = s.values[i] ?? 0
        if (v >= 0) posSum += v
        else negSum += v
      }
      if (posSum > maxTotal) maxTotal = posSum
      if (negSum < minTotal) minTotal = negSum
    }

    if (options.yMin === undefined) prepared.bounds.yMin = Math.min(0, minTotal)
    if (options.yMax === undefined) prepared.bounds.yMax = Math.max(0, maxTotal)

    return prepared
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, options, xScale, yScale } = ctx
    const nodes: RenderNode[] = []

    const pointCount = data.series[0]?.values.length ?? 0
    if (pointCount === 0) return nodes

    const bw = getBandwidth(xScale)
    const barWidth = bw * (1 - options.barGap)
    const barOffset = -barWidth / 2
    const baseline = yScale.map(0)

    for (let i = 0; i < pointCount; i++) {
      let posY = baseline  // tracks current top of positive stack
      let negY = baseline  // tracks current bottom of negative stack

      for (const series of data.series) {
        const value = series.values[i] ?? 0
        if (value === 0) continue

        const cx = xScale.map(i)
        const barX = cx + barOffset
        const vy = yScale.map(Math.abs(value))
        const h = Math.abs(vy - baseline)

        let y: number
        if (value >= 0) {
          y = posY - h
          posY = y
        } else {
          y = negY
          negY = y + h
        }

        const barFill = `url(#chartts-bar-${series.index})`
        const r = Math.min(options.barRadius, barWidth / 2, h / 2)

        const barNode = (r > 0 && h > r * 2)
          ? path(
              `M${formatNum(barX)},${formatNum(y + h)}V${formatNum(y + r)}Q${formatNum(barX)},${formatNum(y)},${formatNum(barX + r)},${formatNum(y)}H${formatNum(barX + barWidth - r)}Q${formatNum(barX + barWidth)},${formatNum(y)},${formatNum(barX + barWidth)},${formatNum(y + r)}V${formatNum(y + h)}Z`,
              {
                class: 'chartts-bar',
                fill: barFill,
                'data-series': series.index,
                'data-index': i,
                tabindex: 0,
                role: 'img',
                ariaLabel: `${series.name}: ${value}`,
              },
            )
          : rect(barX, y, barWidth, h, {
              class: 'chartts-bar',
              fill: barFill,
              'data-series': series.index,
              'data-index': i,
              tabindex: 0,
              role: 'img',
              ariaLabel: `${series.name}: ${value}`,
            })

        // Wrap each series segment in its own group for hover isolation
        nodes.push(group([barNode], {
          class: `chartts-series chartts-series-${series.index}`,
          'data-series-name': series.name,
        }))
      }
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, xScale, yScale, options } = ctx
    const pointCount = data.series[0]?.values.length ?? 0
    if (pointCount === 0) return null

    const bw = getBandwidth(xScale)
    const barWidth = bw * (1 - options.barGap)
    const barOffset = -barWidth / 2
    const baseline = yScale.map(0)

    for (let i = 0; i < pointCount; i++) {
      const cx = xScale.map(i)
      const barX = cx + barOffset

      if (mx < barX - 2 || mx > barX + barWidth + 2) continue

      let posY = baseline
      let negY = baseline

      for (const series of data.series) {
        const value = series.values[i] ?? 0
        if (value === 0) continue

        const vy = yScale.map(Math.abs(value))
        const h = Math.abs(vy - baseline)
        let y: number
        if (value >= 0) { y = posY - h; posY = y }
        else { y = negY; negY = y + h }

        if (my >= y - 2 && my <= y + h + 2) {
          return { seriesIndex: series.index, pointIndex: i, distance: 0, x: cx, y }
        }
      }
    }

    return null
  },
})
