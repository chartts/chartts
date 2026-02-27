import { createConvenience } from '../api/factory'
import { packChartType } from '../charts/pack/pack-type'

export const Pack = createConvenience(packChartType)
export { packChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
