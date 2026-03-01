import { createConvenience } from '../api/factory'
import { bubbleChartType } from '../charts/bubble/bubble-type'

export const Bubble = createConvenience(bubbleChartType)
export { bubbleChartType }
export * from './shared'
