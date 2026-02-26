import { createConvenience } from '../api/factory'
import { bulletChartType } from '../charts/bullet/bullet-type'

export const Bullet = createConvenience(bulletChartType)
export { bulletChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
