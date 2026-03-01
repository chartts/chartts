import { createConvenience } from '../api/factory'
import { heatmapChartType } from '../charts/heatmap/heatmap-type'

export const Heatmap = createConvenience(heatmapChartType)
export { heatmapChartType }
export * from './shared'
