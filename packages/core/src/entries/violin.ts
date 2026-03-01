import { createConvenience } from '../api/factory'
import { violinChartType } from '../charts/violin/violin-type'

export const Violin = createConvenience(violinChartType)
export { violinChartType }
export * from './shared'
