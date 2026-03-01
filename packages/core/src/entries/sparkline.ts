import { createConvenience } from '../api/factory'
import { sparklineChartType } from '../charts/sparkline/sparkline-type'

export const Sparkline = createConvenience(sparklineChartType)
export { sparklineChartType }
export * from './shared'
