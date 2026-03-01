// ============================================================
// Descriptive statistics
// ============================================================

export function sum(values: number[]): number {
  let s = 0
  for (let i = 0; i < values.length; i++) s += values[i]!
  return s
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return sum(values) / values.length
}

export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2
}

export function mode(values: number[]): number[] {
  if (values.length === 0) return []
  const freq = new Map<number, number>()
  let maxFreq = 0
  for (const v of values) {
    const count = (freq.get(v) ?? 0) + 1
    freq.set(v, count)
    if (count > maxFreq) maxFreq = count
  }
  // If all values appear once, there is no mode
  if (maxFreq === 1) return []
  const result: number[] = []
  for (const [v, count] of freq) {
    if (count === maxFreq) result.push(v)
  }
  return result.sort((a, b) => a - b)
}

export function variance(values: number[], population: boolean = false): number {
  const n = values.length
  if (n === 0) return 0
  const m = mean(values)
  let ss = 0
  for (let i = 0; i < n; i++) {
    ss += (values[i]! - m) ** 2
  }
  const denom = population ? n : n - 1
  return denom === 0 ? 0 : ss / denom
}

export function stddev(values: number[], population: boolean = false): number {
  return Math.sqrt(variance(values, population))
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length
  // Linear interpolation method
  const k = (p / 100) * (n - 1)
  const f = Math.floor(k)
  const c = Math.ceil(k)
  if (f === c) return sorted[f]!
  return sorted[f]! + (k - f) * (sorted[c]! - sorted[f]!)
}

export function quartiles(values: number[]): { q1: number; q2: number; q3: number } {
  return {
    q1: percentile(values, 25),
    q2: percentile(values, 50),
    q3: percentile(values, 75),
  }
}

export function iqr(values: number[]): number {
  const q = quartiles(values)
  return q.q3 - q.q1
}

export function range(values: number[]): number {
  if (values.length === 0) return 0
  let lo = values[0]!
  let hi = values[0]!
  for (let i = 1; i < values.length; i++) {
    if (values[i]! < lo) lo = values[i]!
    if (values[i]! > hi) hi = values[i]!
  }
  return hi - lo
}

export function min(values: number[]): number {
  if (values.length === 0) return Infinity
  let m = values[0]!
  for (let i = 1; i < values.length; i++) {
    if (values[i]! < m) m = values[i]!
  }
  return m
}

export function max(values: number[]): number {
  if (values.length === 0) return -Infinity
  let m = values[0]!
  for (let i = 1; i < values.length; i++) {
    if (values[i]! > m) m = values[i]!
  }
  return m
}

// ============================================================
// Correlation & association
// ============================================================

export function covariance(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length)
  if (n === 0) return 0
  const meanA = mean(a.slice(0, n))
  const meanB = mean(b.slice(0, n))
  let s = 0
  for (let i = 0; i < n; i++) {
    s += (a[i]! - meanA) * (b[i]! - meanB)
  }
  return n <= 1 ? 0 : s / (n - 1)
}

export function correlation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length)
  if (n === 0) return 0
  const stdA = stddev(a.slice(0, n))
  const stdB = stddev(b.slice(0, n))
  if (stdA === 0 || stdB === 0) return 0
  return covariance(a.slice(0, n), b.slice(0, n)) / (stdA * stdB)
}

function rankArray(values: number[]): number[] {
  const indexed = values.map((v, i) => ({ v, i }))
  indexed.sort((a, b) => a.v - b.v)
  const ranks = new Array<number>(values.length)

  let i = 0
  while (i < indexed.length) {
    let j = i
    // Find ties
    while (j < indexed.length && indexed[j]!.v === indexed[i]!.v) j++
    // Average rank for ties
    const avgRank = (i + j - 1) / 2 + 1 // 1-based
    for (let k = i; k < j; k++) {
      ranks[indexed[k]!.i] = avgRank
    }
    i = j
  }
  return ranks
}

export function spearmanCorrelation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length)
  if (n === 0) return 0
  const rankA = rankArray(a.slice(0, n))
  const rankB = rankArray(b.slice(0, n))
  return correlation(rankA, rankB)
}

// ============================================================
// Normalization
// ============================================================

export function normalize(values: number[]): number[] {
  if (values.length === 0) return []
  const lo = min(values)
  const hi = max(values)
  const r = hi - lo
  if (r === 0) return values.map(() => 0.5)
  return values.map(v => (v - lo) / r)
}

export function zScore(values: number[]): number[] {
  if (values.length === 0) return []
  const m = mean(values)
  const s = stddev(values)
  if (s === 0) return values.map(() => 0)
  return values.map(v => (v - m) / s)
}

// ============================================================
// Outlier detection
// ============================================================

export function outliers(
  values: number[],
  method: 'iqr' | 'zscore' = 'iqr',
  threshold?: number,
): { indices: number[]; values: number[] } {
  const resultIndices: number[] = []
  const resultValues: number[] = []

  if (values.length === 0) return { indices: resultIndices, values: resultValues }

  if (method === 'iqr') {
    const q = quartiles(values)
    const interquartileRange = q.q3 - q.q1
    const multiplier = threshold ?? 1.5
    const lower = q.q1 - multiplier * interquartileRange
    const upper = q.q3 + multiplier * interquartileRange

    for (let i = 0; i < values.length; i++) {
      if (values[i]! < lower || values[i]! > upper) {
        resultIndices.push(i)
        resultValues.push(values[i]!)
      }
    }
  } else {
    // z-score method
    const m = mean(values)
    const s = stddev(values)
    const zThreshold = threshold ?? 3

    if (s === 0) return { indices: resultIndices, values: resultValues }

    for (let i = 0; i < values.length; i++) {
      const z = Math.abs((values[i]! - m) / s)
      if (z > zThreshold) {
        resultIndices.push(i)
        resultValues.push(values[i]!)
      }
    }
  }

  return { indices: resultIndices, values: resultValues }
}

// ============================================================
// Distribution
// ============================================================

export function histogram(
  values: number[],
  bins?: number,
): { edges: number[]; counts: number[] } {
  if (values.length === 0) return { edges: [], counts: [] }

  const lo = min(values)
  const hi = max(values)
  const numBins = bins ?? Math.max(1, Math.ceil(Math.sqrt(values.length)))

  const binWidth = (hi - lo) / numBins || 1
  const edges: number[] = []
  for (let i = 0; i <= numBins; i++) {
    edges.push(lo + i * binWidth)
  }

  const counts = new Array(numBins).fill(0)
  for (const v of values) {
    let idx = Math.floor((v - lo) / binWidth)
    // Include the max value in the last bin
    if (idx >= numBins) idx = numBins - 1
    if (idx < 0) idx = 0
    counts[idx]++
  }

  return { edges, counts }
}

export function kde(
  values: number[],
  bandwidth?: number,
  points: number = 100,
): { x: number[]; y: number[] } {
  if (values.length === 0) return { x: [], y: [] }

  const n = values.length
  // Silverman's rule of thumb for bandwidth
  const s = stddev(values)
  const h = bandwidth ?? (s > 0 ? 1.06 * s * Math.pow(n, -0.2) : 1)

  const lo = min(values) - 3 * h
  const hi = max(values) + 3 * h
  const step = (hi - lo) / (points - 1)

  const xOut: number[] = []
  const yOut: number[] = []

  for (let i = 0; i < points; i++) {
    const xi = lo + i * step
    xOut.push(xi)

    // Gaussian kernel
    let density = 0
    for (let j = 0; j < n; j++) {
      const u = (xi - values[j]!) / h
      density += Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI)
    }
    yOut.push(density / (n * h))
  }

  return { x: xOut, y: yOut }
}

// ============================================================
// Sampling
// ============================================================

export function sample(values: number[], n: number): number[] {
  if (n >= values.length) return [...values]
  const copy = [...values]
  // Fisher-Yates shuffle partial
  for (let i = copy.length - 1; i > copy.length - 1 - n; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = copy[i]!
    copy[i] = copy[j]!
    copy[j] = tmp
  }
  return copy.slice(copy.length - n)
}

export function bootstrap(
  values: number[],
  statFn: (v: number[]) => number,
  iterations: number = 1000,
): { mean: number; ci: [number, number] } {
  if (values.length === 0) return { mean: 0, ci: [0, 0] }

  const n = values.length
  const stats: number[] = []

  for (let i = 0; i < iterations; i++) {
    // Resample with replacement
    const resampled: number[] = []
    for (let j = 0; j < n; j++) {
      resampled.push(values[Math.floor(Math.random() * n)]!)
    }
    stats.push(statFn(resampled))
  }

  stats.sort((a, b) => a - b)
  const bootMean = mean(stats)
  // 95% confidence interval
  const lower = percentile(stats, 2.5)
  const upper = percentile(stats, 97.5)

  return { mean: bootMean, ci: [lower, upper] }
}
