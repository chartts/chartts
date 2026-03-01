import { createConvenience } from '../api/factory'
import { lollipopChartType } from '../charts/lollipop/lollipop-type'

export const Lollipop = createConvenience(lollipopChartType)
export { lollipopChartType }
export * from './shared'
