import { createConvenience } from '../api/factory'
import { customChartType } from '../charts/custom/custom-type'

export const Custom = createConvenience(customChartType)
export { customChartType }
export * from './shared'
