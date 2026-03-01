import { createConvenience } from '../api/factory'
import { histogramChartType } from '../charts/histogram/histogram-type'

export const Histogram = createConvenience(histogramChartType)
export { histogramChartType }
export * from './shared'
