import { createConvenience } from '../api/factory'
import { parallelChartType } from '../charts/parallel/parallel-type'

export const Parallel = createConvenience(parallelChartType)
export { parallelChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
