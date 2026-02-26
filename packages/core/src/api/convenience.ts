import type { ChartData, ChartOptions, ChartInstance } from '../types'
import { createChart } from './create'
import { lineChartType } from '../charts/line/line-type'
import { barChartType } from '../charts/bar/bar-type'
import { stackedBarChartType } from '../charts/bar/stacked-bar-type'
import { horizontalBarChartType } from '../charts/bar/horizontal-bar-type'
import { pieChartType, donutChartType } from '../charts/pie/pie-type'
import { scatterChartType } from '../charts/scatter/scatter-type'
import { sparklineChartType } from '../charts/sparkline/sparkline-type'
import { areaChartType } from '../charts/area/area-type'
import { radarChartType } from '../charts/radar/radar-type'
import { bubbleChartType } from '../charts/bubble/bubble-type'
import { candlestickChartType } from '../charts/candlestick/candlestick-type'
import { gaugeChartType } from '../charts/gauge/gauge-type'
import { waterfallChartType } from '../charts/waterfall/waterfall-type'
import { funnelChartType } from '../charts/funnel/funnel-type'
import { heatmapChartType } from '../charts/heatmap/heatmap-type'
import { boxplotChartType } from '../charts/boxplot/boxplot-type'
import { histogramChartType } from '../charts/histogram/histogram-type'
import { treemapChartType } from '../charts/treemap/treemap-type'
import { polarChartType } from '../charts/polar/polar-type'
import { radialBarChartType } from '../charts/radialbar/radialbar-type'
import { lollipopChartType } from '../charts/lollipop/lollipop-type'
import { bulletChartType } from '../charts/bullet/bullet-type'
import { dumbbellChartType } from '../charts/dumbbell/dumbbell-type'
import { calendarChartType } from '../charts/calendar/calendar-type'
import { comboChartType } from '../charts/combo/combo-type'
import { sankeyChartType } from '../charts/sankey/sankey-type'
import { sunburstChartType } from '../charts/sunburst/sunburst-type'
import { treeChartType } from '../charts/tree/tree-type'
import { graphChartType } from '../charts/graph/graph-type'
import { parallelChartType } from '../charts/parallel/parallel-type'
import { themeRiverChartType } from '../charts/themeriver/themeriver-type'
import { pictorialBarChartType } from '../charts/pictorialbar/pictorialbar-type'
import { chordChartType } from '../charts/chord/chord-type'

interface ChartConfig extends ChartOptions {
  data: ChartData
  debug?: boolean
}

export function Line(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, lineChartType, data, options)
}

export function Bar(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, barChartType, data, options)
}

export function StackedBar(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, stackedBarChartType, data, options)
}

export function HorizontalBar(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, horizontalBarChartType, data, options)
}

export function Pie(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, pieChartType, data, options)
}

export function Donut(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, donutChartType, data, options)
}

export function Scatter(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, scatterChartType, data, options)
}

export function Sparkline(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, sparklineChartType, data, options)
}

export function Area(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, areaChartType, data, options)
}

export function Radar(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, radarChartType, data, options)
}

export function Bubble(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, bubbleChartType, data, options)
}

export function Candlestick(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, candlestickChartType, data, options)
}

export function Gauge(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, gaugeChartType, data, options)
}

export function Waterfall(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, waterfallChartType, data, options)
}

export function Funnel(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, funnelChartType, data, options)
}

export function Heatmap(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, heatmapChartType, data, options)
}

export function Boxplot(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, boxplotChartType, data, options)
}

export function Histogram(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, histogramChartType, data, options)
}

export function Treemap(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, treemapChartType, data, options)
}

export function Polar(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, polarChartType, data, options)
}

export function RadialBar(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, radialBarChartType, data, options)
}

export function Lollipop(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, lollipopChartType, data, options)
}

export function Bullet(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, bulletChartType, data, options)
}

export function Dumbbell(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, dumbbellChartType, data, options)
}

export function Calendar(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, calendarChartType, data, options)
}

export function Combo(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, comboChartType, data, options)
}

export function Sankey(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, sankeyChartType, data, options)
}

export function Sunburst(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, sunburstChartType, data, options)
}

export function Tree(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, treeChartType, data, options)
}

export function Graph(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, graphChartType, data, options)
}

export function Parallel(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, parallelChartType, data, options)
}

export function ThemeRiver(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, themeRiverChartType, data, options)
}

export function PictorialBar(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, pictorialBarChartType, data, options)
}

export function Chord(target: string | HTMLElement, config: ChartConfig): ChartInstance {
  const { data, ...options } = config
  return createChart(target, chordChartType, data, options)
}
