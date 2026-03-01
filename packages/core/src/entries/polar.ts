import { createConvenience } from '../api/factory'
import { polarChartType } from '../charts/polar/polar-type'

export const Polar = createConvenience(polarChartType)
export { polarChartType }
export * from './shared'
