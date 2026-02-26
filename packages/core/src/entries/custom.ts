import { createConvenience } from '../api/factory'
import { customChartType } from '../charts/custom/custom-type'

export const Custom = createConvenience(customChartType)
export { customChartType }
export type { CustomChartOptions } from '../charts/custom/custom-type'
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
