import { createConvenience } from '../api/factory'
import { radialBarChartType } from '../charts/radialbar/radialbar-type'

export const RadialBar = createConvenience(radialBarChartType)
export { radialBarChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
