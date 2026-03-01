import { createConvenience } from '../api/factory'
import { geoChartType } from '../charts/geo/geo-type'

export const Geo = createConvenience(geoChartType)
export { geoChartType }
export * from './shared'
