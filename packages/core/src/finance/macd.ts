/**
 * MACD (Moving Average Convergence Divergence).
 * Depends on EMA from moving-averages.
 */

import { ema } from './moving-averages'
import type { MACDResult } from './types'

/**
 * Compute MACD.
 * MACD line = EMA(fast) - EMA(slow).
 * Signal = EMA(MACD line, signalPeriod).
 * Histogram = MACD - Signal.
 * Default: fast=12, slow=26, signal=9.
 */
export function macd(
  values: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9,
): MACDResult {
  const n = values.length
  const fastEma = ema(values, fastPeriod)
  const slowEma = ema(values, slowPeriod)

  // MACD line
  const macdLine = new Array<number>(n)
  for (let i = 0; i < n; i++) {
    macdLine[i] = isNaN(fastEma[i]!) || isNaN(slowEma[i]!) ? NaN : fastEma[i]! - slowEma[i]!
  }

  // Signal line = EMA of MACD (skip NaN warmup)
  // Find first non-NaN in macdLine
  let firstValid = -1
  for (let i = 0; i < n; i++) {
    if (!isNaN(macdLine[i]!)) { firstValid = i; break }
  }

  const signalLine = new Array<number>(n).fill(NaN)
  const histogram = new Array<number>(n).fill(NaN)

  if (firstValid >= 0) {
    const validSlice = macdLine.slice(firstValid)
    const signalEma = ema(validSlice, signalPeriod)
    for (let i = 0; i < validSlice.length; i++) {
      signalLine[firstValid + i] = signalEma[i]!
      if (!isNaN(macdLine[firstValid + i]!) && !isNaN(signalEma[i]!)) {
        histogram[firstValid + i] = macdLine[firstValid + i]! - signalEma[i]!
      }
    }
  }

  return { macd: macdLine, signal: signalLine, histogram }
}
