import { createConvenience } from '../api/factory'
import { violinChartType } from '../charts/violin/violin-type'

export const Violin = createConvenience(violinChartType)
export { violinChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
