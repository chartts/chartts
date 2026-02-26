import { createConvenience } from '../api/factory'
import { rangeChartType } from '../charts/range/range-type'

export const Range = createConvenience(rangeChartType)
export { rangeChartType }
export type { RangeOptions } from '../charts/range/range-type'
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
