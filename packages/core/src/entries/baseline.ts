import { createConvenience } from '../api/factory'
import { baselineChartType } from '../charts/baseline/baseline-type'

export const Baseline = createConvenience(baselineChartType)
export { baselineChartType }
export type { BaselineOptions } from '../charts/baseline/baseline-type'
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
