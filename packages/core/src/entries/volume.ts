import { createConvenience } from '../api/factory'
import { volumeChartType } from '../charts/volume/volume-type'

export const Volume = createConvenience(volumeChartType)
export { volumeChartType }
export * from './shared'
