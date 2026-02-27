import type { RenderContext, HitResult } from '../types'

/**
 * Generic nearest-point hit test for point-based charts (line, scatter, etc.).
 * Iterates all series/points and finds the closest one within maxDistance.
 */
export function nearestPointHitTest(
  ctx: RenderContext,
  mx: number,
  my: number,
  maxDistance: number,
): HitResult | null {
  const { data, xScale, yScale } = ctx
  let best: HitResult | null = null
  let bestDist = Infinity

  for (const series of data.series) {
    for (let i = 0; i < series.values.length; i++) {
      if (isNaN(series.values[i]!)) continue
      const x = xScale.map(i)
      const y = yScale.map(series.values[i]!)
      const dist = Math.sqrt((mx - x) ** 2 + (my - y) ** 2)
      if (dist < bestDist && dist < maxDistance) {
        bestDist = dist
        best = { seriesIndex: series.index, pointIndex: i, distance: dist, x, y }
      }
    }
  }

  return best
}
