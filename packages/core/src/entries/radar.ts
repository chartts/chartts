import { createConvenience } from '../api/factory'
import { radarChartType } from '../charts/radar/radar-type'

export const Radar = createConvenience(radarChartType)
export { radarChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
