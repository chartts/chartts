import { createConvenience } from '../api/factory'
import { radarChartType } from '../charts/radar/radar-type'

export const Radar = createConvenience(radarChartType)
export { radarChartType }
export * from './shared'
