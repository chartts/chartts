import type { Series } from '@chartts/core'

export interface RegressionResult {
  coefficients: number[]
  r2: number
  predict: (x: number) => number
}

// ---------- helpers ----------

function computeR2(y: number[], predicted: number[]): number {
  const n = y.length
  const yMean = y.reduce((s, v) => s + v, 0) / n
  let ssTot = 0
  let ssRes = 0
  for (let i = 0; i < n; i++) {
    ssTot += (y[i]! - yMean) ** 2
    ssRes += (y[i]! - predicted[i]!) ** 2
  }
  return ssTot === 0 ? 1 : 1 - ssRes / ssTot
}

// ---------- Gaussian elimination for solving Ax = b ----------

function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = b.length
  // Augmented matrix
  const aug: number[][] = A.map((row, i) => [...row, b[i]!])

  for (let col = 0; col < n; col++) {
    // Partial pivoting
    let maxRow = col
    let maxVal = Math.abs(aug[col]![col]!)
    for (let row = col + 1; row < n; row++) {
      const val = Math.abs(aug[row]![col]!)
      if (val > maxVal) {
        maxVal = val
        maxRow = row
      }
    }
    if (maxRow !== col) {
      const tmp = aug[col]!
      aug[col] = aug[maxRow]!
      aug[maxRow] = tmp
    }

    const pivot = aug[col]![col]!
    if (Math.abs(pivot) < 1e-12) {
      // Singular or near-singular; set coefficient to 0
      continue
    }

    // Eliminate below
    for (let row = col + 1; row < n; row++) {
      const factor = aug[row]![col]! / pivot
      for (let j = col; j <= n; j++) {
        aug[row]![j] = aug[row]![j]! - factor * aug[col]![j]!
      }
    }
  }

  // Back substitution
  const x = new Array<number>(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    let s = aug[i]![n]!
    for (let j = i + 1; j < n; j++) {
      s -= aug[i]![j]! * x[j]!
    }
    const diag = aug[i]![i]!
    x[i] = Math.abs(diag) < 1e-12 ? 0 : s / diag
  }
  return x
}

// ---------- Linear regression: y = mx + b ----------

export function linearRegression(x: number[], y: number[]): RegressionResult {
  const n = x.length
  if (n === 0) {
    return { coefficients: [0, 0], r2: 0, predict: () => 0 }
  }

  let sumX = 0, sumY = 0, sumXX = 0, sumXY = 0
  for (let i = 0; i < n; i++) {
    sumX += x[i]!
    sumY += y[i]!
    sumXX += x[i]! * x[i]!
    sumXY += x[i]! * y[i]!
  }

  const denom = n * sumXX - sumX * sumX
  const m = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom
  const b = (sumY - m * sumX) / n

  const predicted = x.map(xi => m * xi + b)
  const r2 = computeR2(y, predicted)

  return {
    coefficients: [b, m], // a0 + a1*x
    r2,
    predict: (xi: number) => m * xi + b,
  }
}

// ---------- Polynomial regression ----------

export function polynomialRegression(x: number[], y: number[], degree: number = 2): RegressionResult {
  const n = x.length
  if (n === 0) {
    return { coefficients: new Array(degree + 1).fill(0), r2: 0, predict: () => 0 }
  }

  const d = degree + 1

  // Build normal equations: (X^T X) a = X^T y
  // X is the Vandermonde matrix [1, x, x^2, ..., x^degree]
  const A: number[][] = Array.from({ length: d }, () => new Array(d).fill(0))
  const b = new Array<number>(d).fill(0)

  // Precompute powers sums
  // We need sum(x^(i+j)) for i,j in 0..degree => powers up to 2*degree
  const powSums = new Array<number>(2 * degree + 1).fill(0)
  for (let i = 0; i < n; i++) {
    let xp = 1
    for (let p = 0; p <= 2 * degree; p++) {
      powSums[p]! += xp
      xp *= x[i]!
    }
  }

  for (let i = 0; i < d; i++) {
    for (let j = 0; j < d; j++) {
      A[i]![j] = powSums[i + j]!
    }
    // X^T y
    for (let k = 0; k < n; k++) {
      b[i]! += Math.pow(x[k]!, i) * y[k]!
    }
  }

  const coefficients = solveLinearSystem(A, b)

  const predictFn = (xi: number): number => {
    let result = 0
    let xp = 1
    for (let i = 0; i < coefficients.length; i++) {
      result += coefficients[i]! * xp
      xp *= xi
    }
    return result
  }

  const predicted = x.map(predictFn)
  const r2 = computeR2(y, predicted)

  return { coefficients, r2, predict: predictFn }
}

// ---------- Exponential regression: y = a * e^(b*x) ----------

export function exponentialRegression(x: number[], y: number[]): RegressionResult {
  const n = x.length
  if (n === 0) {
    return { coefficients: [0, 0], r2: 0, predict: () => 0 }
  }

  // Filter out non-positive y values (can't take log of 0 or negative)
  const validX: number[] = []
  const logY: number[] = []
  for (let i = 0; i < n; i++) {
    if (y[i]! > 0) {
      validX.push(x[i]!)
      logY.push(Math.log(y[i]!))
    }
  }

  if (validX.length < 2) {
    return { coefficients: [1, 0], r2: 0, predict: () => 1 }
  }

  // Linear regression on x vs ln(y): ln(y) = ln(a) + b*x
  const lin = linearRegression(validX, logY)
  const a = Math.exp(lin.coefficients[0]!)
  const b = lin.coefficients[1]!

  const predictFn = (xi: number): number => a * Math.exp(b * xi)
  const predicted = x.map(predictFn)
  const r2 = computeR2(y, predicted)

  return { coefficients: [a, b], r2, predict: predictFn }
}

// ---------- Logarithmic regression: y = a + b * ln(x) ----------

export function logarithmicRegression(x: number[], y: number[]): RegressionResult {
  const n = x.length
  if (n === 0) {
    return { coefficients: [0, 0], r2: 0, predict: () => 0 }
  }

  // Filter out non-positive x values
  const logX: number[] = []
  const validY: number[] = []
  for (let i = 0; i < n; i++) {
    if (x[i]! > 0) {
      logX.push(Math.log(x[i]!))
      validY.push(y[i]!)
    }
  }

  if (logX.length < 2) {
    return { coefficients: [0, 0], r2: 0, predict: () => 0 }
  }

  // Linear regression on ln(x) vs y: y = a + b*ln(x)
  const lin = linearRegression(logX, validY)
  const a = lin.coefficients[0]!
  const b = lin.coefficients[1]!

  const predictFn = (xi: number): number => a + b * Math.log(xi)
  const predicted = x.map(predictFn)
  const r2 = computeR2(y, predicted)

  return { coefficients: [a, b], r2, predict: predictFn }
}

// ---------- Power regression: y = a * x^b ----------

export function powerRegression(x: number[], y: number[]): RegressionResult {
  const n = x.length
  if (n === 0) {
    return { coefficients: [0, 0], r2: 0, predict: () => 0 }
  }

  // Filter out non-positive x or y values
  const logX: number[] = []
  const logY: number[] = []
  for (let i = 0; i < n; i++) {
    if (x[i]! > 0 && y[i]! > 0) {
      logX.push(Math.log(x[i]!))
      logY.push(Math.log(y[i]!))
    }
  }

  if (logX.length < 2) {
    return { coefficients: [1, 0], r2: 0, predict: () => 1 }
  }

  // Linear regression on ln(x) vs ln(y): ln(y) = ln(a) + b*ln(x)
  const lin = linearRegression(logX, logY)
  const a = Math.exp(lin.coefficients[0]!)
  const b = lin.coefficients[1]!

  const predictFn = (xi: number): number => a * Math.pow(xi, b)
  const predicted = x.map(predictFn)
  const r2 = computeR2(y, predicted)

  return { coefficients: [a, b], r2, predict: predictFn }
}

// ---------- Trend line convenience ----------

export function trendLine(
  values: number[],
  type: 'linear' | 'polynomial' | 'exponential' | 'logarithmic' | 'power' = 'linear',
  options?: { degree?: number; name?: string; color?: string; style?: 'dashed' | 'dotted' | 'solid' },
): Series {
  const x = values.map((_, i) => i)
  const y = values

  let regression: RegressionResult
  switch (type) {
    case 'polynomial':
      regression = polynomialRegression(x, y, options?.degree ?? 2)
      break
    case 'exponential':
      regression = exponentialRegression(x, y)
      break
    case 'logarithmic':
      // Shift x by 1 to avoid ln(0)
      regression = logarithmicRegression(x.map(v => v + 1), y)
      break
    case 'power':
      // Shift x by 1 to avoid 0^b
      regression = powerRegression(x.map(v => v + 1), y)
      break
    default:
      regression = linearRegression(x, y)
      break
  }

  const predicted = x.map(xi => {
    if (type === 'logarithmic' || type === 'power') {
      return regression.predict(xi + 1)
    }
    return regression.predict(xi)
  })

  return {
    name: options?.name ?? `${type} trend`,
    values: predicted,
    color: options?.color,
    style: options?.style ?? 'dashed',
  }
}

// ---------- Forecast ----------

export function forecast(
  regression: RegressionResult,
  fromX: number,
  steps: number,
  stepSize: number = 1,
): { x: number[]; y: number[] } {
  const xValues: number[] = []
  const yValues: number[] = []

  for (let i = 0; i < steps; i++) {
    const xi = fromX + i * stepSize
    xValues.push(xi)
    yValues.push(regression.predict(xi))
  }

  return { x: xValues, y: yValues }
}
