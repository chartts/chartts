import { createConvenience } from '../api/factory'
import { chordChartType } from '../charts/chord/chord-type'

export const Chord = createConvenience(chordChartType)
export { chordChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
