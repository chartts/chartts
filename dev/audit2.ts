import { renderToString } from '../packages/core/src/render/string'
import { sparklineChartType } from '../packages/core/src/charts/sparkline/sparkline-type'
import { candlestickChartType } from '../packages/core/src/charts/candlestick/candlestick-type'

// Check sparkline for axes
const sp = renderToString(sparklineChartType, { labels: [1,2,3,4,5,6,7,8], series: [{ name: 'T', values: [3,7,4,8,2,9,5,11] }] }, { width: 200, height: 50 })
console.log('SPARKLINE has x-axis:', sp.includes('chartts-x-axis'))
console.log('SPARKLINE has y-axis:', sp.includes('chartts-y-axis'))
console.log('SPARKLINE has grid:', sp.includes('chartts-grid'))
console.log()

// Check candlestick
const cs = renderToString(candlestickChartType, { labels: ['Mon','Tue','Wed'], series: [{ name: 'X', values: [10,12,11] }] }, { width: 400, height: 300, ohlc: { open: [9,10,12], high: [13,14,13], low: [8,9,10], close: [10,12,11] } } as any)
console.log('CANDLESTICK has wick:', cs.includes('chartts-wick'))
console.log('CANDLESTICK has candle:', cs.includes('chartts-candle'))

// Show the content section
const start = cs.indexOf('chartts-content')
if (start > -1) {
  console.log('CANDLESTICK content:', cs.substring(start, start + 300))
}
