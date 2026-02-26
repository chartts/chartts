import { createConvenience } from '../api/factory'
import { sparklineChartType } from '../charts/sparkline/sparkline-type'

export const Sparkline = createConvenience(sparklineChartType)
export { sparklineChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
