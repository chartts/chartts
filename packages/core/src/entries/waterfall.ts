import { createConvenience } from '../api/factory'
import { waterfallChartType } from '../charts/waterfall/waterfall-type'

export const Waterfall = createConvenience(waterfallChartType)
export { waterfallChartType }
export * from './shared'
