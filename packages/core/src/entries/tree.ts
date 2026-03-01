import { createConvenience } from '../api/factory'
import { treeChartType } from '../charts/tree/tree-type'

export const Tree = createConvenience(treeChartType)
export { treeChartType }
export * from './shared'
