/**
 * Portfolio & returns analytics.
 * Pure functions, zero dependencies.
 */

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
