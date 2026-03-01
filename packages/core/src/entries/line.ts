import { createConvenience } from '../api/factory'
import { lineChartType } from '../charts/line/line-type'

export const Line = createConvenience(lineChartType)
export { lineChartType }
export * from './shared'
