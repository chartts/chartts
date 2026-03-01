import { createConvenience } from '../api/factory'
import { donutChartType } from '../charts/pie/pie-type'

export const Donut = createConvenience(donutChartType)
export { donutChartType }
export * from './shared'
