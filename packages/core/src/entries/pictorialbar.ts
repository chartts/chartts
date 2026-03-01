import { createConvenience } from '../api/factory'
import { pictorialBarChartType } from '../charts/pictorialbar/pictorialbar-type'

export const PictorialBar = createConvenience(pictorialBarChartType)
export { pictorialBarChartType }
export * from './shared'
