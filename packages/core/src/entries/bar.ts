import { createConvenience } from '../api/factory'
import { barChartType } from '../charts/bar/bar-type'

export const Bar = createConvenience(barChartType)
export { barChartType }
export * from './shared'
