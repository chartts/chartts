import { createConvenience } from '../api/factory'
import { gaugeChartType } from '../charts/gauge/gauge-type'

export const Gauge = createConvenience(gaugeChartType)
export { gaugeChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
