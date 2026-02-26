import { createConvenience } from '../api/factory'
import { pictorialBarChartType } from '../charts/pictorialbar/pictorialbar-type'

export const PictorialBar = createConvenience(pictorialBarChartType)
export { pictorialBarChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
