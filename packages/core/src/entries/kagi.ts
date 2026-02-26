import { createConvenience } from '../api/factory'
import { kagiChartType } from '../charts/kagi/kagi-type'

export const Kagi = createConvenience(kagiChartType)
export { kagiChartType }
export type { KagiOptions } from '../charts/kagi/kagi-type'
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
