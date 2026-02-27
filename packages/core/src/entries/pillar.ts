import { createConvenience } from '../api/factory'
import { pillarChartType } from '../charts/pillar/pillar-type'

export const Pillar = createConvenience(pillarChartType)
export { pillarChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
