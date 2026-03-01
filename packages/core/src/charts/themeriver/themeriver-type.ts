import type {
  ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult,
} from '../../types'
import { defineChartType } from '../../api/define'
import { prepareNoAxes } from '../../utils/prepare'
import { path, text } from '../../render/tree'
import { PathBuilder } from '../../render/tree'

/**
 * ThemeRiver / StreamGraph chart — stacked area chart with a center baseline.
 *
 * Data convention:
 * - labels: time points (x-axis categories)
 * - series[i]: a stream layer. values[j] = thickness at time j
 *
 * The streams are stacked symmetrically around the horizontal center,
 * creating an organic river-like visualization.
 */

export const themeRiverChartType = defineChartType({
  type: 'themeriver',
  suppressAxes: true,


  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme, options } = ctx
    const nodes: RenderNode[] = []

    const timeCount = data.labels.length
    if (timeCount < 2 || data.series.length === 0) return nodes

    const seriesCount = data.series.length

    // Compute stacked values
    const stacks: number[][] = []
    for (let t = 0; t < timeCount; t++) {
      const column: number[] = []
      for (let si = 0; si < seriesCount; si++) {
        column.push(Math.abs(data.series[si]!.values[t] ?? 0))
      }
      stacks.push(column)
    }

    // Compute baseline offsets (wiggle / silhouette centering)
    const baselines: number[] = []
    for (let t = 0; t < timeCount; t++) {
      const total = stacks[t]!.reduce((s, v) => s + v, 0)
      baselines.push(-total / 2) // Center around 0
    }

    // Find global min/max for y-scale
    let yMin = Infinity
    let yMax = -Infinity
    for (let t = 0; t < timeCount; t++) {
      let cumulative = baselines[t]!
      if (cumulative < yMin) yMin = cumulative
      for (let si = 0; si < seriesCount; si++) {
        cumulative += stacks[t]![si]!
      }
      if (cumulative > yMax) yMax = cumulative
    }
    if (yMin === yMax) { yMin -= 1; yMax += 1 }

    const xStep = area.width / Math.max(timeCount - 1, 1)
    const mapX = (t: number) => area.x + t * xStep
    const mapY = (val: number) => {
      const frac = (val - yMin) / (yMax - yMin)
      return area.y + area.height - frac * area.height
    }

    // Render each series as a stream band
    for (let si = 0; si < seriesCount; si++) {
      const series = data.series[si]!
      const color = series.color ?? options.colors[si % options.colors.length]!

      // Compute top and bottom edges for this series
      const tops: { x: number; y: number }[] = []
      const bottoms: { x: number; y: number }[] = []

      for (let t = 0; t < timeCount; t++) {
        let cumBottom = baselines[t]!
        for (let s = 0; s < si; s++) {
          cumBottom += stacks[t]![s]!
        }
        const cumTop = cumBottom + stacks[t]![si]!

        tops.push({ x: mapX(t), y: mapY(cumTop) })
        bottoms.push({ x: mapX(t), y: mapY(cumBottom) })
      }

      // Build smooth path: top edge forward, bottom edge backward
      const pb = new PathBuilder()

      // Top edge (left to right)
      pb.moveTo(tops[0]!.x, tops[0]!.y)
      for (let t = 1; t < timeCount; t++) {
        const prev = tops[t - 1]!
        const curr = tops[t]!
        const cpx = (prev.x + curr.x) / 2
        pb.curveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y)
      }

      // Bottom edge (right to left)
      pb.lineTo(bottoms[timeCount - 1]!.x, bottoms[timeCount - 1]!.y)
      for (let t = timeCount - 2; t >= 0; t--) {
        const prev = bottoms[t + 1]!
        const curr = bottoms[t]!
        const cpx = (prev.x + curr.x) / 2
        pb.curveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y)
      }

      pb.close()

      nodes.push(path(pb.build(), {
        class: 'chartts-themeriver-stream',
        fill: color,
        fillOpacity: 0.75,
        stroke: color,
        strokeWidth: 0.5,
        'data-series': si,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${series.name}`,
      }))

      // Label at the widest point
      let maxWidth = 0
      let maxT = 0
      for (let t = 0; t < timeCount; t++) {
        const width = Math.abs(tops[t]!.y - bottoms[t]!.y)
        if (width > maxWidth) {
          maxWidth = width
          maxT = t
        }
      }

      if (maxWidth > 16) {
        const midY = (tops[maxT]!.y + bottoms[maxT]!.y) / 2
        const fontSize = Math.min(theme.fontSizeSmall, maxWidth * 0.4)
        nodes.push(text(tops[maxT]!.x, midY, series.name, {
          class: 'chartts-themeriver-label',
          fill: '#fff',
          textAnchor: 'middle',
          dominantBaseline: 'central',
          fontSize,
          fontFamily: theme.fontFamily,
          fontWeight: 600,
        }))
      }
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area } = ctx
    const timeCount = data.labels.length
    if (timeCount < 2 || data.series.length === 0) return null

    const seriesCount = data.series.length
    const xStep = area.width / Math.max(timeCount - 1, 1)

    // Find closest time index
    const t = Math.round((mx - area.x) / xStep)
    if (t < 0 || t >= timeCount) return null

    // Compute stacks at this time
    const column: number[] = []
    for (let si = 0; si < seriesCount; si++) {
      column.push(Math.abs(data.series[si]!.values[t] ?? 0))
    }
    const total = column.reduce((s, v) => s + v, 0)
    const baseline = -total / 2

    // Find global scale
    let yMin = Infinity
    let yMax = -Infinity
    for (let tt = 0; tt < timeCount; tt++) {
      let cum = 0
      for (let si = 0; si < seriesCount; si++) {
        cum += Math.abs(data.series[si]!.values[tt] ?? 0)
      }
      const bl = -cum / 2
      if (bl < yMin) yMin = bl
      if (bl + cum > yMax) yMax = bl + cum
    }
    if (yMin === yMax) { yMin -= 1; yMax += 1 }

    const mapY = (val: number) => {
      const frac = (val - yMin) / (yMax - yMin)
      return area.y + area.height - frac * area.height
    }

    // Check which stream the y coordinate falls in
    let cumBottom = baseline
    for (let si = 0; si < seriesCount; si++) {
      const cumTop = cumBottom + column[si]!
      const topY = mapY(cumTop)
      const bottomY = mapY(cumBottom)

      if (my >= topY && my <= bottomY) {
        return { seriesIndex: si, pointIndex: t, distance: 0, x: area.x + t * xStep, y: mapY((cumBottom + cumTop) / 2) }
      }
      cumBottom = cumTop
    }

    return null
  },
})
