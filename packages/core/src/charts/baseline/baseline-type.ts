import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { CSS_PREFIX } from '../../constants'
import { prepareData } from '../../data/prepare'
import { group, path, circle, line } from '../../render/tree'
import { PathBuilder } from '../../render/tree'

export interface BaselineOptions extends ResolvedOptions {
  /** Reference value for positive/negative split. Default 0. */
  baseline?: number
  /** Color for values above baseline. Default green. */
  positiveColor?: string
  /** Color for values below baseline. Default red. */
  negativeColor?: string
  /** Fill opacity for shaded areas. Default 0.15. */
  fillOpacity?: number
  /** Show the baseline reference line. Default true. */
  showBaseline?: boolean
  /** Show data points. Default true. */
  showPoints?: boolean
}

/**
 * Baseline chart — line with positive/negative shading.
 *
 * Values above the baseline are shaded green, below shaded red.
 * Used for: performance vs benchmark, P&L, temperature anomalies.
 */
export const baselineChartType: ChartTypePlugin = {
  type: 'baseline',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    const opts = options as BaselineOptions
    const bv = opts.baseline ?? 0
    const prepared = prepareData(data, options)
    // Ensure baseline value is visible in the scale
    if (bv < prepared.bounds.yMin) prepared.bounds.yMin = bv
    if (bv > prepared.bounds.yMax) prepared.bounds.yMax = bv
    return prepared
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, xScale, yScale, area, options, theme } = ctx
    const nodes: RenderNode[] = []

    const opts = options as BaselineOptions
    const bv = opts.baseline ?? 0
    const posColor = opts.positiveColor ?? 'var(--color-emerald-500, #10b981)'
    const negColor = opts.negativeColor ?? 'var(--color-red-500, #ef4444)'
    const fillOp = opts.fillOpacity ?? 0.15
    const showBaseline = opts.showBaseline ?? true
    const showPoints = opts.showPoints ?? true

    const baseY = yScale.map(bv)

    for (const series of data.series) {
      const seriesNodes: RenderNode[] = []
      const values = series.values
      if (values.length === 0) continue

      // Filter out NaN for path building — only use valid data points
      const validPoints: { x: number; y: number; idx: number; val: number }[] = []
      for (let i = 0; i < values.length; i++) {
        if (!isNaN(values[i]!)) {
          validPoints.push({ x: xScale.map(i), y: yScale.map(values[i]!), idx: i, val: values[i]! })
        }
      }
      const points = validPoints.map(p => ({ x: p.x, y: p.y }))

      // Positive fill (above baseline, clipped at baseline)
      const posFill = buildClippedArea(points, baseY, 'above')
      if (posFill) {
        seriesNodes.push(path(posFill, {
          class: 'chartts-baseline-pos',
          fill: posColor,
          fillOpacity: fillOp,
          'data-series': series.index,
        }))
      }

      // Negative fill (below baseline, clipped at baseline)
      const negFill = buildClippedArea(points, baseY, 'below')
      if (negFill) {
        seriesNodes.push(path(negFill, {
          class: 'chartts-baseline-neg',
          fill: negColor,
          fillOpacity: fillOp,
          'data-series': series.index,
        }))
      }

      // Main line (using valid points only)
      const linePath = new PathBuilder()
      if (points.length > 0) {
        linePath.moveTo(points[0]!.x, points[0]!.y)
        for (let i = 1; i < points.length; i++) {
          linePath.lineTo(points[i]!.x, points[i]!.y)
        }
      }
      seriesNodes.push(path(linePath.build(), {
        class: 'chartts-baseline-line',
        stroke: series.color,
        strokeWidth: theme.lineWidth,
        'data-series': series.index,
      }))

      // Data points (only for valid points)
      if (showPoints) {
        for (const vp of validPoints) {
          const color = vp.val >= bv ? posColor : negColor
          seriesNodes.push(circle(vp.x, vp.y, theme.pointRadius, {
            class: 'chartts-point',
            fill: color,
            stroke: `var(${CSS_PREFIX}-bg, #fff)`,
            strokeWidth: 2,
            'data-series': series.index,
            'data-index': vp.idx,
            tabindex: 0,
            role: 'img',
            ariaLabel: `${series.name}: ${vp.val} (${vp.val >= bv ? '+' : ''}${(vp.val - bv).toFixed(1)})`,
          }))
        }
      }

      nodes.push(group(seriesNodes, {
        class: `chartts-series chartts-series-${series.index}`,
        'data-series-name': series.name,
      }))
    }

    // Baseline reference line
    if (showBaseline) {
      nodes.push(line(area.x, baseY, area.x + area.width, baseY, {
        class: 'chartts-baseline-ref',
        stroke: theme.textMuted,
        strokeWidth: 1,
        strokeDasharray: '6,4',
        opacity: 0.5,
      }))
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, xScale, yScale } = ctx
    let best: HitResult | null = null
    let bestDist = Infinity

    for (const series of data.series) {
      for (let i = 0; i < series.values.length; i++) {
        if (isNaN(series.values[i]!)) continue
        const x = xScale.map(i)
        const y = yScale.map(series.values[i]!)
        const dist = Math.sqrt((mx - x) ** 2 + (my - y) ** 2)
        if (dist < bestDist) {
          bestDist = dist
          best = { seriesIndex: series.index, pointIndex: i, distance: dist, x, y }
        }
      }
    }

    return best && best.distance < 30 ? best : null
  },
}

/**
 * Build a filled area path clipped to one side of the baseline.
 * Interpolates intersection points where the line crosses the baseline.
 */
function buildClippedArea(
  points: { x: number; y: number }[],
  baseY: number,
  side: 'above' | 'below',
): string | null {
  if (points.length < 2) return null

  // Collect segments that are on the desired side
  const segments: { x: number; y: number }[][] = []
  let current: { x: number; y: number }[] = []

  for (let i = 0; i < points.length; i++) {
    const p = points[i]!
    const onSide = side === 'above' ? p.y <= baseY : p.y >= baseY

    if (i > 0) {
      const prev = points[i - 1]!
      const prevOnSide = side === 'above' ? prev.y <= baseY : prev.y >= baseY

      // Crossing detected — compute intersection
      if (onSide !== prevOnSide) {
        const t = (baseY - prev.y) / (p.y - prev.y)
        const ix = prev.x + t * (p.x - prev.x)
        const cross = { x: ix, y: baseY }

        if (prevOnSide) {
          // Was on side, now leaving — close current segment
          current.push(cross)
          if (current.length >= 2) segments.push(current)
          current = []
        } else {
          // Was off side, now entering — start new segment
          current = [cross]
        }
      }
    }

    if (onSide) current.push(p)
  }
  if (current.length >= 2) segments.push(current)
  if (segments.length === 0) return null

  // Build SVG path for all segments
  const pb = new PathBuilder()
  for (const seg of segments) {
    pb.moveTo(seg[0]!.x, seg[0]!.y)
    for (let i = 1; i < seg.length; i++) {
      pb.lineTo(seg[i]!.x, seg[i]!.y)
    }
    // Close down/up to baseline
    pb.lineTo(seg[seg.length - 1]!.x, baseY)
    pb.lineTo(seg[0]!.x, baseY)
    pb.close()
  }

  return pb.build()
}
