import { createConvenience } from '../api/factory'
import { radialBarChartType } from '../charts/radialbar/radialbar-type'

export const RadialBar = createConvenience(radialBarChartType)
export { radialBarChartType }
export * from './shared'
