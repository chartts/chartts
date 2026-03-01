import { createConvenience } from '../api/factory'
import { scatterChartType } from '../charts/scatter/scatter-type'

export const Scatter = createConvenience(scatterChartType)
export { scatterChartType }
export * from './shared'
