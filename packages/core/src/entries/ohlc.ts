import { createConvenience } from '../api/factory'
import { ohlcChartType } from '../charts/ohlc/ohlc-type'

export const OHLC = createConvenience(ohlcChartType)
export { ohlcChartType }
export * from './shared'
