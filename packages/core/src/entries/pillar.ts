import { createConvenience } from '../api/factory'
import { pillarChartType } from '../charts/pillar/pillar-type'

export const Pillar = createConvenience(pillarChartType)
export { pillarChartType }
export * from './shared'
