import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareNoAxes } from '../../utils/prepare'
import { path, text, line } from '../../render/tree'
import { PathBuilder } from '../../render/tree'

/**
 * Parallel coordinates chart — multi-dimensional data on parallel vertical axes.
 *
 * Data convention:
 * - labels: axis names (dimensions), one per axis
 * - series[i]: one data record. series[i].values[j] = value for dimension j
 *
 * Each series becomes a polyline crossing all axes.
 */

export const parallelChartType: ChartTypePlugin = {
  type: 'parallel',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme, options } = ctx
    const nodes: RenderNode[] = []

    const dimCount = data.labels.length
    if (dimCount < 2 || data.series.length === 0) return nodes

    const padding = 24
    const axisSpacing = (area.width - padding * 2) / Math.max(dimCount - 1, 1)
    const axisTop = area.y + padding
    const axisBottom = area.y + area.height - padding

    // Compute min/max per dimension
    const mins: number[] = new Array(dimCount).fill(Infinity)
    const maxs: number[] = new Array(dimCount).fill(-Infinity)
    for (const series of data.series) {
      for (let d = 0; d < dimCount; d++) {
        const v = series.values[d] ?? 0
        if (v < mins[d]!) mins[d] = v
        if (v > maxs[d]!) maxs[d] = v
      }
    }

    // Ensure min !== max
    for (let d = 0; d < dimCount; d++) {
      if (mins[d] === maxs[d]) {
        mins[d] = mins[d]! - 1
        maxs[d] = maxs[d]! + 1
      }
    }

    const axisX = (dim: number) => area.x + padding + dim * axisSpacing
    const valueToY = (dim: number, value: number) => {
      const frac = (value - mins[dim]!) / (maxs[dim]! - mins[dim]!)
      return axisBottom - frac * (axisBottom - axisTop) // invert: higher values = higher on axis
    }

    // Draw axes
    for (let d = 0; d < dimCount; d++) {
      const x = axisX(d)

      // Axis line
      nodes.push(line(x, axisTop, x, axisBottom, {
        class: 'chartts-parallel-axis',
        stroke: theme.axisColor,
        strokeWidth: theme.axisWidth,
      }))

      // Axis label at bottom
      nodes.push(text(x, axisBottom + 14, String(data.labels[d]!), {
        class: 'chartts-parallel-label',
        fill: theme.textMuted,
        textAnchor: 'middle',
        dominantBaseline: 'auto',
        fontSize: theme.fontSizeSmall,
        fontFamily: theme.fontFamily,
      }))

      // Min/max ticks
      nodes.push(text(x - 6, axisTop, String(Math.round(maxs[d]!)), {
        class: 'chartts-parallel-tick',
        fill: theme.textMuted,
        textAnchor: 'end',
        dominantBaseline: 'central',
        fontSize: theme.fontSizeSmall * 0.85,
        fontFamily: theme.fontFamily,
      }))
      nodes.push(text(x - 6, axisBottom, String(Math.round(mins[d]!)), {
        class: 'chartts-parallel-tick',
        fill: theme.textMuted,
        textAnchor: 'end',
        dominantBaseline: 'central',
        fontSize: theme.fontSizeSmall * 0.85,
        fontFamily: theme.fontFamily,
      }))
    }

    // Draw series lines
    for (let si = 0; si < data.series.length; si++) {
      const series = data.series[si]!
      const color = series.color ?? options.colors[si % options.colors.length]!

      const pb = new PathBuilder()
      for (let d = 0; d < dimCount; d++) {
        const x = axisX(d)
        const y = valueToY(d, series.values[d] ?? 0)
        if (d === 0) pb.moveTo(x, y)
        else pb.lineTo(x, y)
      }

      nodes.push(path(pb.build(), {
        class: 'chartts-parallel-line',
        stroke: color,
        strokeWidth: theme.lineWidth,
        fill: 'none',
        fillOpacity: 0,
        opacity: Math.max(0.3, 1 - data.series.length * 0.03),
        'data-series': si,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${series.name}: ${series.values.join(', ')}`,
      }))
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area } = ctx
    const dimCount = data.labels.length
    if (dimCount < 2 || data.series.length === 0) return null

    const padding = 24
    const axisSpacing = (area.width - padding * 2) / Math.max(dimCount - 1, 1)
    const axisTop = area.y + padding
    const axisBottom = area.y + area.height - padding

    const mins: number[] = new Array(dimCount).fill(Infinity)
    const maxs: number[] = new Array(dimCount).fill(-Infinity)
    for (const series of data.series) {
      for (let d = 0; d < dimCount; d++) {
        const v = series.values[d] ?? 0
        if (v < mins[d]!) mins[d] = v
        if (v > maxs[d]!) maxs[d] = v
      }
    }
    for (let d = 0; d < dimCount; d++) {
      if (mins[d] === maxs[d]) { mins[d] = mins[d]! - 1; maxs[d] = maxs[d]! + 1 }
    }

    const axisX = (dim: number) => area.x + padding + dim * axisSpacing
    const valueToY = (dim: number, value: number) => {
      const frac = (value - mins[dim]!) / (maxs[dim]! - mins[dim]!)
      return axisBottom - frac * (axisBottom - axisTop)
    }

    // Find closest series line
    let best: HitResult | null = null
    let bestDist = 20 // max hit distance

    for (let si = 0; si < data.series.length; si++) {
      const series = data.series[si]!
      for (let d = 0; d < dimCount; d++) {
        const x = axisX(d)
        const y = valueToY(d, series.values[d] ?? 0)
        const dist = Math.sqrt((mx - x) ** 2 + (my - y) ** 2)
        if (dist < bestDist) {
          bestDist = dist
          best = { seriesIndex: si, pointIndex: d, distance: dist }
        }
      }
    }

    return best
  },
}
