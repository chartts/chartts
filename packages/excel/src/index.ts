import type { ChartData, Series } from '@chartts/core'
import * as XLSX from 'xlsx'

export interface FromExcelOptions {
  /** Sheet name or index. Default: 0 (first sheet) */
  sheet?: string | number
  /** Whether the first row contains headers. Default: true */
  headers?: boolean
  /** Cell range to read, e.g. "A1:D10" */
  range?: string
  /** Which column to use as labels (index or header name). Default: first column */
  labelColumn?: number | string
  /** Which columns to use as series (indices or header names). Default: all numeric columns */
  seriesColumns?: (number | string)[]
}

export interface ToExcelOptions {
  /** Sheet name. Default: 'Sheet1' */
  sheetName?: string
}

function getWorksheet(workbook: XLSX.WorkBook, sheet?: string | number): XLSX.WorkSheet {
  let sheetName: string
  if (typeof sheet === 'string') {
    sheetName = sheet
  } else {
    const idx = sheet ?? 0
    sheetName = workbook.SheetNames[idx] ?? workbook.SheetNames[0]!
  }
  const ws = workbook.Sheets[sheetName]
  if (!ws) throw new Error(`Sheet "${sheetName}" not found`)
  return ws
}

function isNumeric(value: unknown): boolean {
  if (typeof value === 'number') return true
  if (typeof value === 'string' && value !== '') return !isNaN(Number(value))
  return false
}

export function fromExcel(buffer: ArrayBuffer | Uint8Array, options?: FromExcelOptions): ChartData {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const ws = getWorksheet(workbook, options?.sheet)

  const readOpts: XLSX.Sheet2JSONOpts = { header: 1, defval: '' }
  if (options?.range) readOpts.range = options.range

  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, readOpts)
  if (raw.length === 0) return { series: [] }

  const hasHeaders = options?.headers ?? true
  const headerRow = hasHeaders ? (raw[0] as unknown[]).map(String) : undefined
  const dataRows = hasHeaders ? raw.slice(1) : raw

  if (dataRows.length === 0) return { series: [] }

  const colCount = (raw[0] as unknown[]).length

  // Resolve label column
  let labelIdx: number
  if (options?.labelColumn != null) {
    if (typeof options.labelColumn === 'string' && headerRow) {
      labelIdx = headerRow.indexOf(options.labelColumn)
      if (labelIdx === -1) labelIdx = 0
    } else {
      labelIdx = Number(options.labelColumn)
    }
  } else {
    labelIdx = 0
    for (let c = 0; c < colCount; c++) {
      if (!isNumeric((dataRows[0] as unknown[])[c])) {
        labelIdx = c
        break
      }
    }
  }

  // Resolve series columns
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
    seriesIndices = []
    for (let c = 0; c < colCount; c++) {
      if (c === labelIdx) continue
      const allNumeric = dataRows.every(row => {
        const val = (row as unknown[])[c]
        return val === '' || val == null || isNumeric(val)
      })
      if (allNumeric) seriesIndices.push(c)
    }
  }

  const labels = dataRows.map(row => String((row as unknown[])[labelIdx] ?? ''))
  const series: Series[] = seriesIndices.map(colIdx => ({
    name: headerRow?.[colIdx] ?? `Column ${colIdx}`,
    values: dataRows.map(row => {
      const val = (row as unknown[])[colIdx]
      if (val == null || val === '') return 0
      return Number(val)
    }),
  }))

  return { labels, series }
}

export function toExcel(data: ChartData, options?: ToExcelOptions): ArrayBuffer {
  const sheetName = options?.sheetName ?? 'Sheet1'

  const aoa: unknown[][] = []

  // Header row
  const header: unknown[] = ['Label', ...data.series.map(s => s.name)]
  aoa.push(header)

  // Data rows
  const rowCount = data.series[0]?.values.length ?? 0
  for (let i = 0; i < rowCount; i++) {
    const label = data.labels?.[i] ?? ''
    const labelVal = label instanceof Date ? label.toISOString() : label
    const row: unknown[] = [labelVal, ...data.series.map(s => s.values[i] ?? 0)]
    aoa.push(row)
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  return out
}
