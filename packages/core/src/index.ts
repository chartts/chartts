// Public API
export { Line, Bar, StackedBar, HorizontalBar, Pie, Donut, Scatter, Sparkline, Area, Radar, Bubble, Candlestick, Gauge, Waterfall, Funnel, Heatmap, Boxplot, Histogram, Treemap, Polar, RadialBar, Lollipop, Bullet, Dumbbell, Calendar, Combo, Sankey, Sunburst, Tree, Graph, Parallel, ThemeRiver, PictorialBar, Chord } from './api/convenience'
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

// Events
export { createEventBus } from './events/bus'

// Debug
export { createDebugPanel } from './debug/debug'

// Types
export type {
  Series, ChartData, DataPoint, PreparedData, PreparedSeries, DataBounds,
  ChartOptions, ResolvedOptions, TooltipConfig, LegendPosition, CurveType,
  ThemeConfig,
  Scale, Tick, ScaleType, ScaleFactory,
  RenderNode, RenderAttrs, Renderer, RendererRoot,
  ChartArea, RenderContext, ChartTypePlugin, HitResult, ChartInstance,
  ChartEvents, EventBus, EventHandler, Unsubscribe,
} from './types'
