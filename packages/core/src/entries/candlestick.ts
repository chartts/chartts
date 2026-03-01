import { createConvenience } from '../api/factory'
import { candlestickChartType } from '../charts/candlestick/candlestick-type'

export const Candlestick = createConvenience(candlestickChartType)
export { candlestickChartType }
export * from './shared'
