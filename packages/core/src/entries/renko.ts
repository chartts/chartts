import { createConvenience } from '../api/factory'
import { renkoChartType } from '../charts/renko/renko-type'

export const Renko = createConvenience(renkoChartType)
export { renkoChartType }
export * from './shared'
