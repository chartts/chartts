import { createConvenience } from '../api/factory'
import { wordcloudChartType } from '../charts/wordcloud/wordcloud-type'

export const WordCloud = createConvenience(wordcloudChartType)
export { wordcloudChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
