import { createConvenience } from '../api/factory'
import { bulletChartType } from '../charts/bullet/bullet-type'

export const Bullet = createConvenience(bulletChartType)
export { bulletChartType }
export * from './shared'
