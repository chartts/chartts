import { createConvenience } from '../api/factory'
import { comboChartType } from '../charts/combo/combo-type'

export const Combo = createConvenience(comboChartType)
export { comboChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
