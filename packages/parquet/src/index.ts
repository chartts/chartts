import type { ChartData, Series } from '@chartts/core'
import { parquetRead } from 'hyparquet'

export interface FromParquetOptions {
  /** Which column to use as labels (column name) */
  labelColumn?: string
  /** Which columns to use as series (column names). Default: all numeric columns */
  seriesColumns?: string[]
  /** Maximum number of rows to read */
  rowLimit?: number
}

function isNumeric(value: unknown): boolean {
  return typeof value === 'number' && !isNaN(value)
}

export async function fromParquet(buffer: ArrayBuffer | Uint8Array, options?: FromParquetOptions): Promise<ChartData> {
  let file: ArrayBuffer
  if (buffer instanceof Uint8Array) {
    // Copy into a plain ArrayBuffer (Uint8Array.buffer may be SharedArrayBuffer)
    const copy = new ArrayBuffer(buffer.byteLength)
    new Uint8Array(copy).set(buffer)
    file = copy
  } else {
    file = buffer
  }

  let columns: string[] | undefined
  if (options?.seriesColumns || options?.labelColumn) {
    columns = []
    if (options.labelColumn) columns.push(options.labelColumn)
    if (options.seriesColumns) columns.push(...options.seriesColumns)
  }

  let rows: Record<string, unknown>[] = []

  await parquetRead({
    file,
    rowFormat: 'object',
    columns,
    rowStart: options?.rowLimit ? 0 : undefined,
    rowEnd: options?.rowLimit ?? undefined,
    onComplete(data: Record<string, unknown>[]) {
      rows = data
    },
  })

  if (rows.length === 0) return { series: [] }

  const keys = Object.keys(rows[0]!)

  // Resolve label column
  let labelKey = options?.labelColumn
  if (!labelKey) {
    labelKey = keys.find(k =>
      rows.some(row => !isNumeric(row[k]))
    ) ?? keys[0]!
  }

  // Resolve series columns
  let seriesKeys = options?.seriesColumns
  if (!seriesKeys) {
    seriesKeys = keys.filter(k => {
      if (k === labelKey) return false
      return rows.every(row => {
        const v = row[k]
        return v == null || isNumeric(v)
      })
    })
  }

  const labels = rows.map(row => String(row[labelKey!] ?? ''))
  const series: Series[] = seriesKeys.map(key => ({
    name: key,
    values: rows.map(row => {
      const v = row[key]
      return isNumeric(v) ? (v as number) : 0
    }),
  }))

  return { labels, series }
}
