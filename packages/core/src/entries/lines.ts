import { createConvenience } from '../api/factory'
import { linesChartType } from '../charts/lines/lines-type'

export const Lines = createConvenience(linesChartType)
export { linesChartType }
export type { LinesPoint, LinesOptions } from '../charts/lines/lines-type'
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
