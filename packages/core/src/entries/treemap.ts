import { createConvenience } from '../api/factory'
import { treemapChartType } from '../charts/treemap/treemap-type'

export const Treemap = createConvenience(treemapChartType)
export { treemapChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
