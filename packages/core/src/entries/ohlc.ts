import { createConvenience } from '../api/factory'
import { ohlcChartType } from '../charts/ohlc/ohlc-type'

export const OHLC = createConvenience(ohlcChartType)
export { ohlcChartType }
export type { OHLCOptions } from '../charts/ohlc/ohlc-type'
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
