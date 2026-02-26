/**
 * Average True Range (ATR).
 * Pure function, zero dependencies.
 */

/**
 * Average True Range using Wilder's smoothing.
 * True Range = max(high-low, |high-prevClose|, |low-prevClose|).
 * First `period` values are NaN. Default period: 14. O(n).
 */
export function atr(
  high: number[],
  low: number[],
  close: number[],
  period: number = 14,
): number[] {
  const n = high.length
  const out = new Array<number>(n).fill(NaN)
  if (period < 1 || n < period + 1) return out

  // True Range array
  const tr = new Array<number>(n)
  tr[0] = high[0]! - low[0]!
  for (let i = 1; i < n; i++) {
    const hl = high[i]! - low[i]!
    const hpc = Math.abs(high[i]! - close[i - 1]!)
    const lpc = Math.abs(low[i]! - close[i - 1]!)
    tr[i] = Math.max(hl, hpc, lpc)
  }

  // First ATR = simple average of first `period` TRs (starting from index 1)
  let sum = 0
  for (let i = 1; i <= period; i++) sum += tr[i]!
  out[period] = sum / period

  // Wilder's smoothing
  let prev = out[period]!
  for (let i = period + 1; i < n; i++) {
    prev = (prev * (period - 1) + tr[i]!) / period
    out[i] = prev
  }
  return out
}
