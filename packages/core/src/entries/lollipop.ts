import { createConvenience } from '../api/factory'
import { lollipopChartType } from '../charts/lollipop/lollipop-type'

export const Lollipop = createConvenience(lollipopChartType)
export { lollipopChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
