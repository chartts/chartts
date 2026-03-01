import { createConvenience } from '../api/factory'
import { packChartType } from '../charts/pack/pack-type'

export const Pack = createConvenience(packChartType)
export { packChartType }
export * from './shared'
