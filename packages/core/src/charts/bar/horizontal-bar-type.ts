import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareData } from '../../data/prepare'
import { group, rect, path, text } from '../../render/tree'
import { formatNum } from '../../utils/format'
import { createHorizontalMapper } from '../../utils/scale'

/**
 * Horizontal bar chart — bars grow left-to-right.
 *
 * Uses the xScale for categories (mapped to y positions) and yScale for values
 * (mapped to x positions), but transposes the rendering.
 */
export const horizontalBarChartType: ChartTypePlugin = {
  type: 'horizontal-bar',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    const prepared = prepareData(data, {
      ...options,
      xAxis: false,
      yAxis: false,
      xGrid: false,
      yGrid: false,
      legend: false,
    })
    if (options.yMin === undefined && prepared.bounds.yMin > 0) {
      prepared.bounds.yMin = 0
    }
    if (options.yMax === undefined && prepared.bounds.yMax < 0) {
      prepared.bounds.yMax = 0
    }
    return prepared
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, options, yScale, theme } = ctx
    const nodes: RenderNode[] = []

    const seriesCount = data.series.length
    const pointCount = data.series[0]?.values.length ?? 0
    if (pointCount === 0) return nodes

    // Reserve space for category labels on the left
    const labelWidth = Math.min(70, area.width * 0.2)
    const chartX = area.x + labelWidth
    const chartW = area.width - labelWidth

    // In horizontal mode:
    // - Y axis becomes categories
    // - X axis becomes value axis (use yScale for values mapped to x positions)
    const categoryHeight = area.height / pointCount
    const barGap = options.barGap
    const groupHeight = categoryHeight * (1 - barGap)
    const barHeight = groupHeight / seriesCount
    const groupOffset = -groupHeight / 2

    const valueToX = createHorizontalMapper(yScale, area, chartX, chartW)
    const zeroX = valueToX(0)

    // Category labels on the left
    for (let i = 0; i < pointCount; i++) {
      const catCenter = area.y + categoryHeight * (i + 0.5)
      nodes.push(text(area.x + labelWidth - 6, catCenter, String(data.labels[i] ?? ''), {
        class: 'chartts-hbar-label',
        fill: theme.textMuted,
        textAnchor: 'end',
        dominantBaseline: 'central',
        fontSize: theme.fontSizeSmall,
        fontFamily: theme.fontFamily,
      }))
    }

    for (const series of data.series) {
      const barNodes: RenderNode[] = []

      for (let i = 0; i < series.values.length; i++) {
        const catCenter = area.y + categoryHeight * (i + 0.5)
        const barY = catCenter + groupOffset + series.index * barHeight
        const vx = valueToX(series.values[i]!)

        const x = Math.min(vx, zeroX)
        const w = Math.abs(vx - zeroX)
        const isPositive = series.values[i]! >= 0

        const barFill = `url(#chartts-bar-${series.index})`
        const r = Math.min(options.barRadius, barHeight / 2, w / 2)

        if (r > 0 && w > r * 2) {
          // Rounded right end for positive, left end for negative
          const d = isPositive
            ? `M${formatNum(x)},${formatNum(barY)}H${formatNum(x + w - r)}Q${formatNum(x + w)},${formatNum(barY)},${formatNum(x + w)},${formatNum(barY + r)}V${formatNum(barY + barHeight - r)}Q${formatNum(x + w)},${formatNum(barY + barHeight)},${formatNum(x + w - r)},${formatNum(barY + barHeight)}H${formatNum(x)}Z`
            : `M${formatNum(x + w)},${formatNum(barY)}H${formatNum(x + r)}Q${formatNum(x)},${formatNum(barY)},${formatNum(x)},${formatNum(barY + r)}V${formatNum(barY + barHeight - r)}Q${formatNum(x)},${formatNum(barY + barHeight)},${formatNum(x + r)},${formatNum(barY + barHeight)}H${formatNum(x + w)}Z`

          barNodes.push(path(d, {
            class: 'chartts-bar chartts-bar-horizontal',
            fill: barFill,
            'data-series': series.index,
            'data-index': i,
            tabindex: 0,
            role: 'img',
            ariaLabel: `${series.name}: ${series.values[i]}`,
          }))
        } else {
          barNodes.push(rect(x, barY, w, barHeight, {
            class: 'chartts-bar chartts-bar-horizontal',
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
    const { data, area, options, yScale } = ctx
    const seriesCount = data.series.length
    const pointCount = data.series[0]?.values.length ?? 0
    if (pointCount === 0) return null

    const labelWidth = Math.min(70, area.width * 0.2)
    const chartX = area.x + labelWidth
    const chartW = area.width - labelWidth
    const categoryHeight = area.height / pointCount
    const groupHeight = categoryHeight * (1 - options.barGap)
    const barHeight = groupHeight / seriesCount
    const groupOffset = -groupHeight / 2

    const valueToX = createHorizontalMapper(yScale, area, chartX, chartW)
    const zeroX = valueToX(0)

    for (const series of data.series) {
      for (let i = 0; i < series.values.length; i++) {
        const catCenter = area.y + categoryHeight * (i + 0.5)
        const barY = catCenter + groupOffset + series.index * barHeight
        const vx = valueToX(series.values[i]!)
        const x = Math.min(vx, zeroX)
        const w = Math.abs(vx - zeroX)

        if (mx >= x - 2 && mx <= x + w + 2 && my >= barY - 2 && my <= barY + barHeight + 2) {
          return { seriesIndex: series.index, pointIndex: i, distance: 0 }
        }
      }
    }

    return null
  },
}
