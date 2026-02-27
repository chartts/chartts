// Public API
export { Line, Bar, StackedBar, HorizontalBar, Pie, Donut, Scatter, Sparkline, Area, Radar, Bubble, Candlestick, Gauge, Waterfall, Funnel, Heatmap, Boxplot, Histogram, Treemap, Polar, RadialBar, Lollipop, Bullet, Dumbbell, Calendar, Combo, Sankey, Sunburst, Tree, Graph, Parallel, ThemeRiver, PictorialBar, Chord, Geo, Lines, Matrix, Custom, OHLC, Step, Volume, Range, Baseline, Kagi, Renko, Violin, Pack, Voronoi, WordCloud, Pillar } from './api/convenience'
export { createChart } from './api/create'
export { defineChartType } from './api/define'

// SSR — render to SVG string without DOM
export { renderToString } from './render/string'

// Renderers
export { createSVGRenderer } from './render/svg'
export { createCanvasRenderer } from './render/canvas'
export { createWebGLRenderer } from './render/webgl'

// Data decimation
export { decimateData } from './data/decimate'

// Zoom & Pan
export { createZoomPan } from './interaction/zoom-pan'
export type { ZoomPanConfig, ZoomPanState, ZoomPanInstance } from './interaction/zoom-pan'

// Linked Charts
export { linkCharts } from './interaction/link'

// Brush Selection
export { createBrush } from './interaction/brush'
export type { BrushConfig, BrushInstance } from './interaction/brush'

// Realtime Streaming
export { createStreamingChart } from './data/streaming'
export type { StreamingConfig, StreamingInstance } from './data/streaming'

// Chart type plugins — all re-exported from centralized map
export { CHART_TYPES } from './api/chart-types'
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
} from './api/chart-types'
export { WORLD_SIMPLE } from './charts/geo/geo-type'
export { WORLD_REGIONS } from './charts/geo/world-regions'

// Features
export { filterData, filterSeries, filterLabels, sortData, aggregateData, transformData, pivotData, sliceData } from './features/dataset'
export { createDataZoomState, applyDataZoom, renderDataZoomSlider } from './features/datazoom'
export type { DataZoomRange, DataZoomState, DataZoomSliderOptions } from './features/datazoom'
export { createDataZoomWidget } from './features/datazoom-widget'
export type { DataZoomWidgetOptions, DataZoomWidget } from './features/datazoom-widget'
export { createGraphicElements, horizontalLine, verticalLine, annotation } from './features/graphic'
export type { GraphicElement, GraphicArea } from './features/graphic'
export { parseRichText, richLabel } from './features/richtext'
export type { RichTextStyle, RichTextOptions } from './features/richtext'

// Registry
export { registerChart, getChart, registerScale, getScaleFactory, clearRegistry } from './registry/registry'

// Scales
export { createLinearScale } from './scales/linear'
export { createCategoricalScale } from './scales/categorical'
export { createTimeScale } from './scales/time'

// Theme
export { resolveTheme, applyTheme } from './theme/engine'
export { LIGHT_THEME, DARK_THEME, PALETTE, CSS_PREFIX } from './constants'
export { THEME_PRESETS, CORPORATE_THEME, SAAS_THEME, STARTUP_THEME, EDITORIAL_THEME, OCEAN_THEME } from './theme/presets'

// Formatters
export { formatValue, formatPercent } from './utils/format'

// Curve utilities
export { buildLinePath, buildAreaPath, buildLinearPath, buildMonotonePath, buildStepPath } from './utils/curves'
export type { CurveInterpolation, Point as CurvePoint } from './utils/curves'

// Hit test utilities
export { nearestPointHitTest } from './utils/hit-test'

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
} from './finance/index'
export type {
  MACDResult, BollingerResult, StochasticResult, OHLCAggregation,
} from './finance/types'

// Events
export { createEventBus } from './events/bus'

// Debug
export { createDebugPanel } from './debug/debug'

// Types
export type {
  Series, ChartData, DataPoint, PreparedData, PreparedSeries, DataBounds,
  ChartOptions, ResolvedOptions, TooltipConfig, CrosshairConfig, LegendPosition, CurveType,
  ThemeConfig,
  Scale, Tick, ScaleType, ScaleFactory,
  RenderNode, RenderAttrs, Renderer, RendererRoot,
  ChartArea, RenderContext, ChartTypePlugin, HitResult, ChartInstance,
  ChartEvents, EventBus, EventHandler, Unsubscribe,
} from './types'
