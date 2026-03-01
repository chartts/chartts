import { createConvenience } from '../api/factory'
import { graphChartType } from '../charts/graph/graph-type'

export const Graph = createConvenience(graphChartType)
export { graphChartType }
export * from './shared'
