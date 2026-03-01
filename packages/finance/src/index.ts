/**
 * @chartts/finance — Financial analysis utilities.
 * Moving averages, oscillators, Bollinger Bands, MACD, and more.
 * Pure math, zero dependencies.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

/** MACD computation result. */
export interface MACDResult {
  /** MACD line (fast EMA - slow EMA). NaN-padded for warmup. */
  macd: number[]
  /** Signal line (EMA of MACD). NaN-padded for warmup. */
  signal: number[]
  /** Histogram (MACD - signal). NaN-padded for warmup. */
  histogram: number[]
}

/** Bollinger Bands result. */
export interface BollingerResult {
  /** Upper band: SMA + k * stddev */
  upper: number[]
  /** Middle band: SMA */
  middle: number[]
  /** Lower band: SMA - k * stddev */
  lower: number[]
}

/** Stochastic Oscillator result. */
export interface StochasticResult {
  /** %K (fast stochastic) */
  k: number[]
  /** %D (smoothed %K) */
  d: number[]
}

/** Aggregated OHLC arrays ready for chart consumption. */
export interface OHLCAggregation {
  labels: string[]
  open: number[]
  high: number[]
  low: number[]
  close: number[]
  volume?: number[]
}

// ─── Moving Averages ────────────────────────────────────────────────────────

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

// ─── Oscillators ────────────────────────────────────────────────────────────

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

// ─── MACD ───────────────────────────────────────────────────────────────────

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

// ─── Bollinger Bands ────────────────────────────────────────────────────────

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

// ─── Volatility ─────────────────────────────────────────────────────────────

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

// ─── Volume Indicators ──────────────────────────────────────────────────────

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

// ─── Portfolio & Returns ────────────────────────────────────────────────────

/** Simple percentage returns. First value is NaN. */
export function simpleReturns(prices: number[]): number[] {
  const n = prices.length
  const out = new Array<number>(n)
  out[0] = NaN
  for (let i = 1; i < n; i++) {
    out[i] = (prices[i]! - prices[i - 1]!) / prices[i - 1]!
  }
  return out
}

/** Log returns. First value is NaN. */
export function logReturns(prices: number[]): number[] {
  const n = prices.length
  const out = new Array<number>(n)
  out[0] = NaN
  for (let i = 1; i < n; i++) {
    out[i] = Math.log(prices[i]! / prices[i - 1]!)
  }
  return out
}

/** Cumulative returns (growth from initial price). First value is 0. */
export function cumulativeReturns(prices: number[]): number[] {
  const n = prices.length
  const out = new Array<number>(n)
  const p0 = prices[0]!
  for (let i = 0; i < n; i++) {
    out[i] = (prices[i]! - p0) / p0
  }
  return out
}

/** Drawdown at each point (always <= 0). */
export function drawdown(prices: number[]): number[] {
  const n = prices.length
  const out = new Array<number>(n)
  let peak = -Infinity
  for (let i = 0; i < n; i++) {
    if (prices[i]! > peak) peak = prices[i]!
    out[i] = (prices[i]! - peak) / peak
  }
  return out
}

/** Maximum drawdown (single number, deepest trough). Always <= 0. */
export function maxDrawdown(prices: number[]): number {
  const dd = drawdown(prices)
  let min = 0
  for (const v of dd) if (v < min) min = v
  return min
}

/**
 * Annualized Sharpe ratio.
 * sharpe = mean(excess) / std(excess) * sqrt(annualizationFactor).
 * Filters out NaN values from returns array.
 */
export function sharpeRatio(
  returns: number[],
  riskFreeRate: number = 0,
  annualizationFactor: number = 252,
): number {
  const valid = returns.filter(v => !isNaN(v))
  if (valid.length < 2) return NaN

  const excess = valid.map(r => r - riskFreeRate / annualizationFactor)
  const mean = excess.reduce((s, v) => s + v, 0) / excess.length
  const variance = excess.reduce((s, v) => s + (v - mean) ** 2, 0) / (excess.length - 1)
  const std = Math.sqrt(variance)
  return std === 0 ? 0 : (mean / std) * Math.sqrt(annualizationFactor)
}

/**
 * Volatility (standard deviation of returns).
 * If rollingPeriod provided: returns number[] with NaN padding.
 * Otherwise returns single annualized number.
 */
export function volatility(
  returns: number[],
  rollingPeriod?: number,
  annualizationFactor: number = 252,
): number | number[] {
  const valid = returns.filter(v => !isNaN(v))

  if (rollingPeriod != null) {
    const n = returns.length
    const out = new Array<number>(n).fill(NaN)
    for (let i = rollingPeriod - 1; i < n; i++) {
      // Collect valid values in window
      const window: number[] = []
      for (let j = i - rollingPeriod + 1; j <= i; j++) {
        if (!isNaN(returns[j]!)) window.push(returns[j]!)
      }
      if (window.length < 2) continue
      const mean = window.reduce((s, v) => s + v, 0) / window.length
      const variance = window.reduce((s, v) => s + (v - mean) ** 2, 0) / (window.length - 1)
      out[i] = Math.sqrt(variance) * Math.sqrt(annualizationFactor)
    }
    return out
  }

  // Overall annualized volatility
  if (valid.length < 2) return NaN
  const mean = valid.reduce((s, v) => s + v, 0) / valid.length
  const variance = valid.reduce((s, v) => s + (v - mean) ** 2, 0) / (valid.length - 1)
  return Math.sqrt(variance) * Math.sqrt(annualizationFactor)
}

// ─── Data Builders ──────────────────────────────────────────────────────────

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
 * Output: { upper, lower, middle } -- middle goes into series[0].values,
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
