import type { ChartData, Series } from '@chartts/core'

export interface FromCSVOptions {
  /** Column delimiter. Auto-detects tab vs comma if omitted. */
  delimiter?: string
  /** Whether the first row contains headers. Default: true */
  headers?: boolean
  /** Which column to use as labels (index or header name). Default: first column (0) */
  labelColumn?: number | string
  /** Which columns to use as series (indices or header names). Default: all numeric columns */
  seriesColumns?: (number | string)[]
}

export interface ToCSVOptions {
  /** Column delimiter. Default: ',' */
  delimiter?: string
  /** Include a header row. Default: true */
  headers?: boolean
}

function detectDelimiter(text: string): string {
  const firstLine = text.split('\n')[0] ?? ''
  const tabs = (firstLine.match(/\t/g) ?? []).length
  const commas = (firstLine.match(/,/g) ?? []).length
  return tabs > commas ? '\t' : ','
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === delimiter) {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields
}

function isNumeric(value: string): boolean {
  if (value === '') return false
  return !isNaN(Number(value))
}

export function fromCSV(text: string, options?: FromCSVOptions): ChartData {
  const delimiter = options?.delimiter ?? detectDelimiter(text)
  const hasHeaders = options?.headers ?? true

  const lines = text.trim().split(/\r?\n/).filter(l => l.trim() !== '')
  if (lines.length === 0) return { series: [] }

  const rows = lines.map(line => parseCSVLine(line, delimiter))
  const headerRow = hasHeaders ? rows[0]! : undefined
  const dataRows = hasHeaders ? rows.slice(1) : rows

  if (dataRows.length === 0) return { series: [] }

  const colCount = rows[0]!.length

  // Resolve labelColumn index
  let labelIdx: number
  if (options?.labelColumn != null) {
    if (typeof options.labelColumn === 'string' && headerRow) {
      labelIdx = headerRow.indexOf(options.labelColumn)
      if (labelIdx === -1) labelIdx = 0
    } else {
      labelIdx = Number(options.labelColumn)
    }
  } else {
    // Default: first non-numeric column, or column 0
    labelIdx = 0
    if (dataRows.length > 0) {
      for (let c = 0; c < colCount; c++) {
        if (!isNumeric(dataRows[0]![c] ?? '')) {
          labelIdx = c
          break
        }
      }
    }
  }

  // Resolve series column indices
  let seriesIndices: number[]
  if (options?.seriesColumns) {
    seriesIndices = options.seriesColumns.map(col => {
      if (typeof col === 'string' && headerRow) {
        const idx = headerRow.indexOf(col)
        return idx === -1 ? -1 : idx
      }
      return Number(col)
    }).filter(i => i >= 0 && i !== labelIdx)
  } else {
    // Auto-detect: all columns with numeric data (excluding label column)
    seriesIndices = []
    for (let c = 0; c < colCount; c++) {
      if (c === labelIdx) continue
      const allNumeric = dataRows.every(row => {
        const val = row[c] ?? ''
        return val === '' || isNumeric(val)
      })
      if (allNumeric) seriesIndices.push(c)
    }
  }

  const labels = dataRows.map(row => row[labelIdx] ?? '')
  const series: Series[] = seriesIndices.map(colIdx => ({
    name: headerRow?.[colIdx] ?? `Column ${colIdx}`,
    values: dataRows.map(row => {
      const val = row[colIdx] ?? ''
      return val === '' ? 0 : Number(val)
    }),
  }))

  return { labels, series }
}

export function toCSV(data: ChartData, options?: ToCSVOptions): string {
  const delimiter = options?.delimiter ?? ','
  const includeHeaders = options?.headers ?? true

  const lines: string[] = []

  if (includeHeaders) {
    const header = ['Label', ...data.series.map(s => s.name)]
    lines.push(header.map(h => escapeCSVField(h, delimiter)).join(delimiter))
  }

  const rowCount = data.series[0]?.values.length ?? 0
  for (let i = 0; i < rowCount; i++) {
    const label = data.labels?.[i] ?? ''
    const labelStr = label instanceof Date ? label.toISOString() : String(label)
    const values = data.series.map(s => String(s.values[i] ?? ''))
    lines.push([escapeCSVField(labelStr, delimiter), ...values].join(delimiter))
  }

  return lines.join('\n')
}

function escapeCSVField(field: string, delimiter: string): string {
  if (field.includes(delimiter) || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}
