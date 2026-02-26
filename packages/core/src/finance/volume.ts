/**
 * Volume-based indicators — VWAP, OBV.
 * Pure functions, zero dependencies.
 */

/**
 * Volume Weighted Average Price.
 * VWAP[i] = cumulative(price*volume) / cumulative(volume).
 * Full length output (no NaN padding). O(n).
 */
export function vwap(price: number[], volume: number[]): number[] {
  const n = price.length
  const out = new Array<number>(n)
  let cumPV = 0
  let cumV = 0
  for (let i = 0; i < n; i++) {
    cumPV += price[i]! * volume[i]!
    cumV += volume[i]!
    out[i] = cumV === 0 ? price[i]! : cumPV / cumV
  }
  return out
}

/**
 * On-Balance Volume.
 * Starts at 0. If close > prevClose, add volume. If close < prevClose, subtract.
 * Full length output. O(n).
 */
export function obv(close: number[], volume: number[]): number[] {
  const n = close.length
  const out = new Array<number>(n)
  out[0] = 0
  for (let i = 1; i < n; i++) {
    if (close[i]! > close[i - 1]!) out[i] = out[i - 1]! + volume[i]!
    else if (close[i]! < close[i - 1]!) out[i] = out[i - 1]! - volume[i]!
    else out[i] = out[i - 1]!
  }
  return out
}
