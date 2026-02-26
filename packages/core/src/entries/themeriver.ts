import { createConvenience } from '../api/factory'
import { themeRiverChartType } from '../charts/themeriver/themeriver-type'

export const ThemeRiver = createConvenience(themeRiverChartType)
export { themeRiverChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
