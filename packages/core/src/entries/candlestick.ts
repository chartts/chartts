import { createConvenience } from '../api/factory'
import { candlestickChartType } from '../charts/candlestick/candlestick-type'

export const Candlestick = createConvenience(candlestickChartType)
export { candlestickChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
