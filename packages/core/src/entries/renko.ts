import { createConvenience } from '../api/factory'
import { renkoChartType } from '../charts/renko/renko-type'

export const Renko = createConvenience(renkoChartType)
export { renkoChartType }
export type { RenkoOptions } from '../charts/renko/renko-type'
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
