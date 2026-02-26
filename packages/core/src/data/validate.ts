import type { ChartData } from '../types'

export class CharttsError extends Error {
  constructor(message: string) {
    super(`[chartts] ${message}`)
    this.name = 'CharttsError'
  }
}

export function validateData(data: ChartData): void {
  if (!data) {
    throw new CharttsError('No data provided. Pass { series: [{ name, values }] }')
  }

  if (!Array.isArray(data.series) || data.series.length === 0) {
    throw new CharttsError('data.series must be a non-empty array.')
  }

  const len = data.series[0]!.values.length

  for (let i = 0; i < data.series.length; i++) {
    const s = data.series[i]!

    if (!s.name || typeof s.name !== 'string') {
      throw new CharttsError(`series[${i}].name must be a non-empty string.`)
    }

    if (!Array.isArray(s.values)) {
      throw new CharttsError(`series[${i}] ("${s.name}").values must be an array.`)
    }

    if (s.values.length !== len) {
      throw new CharttsError(
        `Series length mismatch: "${data.series[0]!.name}" has ${len} values ` +
        `but "${s.name}" has ${s.values.length}. All series must have equal length.`,
      )
    }

    for (let j = 0; j < s.values.length; j++) {
      if (typeof s.values[j] !== 'number' || !Number.isFinite(s.values[j]!)) {
        throw new CharttsError(
          `series[${i}] ("${s.name}").values[${j}] must be a finite number. ` +
          `Got: ${JSON.stringify(s.values[j])}`,
        )
      }
    }
  }

  if (data.labels && data.labels.length !== len) {
    throw new CharttsError(
      `labels has ${data.labels.length} entries but series have ${len} values. They must match.`,
    )
  }
}
