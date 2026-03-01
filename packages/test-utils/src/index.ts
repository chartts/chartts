import type { ChartData, Series, ChartTypePlugin, ChartOptions } from '@chartts/core'
import { renderToString } from '@chartts/core'

// ============================================================
// Deterministic PRNG (Linear Congruential Generator)
// ============================================================

class PRNG {
  private state: number

  constructor(seed: number = 42) {
    this.state = seed
  }

  /** Returns a float in [0, 1) */
  next(): number {
    // LCG parameters (Numerical Recipes)
    this.state = (this.state * 1664525 + 1013904223) & 0xffffffff
    return (this.state >>> 0) / 0x100000000
  }

  /** Returns an integer in [min, max] inclusive */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  /** Returns a float in [min, max) */
  float(min: number, max: number): number {
    return this.next() * (max - min) + min
  }

  /** Returns one of the elements */
  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)]!
  }
}

// ============================================================
// Label generators
// ============================================================

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function generateLabels(type: 'months' | 'days' | 'categories' | 'numbers', count: number): string[] {
  switch (type) {
    case 'months': {
      const labels: string[] = []
      for (let i = 0; i < count; i++) {
        labels.push(MONTH_LABELS[i % 12]!)
      }
      return labels
    }
    case 'days': {
      const labels: string[] = []
      for (let i = 0; i < count; i++) {
        labels.push(DAY_LABELS[i % 7]!)
      }
      return labels
    }
    case 'categories': {
      const labels: string[] = []
      for (let i = 0; i < count; i++) {
        labels.push(`Category ${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i / 26) : ''}`)
      }
      return labels
    }
    case 'numbers': {
      return Array.from({ length: count }, (_, i) => String(i + 1))
    }
  }
}

const DEFAULT_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
]

const DEFAULT_NAMES = [
  'Series A', 'Series B', 'Series C', 'Series D', 'Series E',
  'Series F', 'Series G', 'Series H', 'Series I', 'Series J',
]

// ============================================================
// Mock data generators
// ============================================================

export function mockChartData(options?: {
  series?: number
  points?: number
  labels?: 'months' | 'days' | 'categories' | 'numbers'
  range?: [number, number]
  names?: string[]
}): ChartData {
  const numSeries = options?.series ?? 3
  const numPoints = options?.points ?? 12
  const labelType = options?.labels ?? 'months'
  const [lo, hi] = options?.range ?? [0, 100]
  const names = options?.names

  const rng = new PRNG(42)
  const labels = generateLabels(labelType, numPoints)
  const series: Series[] = []

  for (let s = 0; s < numSeries; s++) {
    const values: number[] = []
    for (let p = 0; p < numPoints; p++) {
      values.push(Math.round(rng.float(lo, hi) * 100) / 100)
    }
    series.push({
      name: names?.[s] ?? DEFAULT_NAMES[s % DEFAULT_NAMES.length]!,
      values,
      color: DEFAULT_COLORS[s % DEFAULT_COLORS.length]!,
    })
  }

  return { labels, series }
}

export function mockTimeSeries(options?: {
  points?: number
  start?: Date
  interval?: 'hour' | 'day' | 'week' | 'month'
  series?: number
  trend?: 'up' | 'down' | 'flat' | 'random'
  volatility?: number
  names?: string[]
}): ChartData {
  const numPoints = options?.points ?? 30
  const startDate = options?.start ?? new Date('2024-01-01')
  const interval = options?.interval ?? 'day'
  const numSeries = options?.series ?? 1
  const trend = options?.trend ?? 'random'
  const volatility = options?.volatility ?? 5
  const names = options?.names

  const rng = new PRNG(42)

  const intervalMs: Record<string, number> = {
    hour: 3600000,
    day: 86400000,
    week: 604800000,
    month: 2592000000,
  }

  const labels: string[] = []
  const ms = intervalMs[interval]!
  for (let i = 0; i < numPoints; i++) {
    const d = new Date(startDate.getTime() + i * ms)
    if (interval === 'hour') {
      labels.push(`${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`)
    } else {
      labels.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    }
  }

  const trendSlope: Record<string, number> = {
    up: 0.5,
    down: -0.5,
    flat: 0,
    random: 0,
  }

  const series: Series[] = []
  for (let s = 0; s < numSeries; s++) {
    const values: number[] = []
    let value = 50 + rng.float(-10, 10)
    for (let p = 0; p < numPoints; p++) {
      value += trendSlope[trend]! + rng.float(-volatility, volatility)
      values.push(Math.round(value * 100) / 100)
    }
    series.push({
      name: names?.[s] ?? DEFAULT_NAMES[s % DEFAULT_NAMES.length]!,
      values,
      color: DEFAULT_COLORS[s % DEFAULT_COLORS.length]!,
    })
  }

  return { labels, series }
}

export function mockCategories(options?: {
  categories?: number
  series?: number
  range?: [number, number]
  names?: string[]
  categoryPrefix?: string
}): ChartData {
  const numCategories = options?.categories ?? 6
  const numSeries = options?.series ?? 2
  const [lo, hi] = options?.range ?? [0, 100]
  const names = options?.names
  const prefix = options?.categoryPrefix ?? 'Category'

  const rng = new PRNG(42)
  const labels: string[] = []
  for (let i = 0; i < numCategories; i++) {
    labels.push(`${prefix} ${String.fromCharCode(65 + (i % 26))}`)
  }

  const series: Series[] = []
  for (let s = 0; s < numSeries; s++) {
    const values: number[] = []
    for (let p = 0; p < numCategories; p++) {
      values.push(Math.round(rng.float(lo, hi) * 100) / 100)
    }
    series.push({
      name: names?.[s] ?? DEFAULT_NAMES[s % DEFAULT_NAMES.length]!,
      values,
      color: DEFAULT_COLORS[s % DEFAULT_COLORS.length]!,
    })
  }

  return { labels, series }
}

export function mockPieData(options?: {
  slices?: number
  names?: string[]
}): ChartData {
  const numSlices = options?.slices ?? 5
  const names = options?.names

  const rng = new PRNG(42)

  // Generate random weights, then normalize to sum to ~100
  const raw: number[] = []
  let total = 0
  for (let i = 0; i < numSlices; i++) {
    const v = rng.float(1, 10)
    raw.push(v)
    total += v
  }

  const values = raw.map(v => Math.round((v / total) * 100 * 100) / 100)
  // Adjust last value so sum is exactly 100
  const currentSum = values.reduce((s, v) => s + v, 0)
  values[values.length - 1] = Math.round((values[values.length - 1]! + (100 - currentSum)) * 100) / 100

  const labels: string[] = []
  for (let i = 0; i < numSlices; i++) {
    labels.push(names?.[i] ?? `Slice ${String.fromCharCode(65 + (i % 26))}`)
  }

  return {
    labels,
    series: [{
      name: 'Values',
      values,
      color: DEFAULT_COLORS[0],
    }],
  }
}

export function mockFinancialData(options?: {
  points?: number
  startPrice?: number
  volatility?: number
}): ChartData {
  const numPoints = options?.points ?? 60
  const startPrice = options?.startPrice ?? 100
  const volatility = options?.volatility ?? 2

  const rng = new PRNG(42)

  const labels: string[] = []
  const open: number[] = []
  const high: number[] = []
  const low: number[] = []
  const close: number[] = []
  const volume: number[] = []

  let price = startPrice
  const baseDate = new Date('2024-01-01')

  for (let i = 0; i < numPoints; i++) {
    const d = new Date(baseDate.getTime() + i * 86400000)
    labels.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)

    const o = Math.round(price * 100) / 100
    const change1 = rng.float(-volatility, volatility)
    const change2 = rng.float(-volatility, volatility)
    const change3 = rng.float(-volatility, volatility)

    const c = Math.round((price + change1) * 100) / 100
    const h = Math.round(Math.max(o, c, o + Math.abs(change2)) * 100) / 100
    const l = Math.round(Math.min(o, c, o - Math.abs(change3)) * 100) / 100
    const v = rng.int(100000, 10000000)

    open.push(o)
    high.push(h)
    low.push(l)
    close.push(c)
    volume.push(v)

    price = c + rng.float(-volatility * 0.5, volatility * 0.5)
    if (price < 1) price = 1
  }

  return {
    labels,
    series: [
      { name: 'Open', values: open, color: DEFAULT_COLORS[0] },
      { name: 'High', values: high, color: DEFAULT_COLORS[2] },
      { name: 'Low', values: low, color: DEFAULT_COLORS[3] },
      { name: 'Close', values: close, color: DEFAULT_COLORS[1] },
      { name: 'Volume', values: volume, color: DEFAULT_COLORS[4] },
    ],
  }
}

// ============================================================
// Validators
// ============================================================

export function validateChartData(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Data must be a non-null object'] }
  }

  const obj = data as Record<string, unknown>

  if (!('series' in obj)) {
    errors.push('Data must have a "series" property')
    return { valid: false, errors }
  }

  if (!Array.isArray(obj.series)) {
    errors.push('"series" must be an array')
    return { valid: false, errors }
  }

  if (obj.series.length === 0) {
    errors.push('"series" must contain at least one series')
  }

  for (let i = 0; i < obj.series.length; i++) {
    const s = obj.series[i]
    if (!s || typeof s !== 'object') {
      errors.push(`series[${i}] must be an object`)
      continue
    }

    const series = s as Record<string, unknown>

    if (typeof series.name !== 'string') {
      errors.push(`series[${i}].name must be a string`)
    }

    if (!Array.isArray(series.values)) {
      errors.push(`series[${i}].values must be an array`)
    } else {
      for (let j = 0; j < series.values.length; j++) {
        if (typeof series.values[j] !== 'number') {
          errors.push(`series[${i}].values[${j}] must be a number, got ${typeof series.values[j]}`)
        }
      }
    }

    if (series.color !== undefined && typeof series.color !== 'string') {
      errors.push(`series[${i}].color must be a string if provided`)
    }

    if (series.style !== undefined && !['solid', 'dashed', 'dotted'].includes(series.style as string)) {
      errors.push(`series[${i}].style must be 'solid', 'dashed', or 'dotted' if provided`)
    }
  }

  if ('labels' in obj && obj.labels !== undefined) {
    if (!Array.isArray(obj.labels)) {
      errors.push('"labels" must be an array if provided')
    }
  }

  return { valid: errors.length === 0, errors }
}

export function assertChartData(data: unknown): asserts data is ChartData {
  const result = validateChartData(data)
  if (!result.valid) {
    throw new Error(`Invalid ChartData: ${result.errors.join('; ')}`)
  }
}

export function assertSeries(series: unknown): asserts series is Series {
  const errors: string[] = []

  if (!series || typeof series !== 'object') {
    throw new Error('Series must be a non-null object')
  }

  const s = series as Record<string, unknown>

  if (typeof s.name !== 'string') {
    errors.push('series.name must be a string')
  }

  if (!Array.isArray(s.values)) {
    errors.push('series.values must be an array')
  } else {
    for (let i = 0; i < s.values.length; i++) {
      if (typeof s.values[i] !== 'number') {
        errors.push(`series.values[${i}] must be a number`)
      }
    }
  }

  if (s.color !== undefined && typeof s.color !== 'string') {
    errors.push('series.color must be a string if provided')
  }

  if (s.style !== undefined && !['solid', 'dashed', 'dotted'].includes(s.style as string)) {
    errors.push("series.style must be 'solid', 'dashed', or 'dotted' if provided")
  }

  if (errors.length > 0) {
    throw new Error(`Invalid Series: ${errors.join('; ')}`)
  }
}

// ============================================================
// Snapshot helpers
// ============================================================

export function renderChartToString(
  type: ChartTypePlugin,
  data: ChartData,
  options?: ChartOptions & { width?: number; height?: number },
): string {
  return renderToString(type, data, options ?? {})
}

export function chartSnapshot(
  type: ChartTypePlugin,
  data: ChartData,
  options?: ChartOptions,
): { svg: string; data: ChartData; options: ChartOptions } {
  const opts = options ?? {}
  const svg = renderToString(type, data, opts)
  return { svg, data, options: opts }
}

// ============================================================
// Comparison helpers
// ============================================================

export function compareChartData(a: ChartData, b: ChartData): { equal: boolean; differences: string[] } {
  const differences: string[] = []

  // Compare labels
  const labelsA = a.labels ?? []
  const labelsB = b.labels ?? []
  if (labelsA.length !== labelsB.length) {
    differences.push(`Label count differs: ${labelsA.length} vs ${labelsB.length}`)
  } else {
    for (let i = 0; i < labelsA.length; i++) {
      if (String(labelsA[i]) !== String(labelsB[i])) {
        differences.push(`Label[${i}] differs: "${labelsA[i]}" vs "${labelsB[i]}"`)
      }
    }
  }

  // Compare series count
  if (a.series.length !== b.series.length) {
    differences.push(`Series count differs: ${a.series.length} vs ${b.series.length}`)
  } else {
    for (let s = 0; s < a.series.length; s++) {
      const sa = a.series[s]!
      const sb = b.series[s]!

      if (sa.name !== sb.name) {
        differences.push(`Series[${s}].name differs: "${sa.name}" vs "${sb.name}"`)
      }

      if (sa.color !== sb.color) {
        differences.push(`Series[${s}].color differs: "${sa.color}" vs "${sb.color}"`)
      }

      if (sa.style !== sb.style) {
        differences.push(`Series[${s}].style differs: "${sa.style}" vs "${sb.style}"`)
      }

      if (sa.values.length !== sb.values.length) {
        differences.push(`Series[${s}].values length differs: ${sa.values.length} vs ${sb.values.length}`)
      } else {
        for (let v = 0; v < sa.values.length; v++) {
          if (sa.values[v] !== sb.values[v]) {
            differences.push(`Series[${s}].values[${v}] differs: ${sa.values[v]} vs ${sb.values[v]}`)
          }
        }
      }
    }
  }

  return { equal: differences.length === 0, differences }
}
