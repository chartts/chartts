import { createConvenience } from '../api/factory'
import { areaChartType } from '../charts/area/area-type'

export const Area = createConvenience(areaChartType)
export { areaChartType }
export * from './shared'
