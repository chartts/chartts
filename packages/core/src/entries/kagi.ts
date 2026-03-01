import { createConvenience } from '../api/factory'
import { kagiChartType } from '../charts/kagi/kagi-type'

export const Kagi = createConvenience(kagiChartType)
export { kagiChartType }
export * from './shared'
