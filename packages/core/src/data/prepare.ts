import type { ChartData, PreparedData, PreparedSeries, DataBounds, ResolvedOptions } from '../types'
import { validateData } from './validate'

/**
 * Validate, normalize, and compute bounds for chart data.
 * This is the single entry point for data preparation.
 */
export function prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
  validateData(data)

  const count = data.series[0]!.values.length
  const labels = data.labels ?? Array.from({ length: count }, (_, i) => i)

  const series: PreparedSeries[] = data.series.map((s, i) => ({
    name: s.name,
    values: s.values,
    color: s.color ?? options.colors[i % options.colors.length]!,
    style: s.style ?? 'solid',
    fill: s.fill ?? false,
    fillOpacity: s.fillOpacity ?? 0.15,
    showPoints: s.showPoints ?? true,
    index: i,
  }))

  const bounds = computeBounds(series, options)

  return { labels, series, bounds }
}

function computeBounds(series: PreparedSeries[], options: ResolvedOptions): DataBounds {
  let yMin = Infinity
  let yMax = -Infinity

  for (const s of series) {
    for (const v of s.values) {
      if (v < yMin) yMin = v
      if (v > yMax) yMax = v
    }
  }

  // Handle edge case: all values identical
  if (yMin === yMax) {
    yMin = yMin === 0 ? 0 : yMin - Math.abs(yMin) * 0.1
    yMax = yMax === 0 ? 1 : yMax + Math.abs(yMax) * 0.1
  }

  // Apply forced bounds
  if (options.yMin !== undefined) yMin = options.yMin
  if (options.yMax !== undefined) yMax = options.yMax

  const count = series[0]?.values.length ?? 0

  return {
    xMin: 0,
    xMax: Math.max(0, count - 1),
    yMin,
    yMax,
  }
}
