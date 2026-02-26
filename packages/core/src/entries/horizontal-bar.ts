import { createConvenience } from '../api/factory'
import { horizontalBarChartType } from '../charts/bar/horizontal-bar-type'

export const HorizontalBar = createConvenience(horizontalBarChartType)
export { horizontalBarChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
