import { createConvenience } from '../api/factory'
import { treemapChartType } from '../charts/treemap/treemap-type'

export const Treemap = createConvenience(treemapChartType)
export { treemapChartType }
export * from './shared'
