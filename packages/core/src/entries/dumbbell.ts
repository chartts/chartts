import { createConvenience } from '../api/factory'
import { dumbbellChartType } from '../charts/dumbbell/dumbbell-type'

export const Dumbbell = createConvenience(dumbbellChartType)
export { dumbbellChartType }
export * from './shared'
