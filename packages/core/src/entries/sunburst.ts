import { createConvenience } from '../api/factory'
import { sunburstChartType } from '../charts/sunburst/sunburst-type'

export const Sunburst = createConvenience(sunburstChartType)
export { sunburstChartType }
export * from './shared'
