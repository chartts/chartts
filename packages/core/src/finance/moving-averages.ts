/**
 * Moving average indicators — SMA, EMA, WMA.
 * Pure functions, zero dependencies.
 */

/**
 * Simple Moving Average.
 * O(n) using running sum. First (period-1) values are NaN.
 */
export function sma(values: number[], period: number): number[] {
  const n = values.length
  const out = new Array<number>(n)
  if (period < 1 || period > n) { out.fill(NaN); return out }

  let sum = 0
  for (let i = 0; i < n; i++) {
    sum += values[i]!
    if (i < period - 1) {
      out[i] = NaN
    } else {
      if (i >= period) sum -= values[i - period]!
      out[i] = sum / period
    }
  }
  return out
}

/**
 * Exponential Moving Average.
 * Seeded with SMA of first `period` values. Smoothing k = 2/(period+1).
 * First (period-1) values are NaN. O(n).
 */
export function ema(values: number[], period: number): number[] {
  const n = values.length
  const out = new Array<number>(n)
  if (period < 1 || period > n) { out.fill(NaN); return out }

  const k = 2 / (period + 1)

  // Seed: SMA of first `period` values
  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += values[i]!
    out[i] = i < period - 1 ? NaN : sum / period
  }

  // EMA from period onward
  let prev = out[period - 1]!
  for (let i = period; i < n; i++) {
    prev = values[i]! * k + prev * (1 - k)
    out[i] = prev
  }
  return out
}

/**
 * Weighted Moving Average.
 * Weights increase linearly: [1, 2, ..., period].
 * First (period-1) values are NaN. O(n*period).
 */
export function wma(values: number[], period: number): number[] {
  const n = values.length
  const out = new Array<number>(n)
  if (period < 1 || period > n) { out.fill(NaN); return out }

  const denom = (period * (period + 1)) / 2

  for (let i = 0; i < period - 1; i++) out[i] = NaN

  for (let i = period - 1; i < n; i++) {
    let wSum = 0
    for (let j = 0; j < period; j++) {
      wSum += values[i - period + 1 + j]! * (j + 1)
    }
    out[i] = wSum / denom
  }
  return out
}
