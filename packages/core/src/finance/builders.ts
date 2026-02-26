/**
 * Financial data builders — bridge indicator output to chart data formats.
 */

import { bollingerBands } from './bollinger'
import { macd } from './macd'
import type { BollingerResult, MACDResult, OHLCAggregation } from './types'

/**
 * Aggregate tick-level data into OHLC bars.
 * @param timestamps - epoch milliseconds
 * @param prices - price at each tick
 * @param interval - bar size in milliseconds
 * @param volumes - optional volume at each tick
 */
export function toOHLC(
  timestamps: number[],
  prices: number[],
  interval: number,
  volumes?: number[],
): OHLCAggregation {
  const buckets = new Map<number, { open: number; high: number; low: number; close: number; vol: number; ts: number }>()

  for (let i = 0; i < timestamps.length; i++) {
    const key = Math.floor(timestamps[i]! / interval) * interval
    const p = prices[i]!
    const v = volumes ? volumes[i]! : 0
    const b = buckets.get(key)
    if (b) {
      if (p > b.high) b.high = p
      if (p < b.low) b.low = p
      b.close = p
      b.vol += v
    } else {
      buckets.set(key, { open: p, high: p, low: p, close: p, vol: v, ts: key })
    }
  }

  const sorted = [...buckets.values()].sort((a, b) => a.ts - b.ts)
  const labels: string[] = []
  const open: number[] = []
  const high: number[] = []
  const low: number[] = []
  const close: number[] = []
  const volume: number[] = []

  for (const bar of sorted) {
    const d = new Date(bar.ts)
    labels.push(`${d.getMonth() + 1}/${d.getDate()}`)
    open.push(bar.open)
    high.push(bar.high)
    low.push(bar.low)
    close.push(bar.close)
    volume.push(bar.vol)
  }

  return volumes
    ? { labels, open, high, low, close, volume }
    : { labels, open, high, low, close }
}

/**
 * Determine volume bar directions from consecutive close prices.
 * Returns 'up'|'down' array for Volume chart's `directions` option.
 */
export function volumeDirections(values: number[]): ('up' | 'down')[] {
  return values.map((v, i) => i === 0 ? 'up' as const : (v >= values[i - 1]! ? 'up' as const : 'down' as const))
}

/**
 * Compute Bollinger Bands in Range chart format.
 * Output: { upper, lower, middle } — middle goes into series[0].values,
 * upper/lower into the range option.
 */
export function toBollingerData(
  close: number[],
  period: number = 20,
  k: number = 2,
): BollingerResult {
  return bollingerBands(close, period, k)
}

/**
 * Compute MACD in Combo chart format.
 * series[0] = histogram (bars), series[1] = MACD line, series[2] = signal line.
 */
export function toMACDData(
  close: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9,
): MACDResult {
  return macd(close, fastPeriod, slowPeriod, signalPeriod)
}
