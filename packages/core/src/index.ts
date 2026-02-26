// Public API
export { Line, Bar, StackedBar, HorizontalBar, Pie, Donut, Scatter, Sparkline, Area, Radar, Bubble, Candlestick, Gauge, Waterfall, Funnel, Heatmap, Boxplot, Histogram, Treemap, Polar, RadialBar, Lollipop, Bullet, Dumbbell, Calendar, Combo, Sankey, Sunburst, Tree, Graph, Parallel, ThemeRiver, PictorialBar, Chord, Geo, Lines, Matrix, Custom, OHLC, Step, Volume, Range, Baseline, Kagi, Renko } from './api/convenience'
export { createChart } from './api/create'

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

// Chart type plugins (for custom registration)
export { lineChartType } from './charts/line/line-type'
export { barChartType } from './charts/bar/bar-type'
export { stackedBarChartType } from './charts/bar/stacked-bar-type'
export { horizontalBarChartType } from './charts/bar/horizontal-bar-type'
export { pieChartType, donutChartType } from './charts/pie/pie-type'
export { scatterChartType } from './charts/scatter/scatter-type'
export { sparklineChartType } from './charts/sparkline/sparkline-type'
export { areaChartType } from './charts/area/area-type'
export { radarChartType } from './charts/radar/radar-type'
export { bubbleChartType } from './charts/bubble/bubble-type'
export { candlestickChartType } from './charts/candlestick/candlestick-type'
export { gaugeChartType } from './charts/gauge/gauge-type'
export { waterfallChartType } from './charts/waterfall/waterfall-type'
export { funnelChartType } from './charts/funnel/funnel-type'
export { heatmapChartType } from './charts/heatmap/heatmap-type'
export { boxplotChartType } from './charts/boxplot/boxplot-type'
export { histogramChartType } from './charts/histogram/histogram-type'
export { treemapChartType } from './charts/treemap/treemap-type'
export { polarChartType } from './charts/polar/polar-type'
export { radialBarChartType } from './charts/radialbar/radialbar-type'
export { lollipopChartType } from './charts/lollipop/lollipop-type'
export { bulletChartType } from './charts/bullet/bullet-type'
export { dumbbellChartType } from './charts/dumbbell/dumbbell-type'
export { calendarChartType } from './charts/calendar/calendar-type'
export { comboChartType } from './charts/combo/combo-type'
export { sankeyChartType } from './charts/sankey/sankey-type'
export { sunburstChartType } from './charts/sunburst/sunburst-type'
export { treeChartType } from './charts/tree/tree-type'
export { graphChartType } from './charts/graph/graph-type'
export { parallelChartType } from './charts/parallel/parallel-type'
export { themeRiverChartType } from './charts/themeriver/themeriver-type'
export { pictorialBarChartType } from './charts/pictorialbar/pictorialbar-type'
export { chordChartType } from './charts/chord/chord-type'
export { geoChartType } from './charts/geo/geo-type'
export { WORLD_SIMPLE } from './charts/geo/geo-type'
export { WORLD_REGIONS } from './charts/geo/world-regions'
export { linesChartType } from './charts/lines/lines-type'
export { matrixChartType } from './charts/matrix/matrix-type'
export { customChartType } from './charts/custom/custom-type'
export { ohlcChartType } from './charts/ohlc/ohlc-type'
export { stepChartType } from './charts/step/step-type'
export { volumeChartType } from './charts/volume/volume-type'
export { rangeChartType } from './charts/range/range-type'
export { baselineChartType } from './charts/baseline/baseline-type'
export { kagiChartType } from './charts/kagi/kagi-type'
export { renkoChartType } from './charts/renko/renko-type'

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
