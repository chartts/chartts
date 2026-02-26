import { createConvenience } from '../api/factory'
import { treeChartType } from '../charts/tree/tree-type'

export const Tree = createConvenience(treeChartType)
export { treeChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
