import { createConvenience } from '../api/factory'
import { rangeChartType } from '../charts/range/range-type'

export const Range = createConvenience(rangeChartType)
export { rangeChartType }
export * from './shared'
