import { createConvenience } from '../api/factory'
import { graphChartType } from '../charts/graph/graph-type'

export const Graph = createConvenience(graphChartType)
export { graphChartType }
export { enableGraphDrag } from '../charts/graph/drag'
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
export type { GraphOptions, GraphLayout, LayoutDirection, NodeShape } from '../charts/graph/types'
