import { createConvenience } from '../api/factory'
import { polarChartType } from '../charts/polar/polar-type'

export const Polar = createConvenience(polarChartType)
export { polarChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
