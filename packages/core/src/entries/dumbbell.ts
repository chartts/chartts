import { createConvenience } from '../api/factory'
import { dumbbellChartType } from '../charts/dumbbell/dumbbell-type'

export const Dumbbell = createConvenience(dumbbellChartType)
export { dumbbellChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
