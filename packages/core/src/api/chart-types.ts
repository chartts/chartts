/**
 * Central registry of all built-in chart types.
 *
 * Adding a new chart type = add ONE entry here.
 * convenience.ts, framework wrappers, and entries all derive from this.
 */
import type { ChartTypePlugin } from '../types'

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
import { geoChartType } from '../charts/geo/geo-type'
import { linesChartType } from '../charts/lines/lines-type'
import { matrixChartType } from '../charts/matrix/matrix-type'
import { customChartType } from '../charts/custom/custom-type'
import { ohlcChartType } from '../charts/ohlc/ohlc-type'
import { stepChartType } from '../charts/step/step-type'
import { volumeChartType } from '../charts/volume/volume-type'
import { rangeChartType } from '../charts/range/range-type'
import { baselineChartType } from '../charts/baseline/baseline-type'
import { kagiChartType } from '../charts/kagi/kagi-type'
import { renkoChartType } from '../charts/renko/renko-type'
import { violinChartType } from '../charts/violin/violin-type'
import { packChartType } from '../charts/pack/pack-type'
import { voronoiChartType } from '../charts/voronoi/voronoi-type'
import { wordcloudChartType } from '../charts/wordcloud/wordcloud-type'
import { pillarChartType } from '../charts/pillar/pillar-type'

/**
 * Map of convenience name -> chart type plugin.
 * Keys are PascalCase names matching the public API (Line, Bar, etc.).
 */
export const CHART_TYPES: Record<string, ChartTypePlugin> = {
  Line: lineChartType,
  Bar: barChartType,
  StackedBar: stackedBarChartType,
  HorizontalBar: horizontalBarChartType,
  Pie: pieChartType,
  Donut: donutChartType,
  Scatter: scatterChartType,
  Sparkline: sparklineChartType,
  Area: areaChartType,
  Radar: radarChartType,
  Bubble: bubbleChartType,
  Candlestick: candlestickChartType,
  Gauge: gaugeChartType,
  Waterfall: waterfallChartType,
  Funnel: funnelChartType,
  Heatmap: heatmapChartType,
  Boxplot: boxplotChartType,
  Histogram: histogramChartType,
  Treemap: treemapChartType,
  Polar: polarChartType,
  RadialBar: radialBarChartType,
  Lollipop: lollipopChartType,
  Bullet: bulletChartType,
  Dumbbell: dumbbellChartType,
  Calendar: calendarChartType,
  Combo: comboChartType,
  Sankey: sankeyChartType,
  Sunburst: sunburstChartType,
  Tree: treeChartType,
  Graph: graphChartType,
  Parallel: parallelChartType,
  ThemeRiver: themeRiverChartType,
  PictorialBar: pictorialBarChartType,
  Chord: chordChartType,
  Geo: geoChartType,
  Lines: linesChartType,
  Matrix: matrixChartType,
  Custom: customChartType,
  OHLC: ohlcChartType,
  Step: stepChartType,
  Volume: volumeChartType,
  Range: rangeChartType,
  Baseline: baselineChartType,
  Kagi: kagiChartType,
  Renko: renkoChartType,
  Violin: violinChartType,
  Pack: packChartType,
  Voronoi: voronoiChartType,
  WordCloud: wordcloudChartType,
  Pillar: pillarChartType,
}

// Re-export individual chart types for direct import
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
}
