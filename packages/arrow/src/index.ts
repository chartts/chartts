import type { ChartData, Series } from '@chartts/core'
import { Table, tableFromIPC, tableToIPC, tableFromArrays } from 'apache-arrow'

export interface FromArrowOptions {
  /** Which column to use as labels (column name) */
  labelColumn?: string
  /** Which columns to use as series (column names). Default: all numeric columns */
  seriesColumns?: string[]
}

export interface ToArrowOptions {
  /** Label column name in the Arrow table. Default: 'label' */
  labelColumnName?: string
}

function isNumericType(type: { typeId: number }): boolean {
  // Arrow numeric type IDs: Int=2, Float=3, Decimal=7
  const id = type.typeId
  return id === 2 || id === 3 || id === 7
}

export function fromArrow(input: ArrayBuffer | Uint8Array | Table, options?: FromArrowOptions): ChartData {
  let table: Table
  if (input instanceof Table) {
    table = input
  } else {
    table = tableFromIPC(input)
  }

  if (table.numRows === 0) return { series: [] }

  const fields = table.schema.fields
  const fieldNames = fields.map(f => f.name)

  // Resolve label column
  let labelName = options?.labelColumn
  if (!labelName) {
    labelName = fields.find(f => !isNumericType(f.type))?.name ?? fieldNames[0]!
  }

  // Resolve series columns
  let seriesNames = options?.seriesColumns
  if (!seriesNames) {
    seriesNames = fields
      .filter(f => f.name !== labelName && isNumericType(f.type))
      .map(f => f.name)
  }

  // Extract labels
  const labelCol = table.getChild(labelName)
  const labels: string[] = []
  if (labelCol) {
    for (let i = 0; i < table.numRows; i++) {
      labels.push(String(labelCol.get(i) ?? ''))
    }
  }

  // Extract series
  const series: Series[] = seriesNames.map(name => {
    const col = table.getChild(name)
    const values: number[] = []
    if (col) {
      for (let i = 0; i < table.numRows; i++) {
        const v = col.get(i)
        values.push(typeof v === 'number' ? v : Number(v) || 0)
      }
    }
    return { name, values }
  })

  return { labels, series }
}

export function toArrow(data: ChartData, options?: ToArrowOptions): Table {
  const labelColName = options?.labelColumnName ?? 'label'

  const columns: Record<string, unknown[]> = {}

  if (data.labels) {
    columns[labelColName] = data.labels.map(l => l instanceof Date ? l.toISOString() : String(l))
  }

  for (const s of data.series) {
    columns[s.name] = [...s.values]
  }

  return tableFromArrays(columns as Record<string, readonly unknown[]>)
}

export function toArrowIPC(data: ChartData, options?: ToArrowOptions): Uint8Array {
  const table = toArrow(data, options)
  return tableToIPC(table)
}
