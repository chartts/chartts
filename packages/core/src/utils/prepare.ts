import type { ChartData, ResolvedOptions, PreparedData } from '../types'
import { prepareData } from '../data/prepare'

/**
 * Prepare data with axes, grid, and legend suppressed.
 * Used by chart types that render their own layout (pie, gauge, treemap, etc.).
 */
export function prepareNoAxes(data: ChartData, options: ResolvedOptions): PreparedData {
  return prepareData(data, {
    ...options,
    xAxis: false,
    yAxis: false,
    xGrid: false,
    yGrid: false,
    legend: false,
  })
}
