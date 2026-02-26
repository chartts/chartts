import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { CSS_PREFIX } from '../../constants'
import { prepareData } from '../../data/prepare'
import { group, path, circle } from '../../render/tree'
import { PathBuilder } from '../../render/tree'
import { formatNum } from '../../utils/format'

export const lineChartType: ChartTypePlugin = {
  type: 'line',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareData(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, options, area, xScale, yScale, theme } = ctx
    const nodes: RenderNode[] = []

    for (const series of data.series) {
      const seriesNodes: RenderNode[] = []

      // Build line path
      const linePath = buildLinePath(series.values, xScale, yScale, options.curve)

      // Area fill (if enabled) — use gradient for premium look
      if (series.fill) {
        const areaPath = buildAreaPath(
          series.values, xScale, yScale, area, options.curve,
        )
        seriesNodes.push(path(areaPath, {
          class: 'chartts-area',
          fill: `url(#chartts-area-${series.index})`,
          'data-series': series.index,
        }))
      }

      // Line glow (soft blur behind the main line)
      const dash = series.style === 'dashed' ? '6,4'
        : series.style === 'dotted' ? '2,3' : undefined

      if (!dash) {
        seriesNodes.push(path(linePath, {
          class: 'chartts-line-glow',
          stroke: series.color,
          strokeWidth: theme.lineWidth + 4,
          opacity: 0.2,
          'data-series': series.index,
          style: 'filter:blur(4px)',
        }))
      }

      // Main line
      seriesNodes.push(path(linePath, {
        class: 'chartts-line',
        stroke: series.color,
        strokeWidth: theme.lineWidth,
        strokeDasharray: dash,
        'data-series': series.index,
      }))

      // Data points with ambient glow
      if (series.showPoints) {
        for (let i = 0; i < series.values.length; i++) {
          if (isNaN(series.values[i]!)) continue // skip missing data
          const x = xScale.map(i)
          const y = yScale.map(series.values[i]!)

          // Ambient glow behind point
          seriesNodes.push(circle(x, y, theme.pointRadius * 3, {
            class: 'chartts-point-glow',
            fill: `url(#chartts-pglow-${series.index})`,
          }))

          seriesNodes.push(circle(x, y, theme.pointRadius, {
            class: 'chartts-point',
            fill: series.color,
            stroke: `var(${CSS_PREFIX}-bg, #fff)`,
            strokeWidth: 2,
            'data-series': series.index,
            'data-index': i,
            tabindex: 0,
            role: 'img',
            ariaLabel: `${series.name}: ${series.values[i]}`,
          }))
        }
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
    let best: HitResult | null = null
    let bestDist = Infinity

    for (const series of data.series) {
      for (let i = 0; i < series.values.length; i++) {
        if (isNaN(series.values[i]!)) continue // skip missing data
        const x = xScale.map(i)
        const y = yScale.map(series.values[i]!)
        const dist = Math.sqrt((mx - x) ** 2 + (my - y) ** 2)
        if (dist < bestDist) {
          bestDist = dist
          best = { seriesIndex: series.index, pointIndex: i, distance: dist }
        }
      }
    }

    return best && best.distance < 30 ? best : null
  },
}

/** Build a line path string using specified interpolation, skipping NaN gaps */
function buildLinePath(
  values: number[],
  xScale: { map(v: number | string | Date): number },
  yScale: { map(v: number | string | Date): number },
  curve: 'linear' | 'monotone' | 'step',
): string {
  if (values.length === 0) return ''

  // Split into contiguous segments (break at NaN)
  const segments: { x: number; y: number }[][] = []
  let current: { x: number; y: number }[] = []
  for (let i = 0; i < values.length; i++) {
    if (isNaN(values[i]!)) {
      if (current.length > 0) { segments.push(current); current = [] }
    } else {
      current.push({ x: xScale.map(i), y: yScale.map(values[i]!) })
    }
  }
  if (current.length > 0) segments.push(current)

  // Build path for each segment
  const builder = curve === 'step' ? buildStepPath
    : curve === 'monotone' ? buildMonotonePath
    : buildLinearPath
  return segments.map(s => builder(s)).join('')
}

/** Build an area fill path (line path + close along x-axis), skipping NaN gaps */
function buildAreaPath(
  values: number[],
  xScale: { map(v: number | string | Date): number },
  yScale: { map(v: number | string | Date): number },
  area: { y: number; height: number },
  curve: 'linear' | 'monotone' | 'step',
): string {
  if (values.length === 0) return ''

  const baseline = area.y + area.height
  const builder = curve === 'monotone' ? buildMonotonePath
    : curve === 'step' ? buildStepPath
    : buildLinearPath

  // Split into contiguous segments (break at NaN)
  const segments: { x: number; y: number }[][] = []
  let current: { x: number; y: number }[] = []
  for (let i = 0; i < values.length; i++) {
    if (isNaN(values[i]!)) {
      if (current.length > 0) { segments.push(current); current = [] }
    } else {
      current.push({ x: xScale.map(i), y: yScale.map(values[i]!) })
    }
  }
  if (current.length > 0) segments.push(current)

  // Build closed area for each segment
  return segments.map(pts => {
    const linePart = builder(pts)
    const first = pts[0]!
    const last = pts[pts.length - 1]!
    return `${linePart}L${formatNum(last.x)},${formatNum(baseline)}L${formatNum(first.x)},${formatNum(baseline)}Z`
  }).join('')
}

function buildLinearPath(points: { x: number; y: number }[]): string {
  const pb = new PathBuilder()
  pb.moveTo(points[0]!.x, points[0]!.y)
  for (let i = 1; i < points.length; i++) {
    pb.lineTo(points[i]!.x, points[i]!.y)
  }
  return pb.build()
}

function buildStepPath(points: { x: number; y: number }[]): string {
  const pb = new PathBuilder()
  pb.moveTo(points[0]!.x, points[0]!.y)
  for (let i = 1; i < points.length; i++) {
    const midX = (points[i - 1]!.x + points[i]!.x) / 2
    pb.hTo(midX).vTo(points[i]!.y).hTo(points[i]!.x)
  }
  return pb.build()
}

/**
 * Monotone cubic interpolation (Fritsch–Carlson).
 * Produces smooth curves that never overshoot the data.
 */
function buildMonotonePath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return buildLinearPath(points)
  if (points.length === 2) return buildLinearPath(points)

  const n = points.length
  const dx: number[] = []
  const dy: number[] = []
  const m: number[] = []

  // Compute slopes
  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1]!.x - points[i]!.x)
    dy.push(points[i + 1]!.y - points[i]!.y)
    m.push(dy[i]! / (dx[i]! || 1))
  }

  // Compute tangents (Fritsch–Carlson)
  const tangents: number[] = [m[0]!]
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1]! * m[i]! <= 0) {
      tangents.push(0)
    } else {
      tangents.push((m[i - 1]! + m[i]!) / 2)
    }
  }
  tangents.push(m[n - 2]!)

  // Build path
  const pb = new PathBuilder()
  pb.moveTo(points[0]!.x, points[0]!.y)

  for (let i = 0; i < n - 1; i++) {
    const d = dx[i]! / 3
    pb.curveTo(
      points[i]!.x + d,
      points[i]!.y + tangents[i]! * d,
      points[i + 1]!.x - d,
      points[i + 1]!.y - tangents[i + 1]! * d,
      points[i + 1]!.x,
      points[i + 1]!.y,
    )
  }

  return pb.build()
}
