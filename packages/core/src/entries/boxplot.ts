import { createConvenience } from '../api/factory'
import { boxplotChartType } from '../charts/boxplot/boxplot-type'

export const Boxplot = createConvenience(boxplotChartType)
export { boxplotChartType }
export * from './shared'
