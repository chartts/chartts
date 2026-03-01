import { createConvenience } from '../api/factory'
import { comboChartType } from '../charts/combo/combo-type'

export const Combo = createConvenience(comboChartType)
export { comboChartType }
export * from './shared'
