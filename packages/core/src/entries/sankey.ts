import { createConvenience } from '../api/factory'
import { sankeyChartType } from '../charts/sankey/sankey-type'

export const Sankey = createConvenience(sankeyChartType)
export { sankeyChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
