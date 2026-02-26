import { createConvenience } from '../api/factory'
import { calendarChartType } from '../charts/calendar/calendar-type'

export const Calendar = createConvenience(calendarChartType)
export { calendarChartType }
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
