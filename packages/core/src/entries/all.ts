/**
 * All-in-one entry point.
 * Import from "@chartts/core/all" to get every chart type + convenience function.
 * Warning: this pulls in ALL chart types (~150kb). Use subpath imports for smaller bundles.
 */

// Re-export everything from core
export * from '../index'

// Chart type registry (imports all 55+ chart types)
export { CHART_TYPES } from '../api/chart-types'
export {
  lineChartType, barChartType, stackedBarChartType, horizontalBarChartType,
  pieChartType, donutChartType, scatterChartType, sparklineChartType,
  areaChartType, radarChartType, bubbleChartType, candlestickChartType,
  gaugeChartType, waterfallChartType, funnelChartType, heatmapChartType,
  boxplotChartType, histogramChartType, treemapChartType, polarChartType,
  radialBarChartType, lollipopChartType, bulletChartType, dumbbellChartType,
  calendarChartType, comboChartType, sankeyChartType,
  sunburstChartType, treeChartType, graphChartType, parallelChartType,
  themeRiverChartType, pictorialBarChartType, chordChartType,
  geoChartType, linesChartType, matrixChartType, customChartType,
  ohlcChartType, stepChartType, volumeChartType, rangeChartType,
  baselineChartType, kagiChartType, renkoChartType, violinChartType,
  packChartType, voronoiChartType, wordcloudChartType, pillarChartType,
  ganttChartType, orgChartType, flowChartType, paretoChartType,
} from '../api/chart-types'

// Convenience functions (Line, Bar, etc.)
export {
  Line, Bar, StackedBar, HorizontalBar, Pie, Donut, Scatter, Sparkline, Area,
  Radar, Bubble, Candlestick, Gauge, Waterfall, Funnel, Heatmap, Boxplot,
  Histogram, Treemap, Polar, RadialBar, Lollipop, Bullet, Dumbbell, Calendar,
  Combo, Sankey, Sunburst, Tree, Graph, Parallel, ThemeRiver, PictorialBar,
  Chord, Geo, Lines, Matrix, Custom, OHLC, Step, Volume, Range, Baseline,
  Kagi, Renko, Violin, Pack, Voronoi, WordCloud, Pillar, Gantt, Org, Flow, Pareto,
} from '../api/convenience'

// Geo data
export { WORLD_SIMPLE } from '../charts/geo/geo-type'
export { WORLD_REGIONS } from '../charts/geo/world-regions'

// Financial analysis utilities
export {
  sma, ema, wma,
  rsi, stochastic,
  macd,
  bollingerBands,
  atr,
  vwap, obv,
  simpleReturns, logReturns, cumulativeReturns,
  drawdown, maxDrawdown, sharpeRatio, volatility,
  toOHLC, volumeDirections, toBollingerData, toMACDData,
} from '../finance/index'
export type {
  MACDResult, BollingerResult, StochasticResult, OHLCAggregation,
} from '../finance/types'
