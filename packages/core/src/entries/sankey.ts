import { createConvenience } from '../api/factory'
import { sankeyChartType } from '../charts/sankey/sankey-type'

export const Sankey = createConvenience(sankeyChartType)
export { sankeyChartType }
export * from './shared'
