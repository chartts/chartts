import { createConvenience } from '../api/factory'
import { pieChartType } from '../charts/pie/pie-type'

export const Pie = createConvenience(pieChartType)
export { pieChartType }
export * from './shared'
