import { createConvenience } from '../api/factory'
import { baselineChartType } from '../charts/baseline/baseline-type'

export const Baseline = createConvenience(baselineChartType)
export { baselineChartType }
export * from './shared'
