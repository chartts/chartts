/**
 * Oscillator indicators — RSI, Stochastic.
 * Pure functions, zero dependencies.
 */

import type { StochasticResult } from './types'

/**
 * Relative Strength Index (Wilder's smoothing).
 * Returns 0-100 scaled values. First `period` values are NaN.
 * Default period: 14. O(n).
 */
export function rsi(values: number[], period: number = 14): number[] {
  const n = values.length
  const out = new Array<number>(n).fill(NaN)
  if (period < 1 || n < period + 1) return out

  // Compute deltas
  let gainSum = 0
  let lossSum = 0
  for (let i = 1; i <= period; i++) {
    const delta = values[i]! - values[i - 1]!
    if (delta > 0) gainSum += delta
    else lossSum -= delta
  }

  let avgGain = gainSum / period
  let avgLoss = lossSum / period

  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)

  // Wilder's smoothing for subsequent values
  for (let i = period + 1; i < n; i++) {
    const delta = values[i]! - values[i - 1]!
    const gain = delta > 0 ? delta : 0
    const loss = delta < 0 ? -delta : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  }
  return out
}

/**
 * Stochastic Oscillator.
 * %K = 100 * (close - lowestLow) / (highestHigh - lowestLow) over kPeriod.
 * %D = SMA(%K, dPeriod).
 * Default: kPeriod=14, dPeriod=3.
 */
export function stochastic(
  high: number[],
  low: number[],
  close: number[],
  kPeriod: number = 14,
  dPeriod: number = 3,
): StochasticResult {
  const n = close.length
  const k = new Array<number>(n).fill(NaN)
  const d = new Array<number>(n).fill(NaN)

  // Compute %K
  for (let i = kPeriod - 1; i < n; i++) {
    let hh = -Infinity
    let ll = Infinity
    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (high[j]! > hh) hh = high[j]!
      if (low[j]! < ll) ll = low[j]!
    }
    const range = hh - ll
    k[i] = range === 0 ? 50 : 100 * (close[i]! - ll) / range
  }

  // Compute %D = SMA(%K, dPeriod)
  const firstK = kPeriod - 1
  for (let i = firstK + dPeriod - 1; i < n; i++) {
    let sum = 0
    for (let j = i - dPeriod + 1; j <= i; j++) sum += k[j]!
    d[i] = sum / dPeriod
  }

  return { k, d }
}
