import { createConvenience } from '../api/factory'
import { funnelChartType } from '../charts/funnel/funnel-type'

export const Funnel = createConvenience(funnelChartType)
export { funnelChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
