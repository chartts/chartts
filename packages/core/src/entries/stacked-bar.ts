import { createConvenience } from '../api/factory'
import { stackedBarChartType } from '../charts/bar/stacked-bar-type'

export const StackedBar = createConvenience(stackedBarChartType)
export { stackedBarChartType }
export * from './shared'
