import { PathBuilder } from '../render/tree'
import { formatNum } from './format'

export type CurveInterpolation = 'linear' | 'monotone' | 'step'
export type Point = { x: number; y: number }

/**
 * Split values into contiguous segments, breaking at NaN gaps.
 * Maps indices to pixel coordinates via xScale/yScale.
 */
export function segmentValues(
  values: number[],
  xScale: { map(v: number | string | Date): number },
  yScale: { map(v: number | string | Date): number },
): Point[][] {
  const segments: Point[][] = []
  let current: Point[] = []
  for (let i = 0; i < values.length; i++) {
    if (isNaN(values[i]!)) {
      if (current.length > 0) { segments.push(current); current = [] }
    } else {
      current.push({ x: xScale.map(i), y: yScale.map(values[i]!) })
    }
  }
  if (current.length > 0) segments.push(current)
  return segments
}

/**
 * Build a line path string using specified interpolation, skipping NaN gaps.
 */
export function buildLinePath(
  values: number[],
  xScale: { map(v: number | string | Date): number },
  yScale: { map(v: number | string | Date): number },
  curve: CurveInterpolation,
): string {
  if (values.length === 0) return ''
  const segments = segmentValues(values, xScale, yScale)
  const builder = curveBuilder(curve)
  return segments.map(s => builder(s)).join('')
}

/**
 * Build an area fill path (line path + close along x-axis), skipping NaN gaps.
 */
export function buildAreaPath(
  values: number[],
  xScale: { map(v: number | string | Date): number },
  yScale: { map(v: number | string | Date): number },
  area: { y: number; height: number },
  curve: CurveInterpolation,
): string {
  if (values.length === 0) return ''
  const baseline = area.y + area.height
  const segments = segmentValues(values, xScale, yScale)
  const builder = curveBuilder(curve)

  return segments.map(pts => {
    const linePart = builder(pts)
    const first = pts[0]!
    const last = pts[pts.length - 1]!
    return `${linePart}L${formatNum(last.x)},${formatNum(baseline)}L${formatNum(first.x)},${formatNum(baseline)}Z`
  }).join('')
}

/** Select a curve builder function by interpolation type. */
function curveBuilder(curve: CurveInterpolation): (points: Point[]) => string {
  if (curve === 'step') return buildStepPath
  if (curve === 'monotone') return buildMonotonePath
  return buildLinearPath
}

export function buildLinearPath(points: Point[]): string {
  if (points.length === 0) return ''
  const pb = new PathBuilder()
  pb.moveTo(points[0]!.x, points[0]!.y)
  for (let i = 1; i < points.length; i++) {
    pb.lineTo(points[i]!.x, points[i]!.y)
  }
  return pb.build()
}

export function buildStepPath(points: Point[]): string {
  if (points.length === 0) return ''
  const pb = new PathBuilder()
  pb.moveTo(points[0]!.x, points[0]!.y)
  for (let i = 1; i < points.length; i++) {
    const midX = (points[i - 1]!.x + points[i]!.x) / 2
    pb.hTo(midX).vTo(points[i]!.y).hTo(points[i]!.x)
  }
  return pb.build()
}

/**
 * Monotone cubic interpolation (Fritsch-Carlson).
 * Produces smooth curves that never overshoot the data.
 */
export function buildMonotonePath(points: Point[]): string {
  if (points.length < 2) return buildLinearPath(points)
  if (points.length === 2) return buildLinearPath(points)

  const n = points.length
  const dx: number[] = []
  const dy: number[] = []
  const m: number[] = []

  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1]!.x - points[i]!.x)
    dy.push(points[i + 1]!.y - points[i]!.y)
    m.push(dy[i]! / (dx[i]! || 1))
  }

  const tangents: number[] = [m[0]!]
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1]! * m[i]! <= 0) {
      tangents.push(0)
    } else {
      tangents.push((m[i - 1]! + m[i]!) / 2)
    }
  }
  tangents.push(m[n - 2]!)

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
