import { renderToString } from '../packages/core/src/render/string'
import { lineChartType } from '../packages/core/src/charts/line/line-type'
import { barChartType } from '../packages/core/src/charts/bar/bar-type'
import { pieChartType, donutChartType } from '../packages/core/src/charts/pie/pie-type'
import { scatterChartType } from '../packages/core/src/charts/scatter/scatter-type'
import { sparklineChartType } from '../packages/core/src/charts/sparkline/sparkline-type'
import { areaChartType } from '../packages/core/src/charts/area/area-type'
import { radarChartType } from '../packages/core/src/charts/radar/radar-type'
import { bubbleChartType } from '../packages/core/src/charts/bubble/bubble-type'
import { candlestickChartType } from '../packages/core/src/charts/candlestick/candlestick-type'
import { gaugeChartType } from '../packages/core/src/charts/gauge/gauge-type'
import { waterfallChartType } from '../packages/core/src/charts/waterfall/waterfall-type'
import { funnelChartType } from '../packages/core/src/charts/funnel/funnel-type'
import type { ChartTypePlugin, ChartData } from '../packages/core/src/types'

const W = 400, H = 300

interface AuditItem {
  name: string
  type: ChartTypePlugin
  data: ChartData
  opts: Record<string, unknown>
}

const items: AuditItem[] = [
  { name: 'line-basic', type: lineChartType, data: { labels: ['Jan','Feb','Mar','Apr','May'], series: [{ name: 'Rev', values: [10,25,18,30,22] }] }, opts: { width: W, height: H } },
  { name: 'line-multi', type: lineChartType, data: { labels: ['A','B','C','D'], series: [{ name: 'S1', values: [10,20,15,25] }, { name: 'S2', values: [5,15,10,20] }] }, opts: { width: W, height: H } },
  { name: 'area-basic', type: areaChartType, data: { labels: ['A','B','C','D','E'], series: [{ name: 'Area', values: [10,25,18,30,22] }] }, opts: { width: W, height: H } },
  { name: 'bar-basic', type: barChartType, data: { labels: ['A','B','C','D'], series: [{ name: 'Sales', values: [40,28,42,19] }] }, opts: { width: W, height: H } },
  { name: 'bar-grouped', type: barChartType, data: { labels: ['Q1','Q2','Q3'], series: [{ name: '2024', values: [12,15,18] }, { name: '2025', values: [14,18,21] }] }, opts: { width: W, height: H } },
  { name: 'bar-negative', type: barChartType, data: { labels: ['A','B','C','D'], series: [{ name: 'PnL', values: [25,-10,35,-5] }] }, opts: { width: W, height: H } },
  { name: 'pie-basic', type: pieChartType, data: { labels: ['Chrome','Firefox','Safari','Edge'], series: [{ name: 'Share', values: [65,15,12,8] }] }, opts: { width: W, height: H } },
  { name: 'donut-basic', type: donutChartType, data: { labels: ['A','B','C'], series: [{ name: 'D', values: [50,30,20] }] }, opts: { width: W, height: H } },
  { name: 'scatter-basic', type: scatterChartType, data: { labels: ['A','B','C','D','E'], series: [{ name: 'Pts', values: [12,28,15,32,20] }] }, opts: { width: W, height: H } },
  { name: 'sparkline-basic', type: sparklineChartType, data: { labels: [1,2,3,4,5,6,7,8], series: [{ name: 'T', values: [3,7,4,8,2,9,5,11] }] }, opts: { width: 200, height: 50 } },
  { name: 'radar-basic', type: radarChartType, data: { labels: ['SPD','PWR','DEF','RNG','STL','INT'], series: [{ name: 'A', values: [85,70,90,60,45,75] }, { name: 'B', values: [65,90,50,80,70,85] }] }, opts: { width: W, height: H } },
  { name: 'bubble-basic', type: bubbleChartType, data: { labels: ['A','B','C','D'], series: [{ name: 'M', values: [30,55,42,70] }] }, opts: { width: W, height: H, sizes: [[10,40,25,60]], minRadius: 6, maxRadius: 28 } },
  { name: 'candlestick', type: candlestickChartType, data: { labels: ['Mon','Tue','Wed','Thu','Fri'], series: [{ name: 'AAPL', values: [152,155,148,153,157] }] }, opts: { width: W, height: H, ohlc: { open: [148,152,155,148,153], high: [154,158,156,155,160], low: [146,150,147,146,151], close: [152,155,148,153,157] } } },
  { name: 'gauge-basic', type: gaugeChartType, data: { series: [{ name: 'Score', values: [73] }] }, opts: { width: W, height: H, gaugeMin: 0, gaugeMax: 100 } },
  { name: 'waterfall', type: waterfallChartType, data: { labels: ['Start','Sales','Returns','COGS','Net'], series: [{ name: 'P', values: [1000,450,-120,-280,1050] }] }, opts: { width: W, height: H, totals: [0,4] } },
  { name: 'funnel-basic', type: funnelChartType, data: { labels: ['Visitors','Signups','Activated','Retained'], series: [{ name: 'F', values: [10000,4200,2100,450] }] }, opts: { width: W, height: H } },
]

console.log('=== CHART RENDER AUDIT ===\n')

for (const item of items) {
  try {
    const svg = renderToString(item.type, item.data, item.opts as any)
    const hasPath = svg.includes('<path')
    const hasRect = svg.includes('<rect')
    const hasCircle = svg.includes('<circle')
    const hasLine = svg.includes('<line')
    const hasText = svg.includes('<text')
    const elements = [hasPath && 'path', hasRect && 'rect', hasCircle && 'circle', hasLine && 'line', hasText && 'text'].filter(Boolean).join(', ')

    // Check for NaN/undefined/Infinity in coordinates
    const hasNaN = svg.includes('NaN')
    const hasUndef = svg.includes('undefined')
    const hasInf = svg.includes('Infinity')
    const issues: string[] = []
    if (hasNaN) issues.push('HAS NaN!')
    if (hasUndef) issues.push('HAS undefined!')
    if (hasInf) issues.push('HAS Infinity!')

    // Check for zero-size elements
    const zeroWidth = (svg.match(/width="0"/g) || []).length
    const zeroHeight = (svg.match(/height="0"/g) || []).length
    if (zeroWidth > 1) issues.push(`${zeroWidth} zero-width rects`)
    if (zeroHeight > 1) issues.push(`${zeroHeight} zero-height rects`)

    const status = issues.length > 0 ? 'ISSUES' : 'OK'
    console.log(`${item.name}: ${svg.length} chars [${status}] elements: ${elements}`)
    if (issues.length > 0) console.log(`  -> ${issues.join(', ')}`)

    // Print a snippet of the chart content area
    const contentStart = svg.indexOf('chartts-content')
    if (contentStart > -1) {
      const snippet = svg.substring(contentStart, contentStart + 300)
      console.log(`  content: ...${snippet.substring(0, 200)}...`)
    }
  } catch (e: any) {
    console.log(`${item.name}: ERROR - ${e.message}`)
    console.log(`  stack: ${e.stack?.split('\n')[1]}`)
  }
}
