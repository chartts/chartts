/**
 * Data decimation algorithms for large datasets.
 *
 * Reduces data point count while preserving visual shape.
 * Sits in the pipeline between raw data and render.
 */

import type { ChartData, Series } from '../types'

export interface DecimateOptions {
  /** Decimation algorithm. Default 'lttb'. */
  algorithm?: 'lttb' | 'min-max'
  /** Target number of output points. Default: 2x container pixel width. */
  threshold?: number
}

/**
 * Decimate chart data to `threshold` points per series.
 * Returns original data if already below threshold.
 */
export function decimateData(
  data: ChartData,
  opts: DecimateOptions,
): ChartData {
  const threshold = opts.threshold ?? 1000
  const algo = opts.algorithm ?? 'lttb'

  // Check if any series exceeds threshold
  const needsDecimation = data.series.some(s => s.values.length > threshold)
  if (!needsDecimation) return data

  const decimated: Series[] = data.series.map(s => {
    if (s.values.length <= threshold) return s

    const values = algo === 'lttb'
      ? lttb(s.values, threshold)
      : minMax(s.values, threshold)

    return { ...s, values: values.map(p => p.value) }
  })

  // Decimate labels to match
  const primarySeries = data.series[0]
  let labels = data.labels
  if (labels && primarySeries && primarySeries.values.length > threshold) {
    const indices = (decimated[0]!.values.length === threshold)
      ? getDecimatedIndices(primarySeries.values, threshold, algo)
      : undefined
    if (indices) {
      labels = indices.map(i => labels![i]!) as typeof labels
    }
  }

  return { labels, series: decimated }
}

// ---------------------------------------------------------------------------
// LTTB — Largest Triangle Three Buckets
// ---------------------------------------------------------------------------

interface IndexedPoint {
  index: number
  value: number
}

/**
 * Largest Triangle Three Buckets algorithm.
 * Selects points that maximize the visual triangle area,
 * preserving the shape of the data while reducing point count.
 *
 * Reference: Sveinn Steinarsson, "Downsampling Time Series for Visual
 * Representation" (2013)
 */
function lttb(values: number[], threshold: number): IndexedPoint[] {
  const len = values.length
  if (len <= threshold) {
    return values.map((v, i) => ({ index: i, value: v }))
  }

  const sampled: IndexedPoint[] = []

  // Always keep first point
  sampled.push({ index: 0, value: values[0]! })

  // Bucket size (excluding first and last points)
  const bucketSize = (len - 2) / (threshold - 2)

  let prevIndex = 0

  for (let i = 1; i < threshold - 1; i++) {
    // Current bucket range
    const bucketStart = Math.floor((i - 1) * bucketSize) + 1
    const bucketEnd = Math.min(Math.floor(i * bucketSize) + 1, len - 1)

    // Next bucket average (for triangle computation)
    const nextBucketStart = Math.floor(i * bucketSize) + 1
    const nextBucketEnd = Math.min(Math.floor((i + 1) * bucketSize) + 1, len - 1)

    let avgX = 0
    let avgY = 0
    let avgCount = 0
    for (let j = nextBucketStart; j < nextBucketEnd; j++) {
      avgX += j
      avgY += values[j]!
      avgCount++
    }
    if (avgCount > 0) {
      avgX /= avgCount
      avgY /= avgCount
    }

    // Find point in current bucket that creates largest triangle
    let maxArea = -1
    let bestIndex = bucketStart

    const px = prevIndex
    const py = values[prevIndex]!

    for (let j = bucketStart; j < bucketEnd; j++) {
      // Triangle area = 0.5 * |x1(y2-y3) + x2(y3-y1) + x3(y1-y2)|
      const area = Math.abs(
        (px - avgX) * (values[j]! - py) -
        (px - j) * (avgY - py),
      ) * 0.5

      if (area > maxArea) {
        maxArea = area
        bestIndex = j
      }
    }

    sampled.push({ index: bestIndex, value: values[bestIndex]! })
    prevIndex = bestIndex
  }

  // Always keep last point
  sampled.push({ index: len - 1, value: values[len - 1]! })

  return sampled
}

// ---------------------------------------------------------------------------
// Min-Max — preserves peaks and valleys
// ---------------------------------------------------------------------------

/**
 * Min-Max decimation. Each bucket keeps both the minimum and maximum values,
 * ensuring peaks and valleys are always visible.
 */
function minMax(values: number[], threshold: number): IndexedPoint[] {
  const len = values.length
  if (len <= threshold) {
    return values.map((v, i) => ({ index: i, value: v }))
  }

  const sampled: IndexedPoint[] = []
  const bucketSize = len / (threshold / 2)

  // Always keep first
  sampled.push({ index: 0, value: values[0]! })

  for (let i = 0; i < threshold / 2 - 1; i++) {
    const start = Math.floor(i * bucketSize)
    const end = Math.min(Math.floor((i + 1) * bucketSize), len)

    let minVal = Infinity
    let maxVal = -Infinity
    let minIdx = start
    let maxIdx = start

    for (let j = start; j < end; j++) {
      const v = values[j]!
      if (v < minVal) { minVal = v; minIdx = j }
      if (v > maxVal) { maxVal = v; maxIdx = j }
    }

    // Add in index order so line doesn't cross itself
    if (minIdx < maxIdx) {
      sampled.push({ index: minIdx, value: minVal })
      sampled.push({ index: maxIdx, value: maxVal })
    } else {
      sampled.push({ index: maxIdx, value: maxVal })
      sampled.push({ index: minIdx, value: minVal })
    }
  }

  // Always keep last
  sampled.push({ index: len - 1, value: values[len - 1]! })

  return sampled
}

// ---------------------------------------------------------------------------
// Helper: get decimated indices (for label mapping)
// ---------------------------------------------------------------------------

function getDecimatedIndices(values: number[], threshold: number, algo: string): number[] {
  if (algo === 'lttb') {
    return lttb(values, threshold).map(p => p.index)
  }
  return minMax(values, threshold).map(p => p.index)
}
