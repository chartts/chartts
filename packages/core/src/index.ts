// Core API
export { createChart } from './api/create'
export { defineChartType } from './api/define'
export { createConvenience } from './api/factory'
export type { ChartConfig } from './api/factory'

// SSR — render to SVG string without DOM
export { renderToString } from './render/string'

// Renderers (SVG only — Canvas/WebGL loaded lazily when requested)
export { createSVGRenderer } from './render/svg'

// Render tree builders
export { path, rect, circle, line, text, group, defs, clipPathDef } from './render/tree'

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
