import type { ChartArea, ResolvedOptions, PreparedData } from '../types'

/** Margins around the chart drawing area */
export interface Margins {
  top: number
  right: number
  bottom: number
  left: number
}

/**
 * Compute the chart drawing area given container dimensions,
 * padding, axis labels, and legend position.
 */
export function computeLayout(
  width: number,
  height: number,
  options: ResolvedOptions,
  data: PreparedData,
): { area: ChartArea; margins: Margins } {
  const [pt, pr, pb, pl] = options.padding

  // Base margins from padding
  let top = pt
  let right = pr
  let bottom = pb
  let left = pl

  // Reserve space for y-axis labels + ticks
  if (options.yAxis) {
    const maxLabel = estimateYLabelWidth(data, options)
    left += maxLabel + 10 // label width + tick mark + gap
  }

  // Reserve space for y-axis label text (rotated)
  if (options.yLabel) {
    left += options.fontSize + 4
  }

  // Reserve space for x-axis labels + ticks
  if (options.xAxis) {
    bottom += options.fontSize + 8 // font height + tick mark + gap
  }

  // Reserve space for x-axis label text
  if (options.xLabel) {
    bottom += options.fontSize + 4
  }

  // Reserve space for legend
  if (options.legend) {
    switch (options.legend) {
      case 'top':    top += 20; break
      case 'bottom': bottom += 20; break
      case 'left':   left += 80; break
      case 'right':  right += 80; break
    }
  }

  const area: ChartArea = {
    x: left,
    y: top,
    width: Math.max(0, width - left - right),
    height: Math.max(0, height - top - bottom),
  }

  return { area, margins: { top, right, bottom, left } }
}

/** Estimate the pixel width of the widest y-axis label */
function estimateYLabelWidth(data: PreparedData, options: ResolvedOptions): number {
  const { yMin, yMax } = data.bounds
  const labels = [options.yFormat(yMin), options.yFormat(yMax)]
  const maxLen = Math.max(...labels.map((l) => l.length))
  // Approximate: each character ≈ 0.55em at the given font size
  return maxLen * (options.fontSize * 0.55)
}
