import { createConvenience } from '../api/factory'
import { voronoiChartType } from '../charts/voronoi/voronoi-type'

export const Voronoi = createConvenience(voronoiChartType)
export { voronoiChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
