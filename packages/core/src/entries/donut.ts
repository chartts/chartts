import { createConvenience } from '../api/factory'
import { donutChartType } from '../charts/pie/pie-type'

export const Donut = createConvenience(donutChartType)
export { donutChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
