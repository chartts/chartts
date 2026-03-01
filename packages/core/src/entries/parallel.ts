import { createConvenience } from '../api/factory'
import { parallelChartType } from '../charts/parallel/parallel-type'

export const Parallel = createConvenience(parallelChartType)
export { parallelChartType }
export * from './shared'
