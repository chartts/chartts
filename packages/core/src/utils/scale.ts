import type { Scale, ChartArea } from '../types'

/** Safely get bandwidth from a scale. Returns 0 for scales without band mode. */
export function getBandwidth(scale: Scale): number {
  return scale.bandwidth ? scale.bandwidth() : 0
}

/**
 * Create a horizontal value mapper — maps yScale values to x positions.
 * Used by horizontal-bar, dumbbell, and other horizontal layout charts.
 */
export function createHorizontalMapper(
  yScale: Scale,
  area: ChartArea,
  chartX: number,
  chartW: number,
): (v: number) => number {
  return (v: number) => {
    const yPos = yScale.map(v)
    const fraction = (yPos - area.y) / area.height
    return chartX + chartW * (1 - fraction)
  }
}
