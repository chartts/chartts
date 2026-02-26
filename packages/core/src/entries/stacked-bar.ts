import { createConvenience } from '../api/factory'
import { stackedBarChartType } from '../charts/bar/stacked-bar-type'

export const StackedBar = createConvenience(stackedBarChartType)
export { stackedBarChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
