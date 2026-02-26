import { createConvenience } from '../api/factory'
import { pieChartType } from '../charts/pie/pie-type'

export const Pie = createConvenience(pieChartType)
export { pieChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
