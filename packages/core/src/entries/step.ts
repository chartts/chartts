import { createConvenience } from '../api/factory'
import { stepChartType } from '../charts/step/step-type'

export const Step = createConvenience(stepChartType)
export { stepChartType }
export * from './shared'
