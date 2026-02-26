import { createConvenience } from '../api/factory'
import { bubbleChartType } from '../charts/bubble/bubble-type'

export const Bubble = createConvenience(bubbleChartType)
export { bubbleChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
