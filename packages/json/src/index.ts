import type { ChartData, Series } from '@chartts/core'

export interface FromJSONOptions {
  /** Key to use as labels. Default: auto-detect first string-valued key */
  labelKey?: string
  /** Keys to use as series. Default: all numeric-valued keys */
  seriesKeys?: string[]
}

export type ToJSONFormat = 'rows' | 'columnar'

export interface ToJSONOptions {
  /** Output format. Default: 'rows' (array of objects) */
  format?: ToJSONFormat
}

function isChartData(input: unknown): input is ChartData {
  if (typeof input !== 'object' || input === null) return false
  const obj = input as Record<string, unknown>
  return Array.isArray(obj['series']) &&
    obj['series'].length > 0 &&
    typeof (obj['series'] as Record<string, unknown>[])[0]?.['name'] === 'string' &&
    Array.isArray((obj['series'] as Record<string, unknown>[])[0]?.['values'])
}

function isColumnar(input: Record<string, unknown>): boolean {
  const values = Object.values(input)
  return values.length > 0 && values.every(v => Array.isArray(v))
}

function isNumericArray(arr: unknown[]): boolean {
  return arr.length > 0 && arr.every(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v))))
}

export function fromJSON(input: string | unknown, options?: FromJSONOptions): ChartData {
  const data = typeof input === 'string' ? JSON.parse(input) as unknown : input

  // Direct ChartData passthrough
  if (isChartData(data)) return data as ChartData

  // Array of objects: [{month:"Jan", sales:10}, ...]
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
    return fromRowArray(data as Record<string, unknown>[], options)
  }

  // Columnar: {labels:["Jan"], sales:[10], costs:[5]}
  if (typeof data === 'object' && data !== null && !Array.isArray(data) && isColumnar(data as Record<string, unknown>)) {
    return fromColumnar(data as Record<string, unknown[]>, options)
  }

  throw new Error('Unrecognized JSON shape. Expected array of objects, columnar object, or ChartData.')
}

function fromRowArray(rows: Record<string, unknown>[], options?: FromJSONOptions): ChartData {
  if (rows.length === 0) return { series: [] }

  const keys = Object.keys(rows[0]!)

  // Determine label key
  let labelKey = options?.labelKey
  if (!labelKey) {
    // Auto-detect: first key whose values are not all numbers
    labelKey = keys.find(k =>
      rows.some(row => typeof row[k] === 'string' && isNaN(Number(row[k])))
    ) ?? keys[0]!
  }

  // Determine series keys
  let seriesKeys = options?.seriesKeys
  if (!seriesKeys) {
    seriesKeys = keys.filter(k => {
      if (k === labelKey) return false
      return rows.every(row => {
        const v = row[k]
        return typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v))) || v == null
      })
    })
  }

  const labels = rows.map(row => String(row[labelKey!] ?? ''))
  const series: Series[] = seriesKeys.map(key => ({
    name: key,
    values: rows.map(row => {
      const v = row[key]
      if (v == null) return 0
      return typeof v === 'number' ? v : Number(v)
    }),
  }))

  return { labels, series }
}

function fromColumnar(data: Record<string, unknown[]>, options?: FromJSONOptions): ChartData {
  const keys = Object.keys(data)

  let labelKey = options?.labelKey
  if (!labelKey) {
    // Auto-detect: 'labels' key, or first non-numeric array
    labelKey = keys.find(k => k === 'labels')
      ?? keys.find(k => !isNumericArray(data[k]!))
      ?? keys[0]!
  }

  let seriesKeys = options?.seriesKeys
  if (!seriesKeys) {
    seriesKeys = keys.filter(k => k !== labelKey && isNumericArray(data[k]!))
  }

  const labels = (data[labelKey] ?? []).map(v => String(v))
  const series: Series[] = seriesKeys.map(key => ({
    name: key,
    values: (data[key] ?? []).map(v => Number(v)),
  }))

  return { labels, series }
}

export function toJSON(data: ChartData, options?: ToJSONOptions): unknown {
  const format = options?.format ?? 'rows'

  if (format === 'columnar') {
    const result: Record<string, unknown[]> = {}
    if (data.labels) {
      result['labels'] = data.labels.map(l => l instanceof Date ? l.toISOString() : l)
    }
    for (const s of data.series) {
      result[s.name] = [...s.values]
    }
    return result
  }

  // rows format: array of objects
  const rowCount = data.series[0]?.values.length ?? 0
  const rows: Record<string, unknown>[] = []
  for (let i = 0; i < rowCount; i++) {
    const row: Record<string, unknown> = {}
    if (data.labels) {
      const label = data.labels[i]
      row['label'] = label instanceof Date ? label.toISOString() : label
    }
    for (const s of data.series) {
      row[s.name] = s.values[i]
    }
    rows.push(row)
  }
  return rows
}
