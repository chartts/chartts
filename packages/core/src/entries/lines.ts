import { createConvenience } from '../api/factory'
import { linesChartType } from '../charts/lines/lines-type'

export const Lines = createConvenience(linesChartType)
export { linesChartType }
export * from './shared'
