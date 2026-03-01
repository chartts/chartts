import { createConvenience } from '../api/factory'
import { funnelChartType } from '../charts/funnel/funnel-type'

export const Funnel = createConvenience(funnelChartType)
export { funnelChartType }
export * from './shared'
