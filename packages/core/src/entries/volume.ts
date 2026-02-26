import { createConvenience } from '../api/factory'
import { volumeChartType } from '../charts/volume/volume-type'

export const Volume = createConvenience(volumeChartType)
export { volumeChartType }
export type { VolumeOptions } from '../charts/volume/volume-type'
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
