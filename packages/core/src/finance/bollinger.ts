/**
 * Bollinger Bands.
 * Depends on SMA from moving-averages.
 */

import { sma } from './moving-averages'
import type { BollingerResult } from './types'

/**
 * Compute Bollinger Bands.
 * Middle = SMA(period). Upper = middle + k*stddev. Lower = middle - k*stddev.
 * Default: period=20, k=2.
 * First (period-1) values are NaN.
 */
export function bollingerBands(
  values: number[],
  period: number = 20,
  k: number = 2,
): BollingerResult {
  const n = values.length
  const middle = sma(values, period)
  const upper = new Array<number>(n)
  const lower = new Array<number>(n)

  for (let i = 0; i < n; i++) {
    if (isNaN(middle[i]!)) {
      upper[i] = NaN
      lower[i] = NaN
      continue
    }
    // Rolling standard deviation
    let sumSq = 0
    const mean = middle[i]!
    for (let j = i - period + 1; j <= i; j++) {
      const diff = values[j]! - mean
      sumSq += diff * diff
    }
    const std = Math.sqrt(sumSq / period)
    upper[i] = mean + k * std
    lower[i] = mean - k * std
  }

  return { upper, middle, lower }
}
