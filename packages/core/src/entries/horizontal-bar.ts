import { createConvenience } from '../api/factory'
import { horizontalBarChartType } from '../charts/bar/horizontal-bar-type'

export const HorizontalBar = createConvenience(horizontalBarChartType)
export { horizontalBarChartType }
export * from './shared'
