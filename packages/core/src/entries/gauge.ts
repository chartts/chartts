import { createConvenience } from '../api/factory'
import { gaugeChartType } from '../charts/gauge/gauge-type'

export const Gauge = createConvenience(gaugeChartType)
export { gaugeChartType }
export * from './shared'
