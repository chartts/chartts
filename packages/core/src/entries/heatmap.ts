import { createConvenience } from '../api/factory'
import { heatmapChartType } from '../charts/heatmap/heatmap-type'

export const Heatmap = createConvenience(heatmapChartType)
export { heatmapChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
