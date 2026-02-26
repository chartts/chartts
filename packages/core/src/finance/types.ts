/**
 * Financial analysis type definitions.
 * ZERO runtime code — types and interfaces only.
 */

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
