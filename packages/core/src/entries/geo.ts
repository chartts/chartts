import { createConvenience } from '../api/factory'
import { geoChartType } from '../charts/geo/geo-type'

export const Geo = createConvenience(geoChartType)
export { geoChartType }
export { WORLD_SIMPLE } from '../charts/geo/geo-type'
export { WORLD_REGIONS } from '../charts/geo/world-regions'
export type { GeoRegion, GeoOptions } from '../charts/geo/geo-type'
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
