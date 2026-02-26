import { createConvenience } from '../api/factory'
import { stepChartType } from '../charts/step/step-type'

export const Step = createConvenience(stepChartType)
export { stepChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
