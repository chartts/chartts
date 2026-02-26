/**
 * Chartts type definitions.
 *
 * RULES:
 * - This file contains ONLY type/interface declarations and string literal unions.
 * - ZERO runtime code. No functions, no objects, no const values.
 * - This file imports NOTHING from the project.
 * - Every other module in the project can import from here without risk of cycles.
 */

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

/** A single data series */
export interface Series {
  name: string
  values: number[]
  color?: string
  style?: 'solid' | 'dashed' | 'dotted'
  fill?: boolean
  fillOpacity?: number
  showPoints?: boolean
}

/** Data shape users pass to any chart */
export interface ChartData {
  labels?: string[] | number[] | Date[]
  series: Series[]
}

/** Resolved data point for events and tooltips */
export interface DataPoint {
  label: string | number | Date
  value: number
  index: number
  seriesIndex: number
  seriesName: string
}

/** Validated + normalized data ready for rendering */
export interface PreparedData {
  labels: (string | number | Date)[]
  series: PreparedSeries[]
  bounds: DataBounds
}

export interface PreparedSeries {
  name: string
  values: number[]
  color: string
  style: 'solid' | 'dashed' | 'dotted'
  fill: boolean
  fillOpacity: number
  showPoints: boolean
  index: number
}

export interface DataBounds {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export type LegendPosition = 'top' | 'bottom' | 'left' | 'right'
export type CurveType = 'linear' | 'monotone' | 'step'

export interface TooltipConfig {
  enabled?: boolean
  format?: (point: DataPoint) => string
  render?: (point: DataPoint & { color: string }) => string | HTMLElement
}

export interface CrosshairConfig {
  enabled?: boolean
  /** Crosshair line direction. Default 'vertical'. */
  mode?: 'vertical' | 'horizontal' | 'both'
}

/** User-facing chart options. Flat. Every field optional. */
export interface ChartOptions {
  width?: number
  height?: number
  padding?: [number, number, number, number]

  /** Rendering backend. Default 'svg'. 'canvas' for 1k-100k points. 'webgl' for 100k+. 'auto' selects based on data size. */
  renderer?: 'svg' | 'canvas' | 'webgl' | 'auto'

  /** Data decimation for large datasets. True enables auto LTTB. */
  decimate?: boolean | { algorithm?: 'lttb' | 'min-max'; threshold?: number }

  theme?: 'light' | 'dark' | 'auto' | 'corporate' | 'saas' | 'startup' | 'editorial' | 'ocean' | (string & {}) | ThemeConfig

  xLabel?: string
  yLabel?: string
  xFormat?: (value: string | number | Date) => string
  yFormat?: (value: number) => string
  xGrid?: boolean
  yGrid?: boolean
  xAxis?: boolean
  yAxis?: boolean
  xTicks?: number
  yTicks?: number
  yMin?: number
  yMax?: number

  legend?: boolean | LegendPosition
  tooltip?: boolean | TooltipConfig

  animate?: boolean
  duration?: number

  zoom?: boolean
  pan?: boolean
  crosshair?: boolean | CrosshairConfig
  brush?: boolean

  colors?: string[]
  fontFamily?: string
  fontSize?: number
  curve?: CurveType
  barRadius?: number
  barGap?: number

  ariaLabel?: string
  ariaDescription?: string

  onClick?: (point: DataPoint, event: MouseEvent) => void
  onHover?: (point: DataPoint | null, event: MouseEvent) => void

  className?: string
}

/** Fully resolved options — no optional fields except forced y bounds */
export interface ResolvedOptions {
  width: number
  height: number
  padding: [number, number, number, number]
  renderer: 'svg' | 'canvas' | 'webgl' | 'auto'
  theme: string | ThemeConfig

  xLabel: string
  yLabel: string
  xFormat: (value: string | number | Date) => string
  yFormat: (value: number) => string
  xGrid: boolean
  yGrid: boolean
  xAxis: boolean
  yAxis: boolean
  xTicks: number
  yTicks: number
  yMin: number | undefined
  yMax: number | undefined

  legend: false | LegendPosition
  tooltip: false | TooltipConfig

  animate: boolean
  duration: number

  zoom: boolean
  pan: boolean
  crosshair: false | CrosshairConfig
  brush: boolean

  colors: string[]
  fontFamily: string
  fontSize: number
  curve: CurveType
  barRadius: number
  barGap: number

  ariaLabel: string
  ariaDescription: string

  onClick: ChartOptions['onClick']
  onHover: ChartOptions['onHover']

  className: string
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

export interface ThemeConfig {
  colors: string[]
  background: string
  textColor: string
  textMuted: string
  axisColor: string
  gridColor: string
  tooltipBackground: string
  tooltipText: string
  tooltipBorder: string
  fontFamily: string
  fontSize: number
  fontSizeSmall: number
  fontSizeLarge: number
  borderRadius: number
  gridStyle: 'solid' | 'dashed' | 'dotted'
  gridWidth: number
  axisWidth: number
  pointRadius: number
  lineWidth: number
}

// ---------------------------------------------------------------------------
// Scales
// ---------------------------------------------------------------------------

export interface Tick {
  value: number | string | Date
  position: number
  label: string
}

export interface Scale {
  map(value: number | string | Date): number
  invert(pixel: number): number
  ticks(count?: number): Tick[]
  setDomain(min: number | string | Date, max: number | string | Date): void
  setRange(min: number, max: number): void
  getDomain(): [number | string | Date, number | string | Date]
  getRange(): [number, number]
  /** Band width for categorical scales. Returns 0 for continuous scales. */
  bandwidth?(): number
}

export type ScaleType = 'linear' | 'categorical' | 'time' | 'log'

export type ScaleFactory = (config?: {
  domain?: [number | string | Date, number | string | Date]
  range?: [number, number]
  nice?: boolean
  clamp?: boolean
  format?: (value: number | string | Date) => string
}) => Scale

// ---------------------------------------------------------------------------
// Render tree
// ---------------------------------------------------------------------------

export interface RenderAttrs {
  class?: string
  style?: string
  stroke?: string
  strokeWidth?: number
  strokeDasharray?: string
  strokeOpacity?: number
  strokeLinecap?: 'butt' | 'round' | 'square'
  strokeLinejoin?: 'miter' | 'round' | 'bevel'
  fill?: string
  fillOpacity?: number
  opacity?: number
  transform?: string
  clipPath?: string
  filter?: string
  cursor?: string
  pointerEvents?: string
  role?: string
  ariaLabel?: string
  tabindex?: number
  [key: `data-${string}`]: string | number | undefined
}

export type RenderNode =
  | { type: 'group'; children: RenderNode[]; attrs?: RenderAttrs }
  | { type: 'path'; d: string; attrs?: RenderAttrs }
  | {
      type: 'rect'
      x: number
      y: number
      width: number
      height: number
      rx?: number
      ry?: number
      attrs?: RenderAttrs
    }
  | { type: 'circle'; cx: number; cy: number; r: number; attrs?: RenderAttrs }
  | { type: 'line'; x1: number; y1: number; x2: number; y2: number; attrs?: RenderAttrs }
  | {
      type: 'text'
      x: number
      y: number
      content: string
      attrs?: RenderAttrs & {
        textAnchor?: 'start' | 'middle' | 'end'
        dominantBaseline?: 'auto' | 'middle' | 'hanging' | 'central'
        fontSize?: number
        fontFamily?: string
        fontWeight?: string | number
      }
    }
  | { type: 'clipPath'; id: string; children: RenderNode[] }
  | { type: 'defs'; children: RenderNode[] }

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

export interface RendererRoot {
  element: SVGElement | HTMLElement
}

export interface Renderer {
  createRoot(target: HTMLElement, width: number, height: number, attrs?: RenderAttrs): RendererRoot
  render(root: RendererRoot, nodes: RenderNode[]): void
  update(root: RendererRoot, nodes: RenderNode[]): void
  clear(root: RendererRoot): void
  destroy(root: RendererRoot): void
}

// ---------------------------------------------------------------------------
// Chart area
// ---------------------------------------------------------------------------

export interface ChartArea {
  x: number
  y: number
  width: number
  height: number
}

// ---------------------------------------------------------------------------
// Render context (passed to chart type renderers)
// ---------------------------------------------------------------------------

export interface RenderContext {
  data: PreparedData
  options: ResolvedOptions
  area: ChartArea
  xScale: Scale
  yScale: Scale
  theme: ThemeConfig
}

// ---------------------------------------------------------------------------
// Chart type plugin
// ---------------------------------------------------------------------------

export interface ChartTypePlugin {
  readonly type: string
  getScaleTypes(): { x: ScaleType; y: ScaleType }
  prepareData(data: ChartData, options: ResolvedOptions): PreparedData
  render(ctx: RenderContext): RenderNode[]
  hitTest(ctx: RenderContext, x: number, y: number): HitResult | null
}

export interface HitResult {
  seriesIndex: number
  pointIndex: number
  distance: number
}

// ---------------------------------------------------------------------------
// Chart instance (public API returned to users)
// ---------------------------------------------------------------------------

export interface ChartInstance {
  setData(data: ChartData): void
  setOptions(options: Partial<ChartOptions>): void
  getData(): ChartData
  getOptions(): ResolvedOptions
  setLoading(loading?: boolean): void
  setError(message?: string): void
  setEmpty(message?: string): void
  toSVG(): string
  toPNG(options?: { scale?: number }): Promise<Blob>
  toClipboard(): Promise<void>
  on(event: string, handler: (...args: unknown[]) => void): () => void
  resize(width: number, height: number): void
  /** Reset zoom/pan to initial state. */
  resetZoom(): void
  destroy(): void
  readonly element: SVGElement | HTMLCanvasElement
  /** Event bus — used by linkCharts() and advanced consumers. */
  readonly _bus: EventBus
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export interface ChartEvents {
  'data:change': { previous: ChartData; current: ChartData }
  'resize': { width: number; height: number }
  'theme:change': { theme: string }
  'point:enter': { point: DataPoint; event: MouseEvent }
  'point:leave': { event: MouseEvent }
  'point:click': { point: DataPoint; event: MouseEvent }
  'tooltip:show': { point: DataPoint; x: number; y: number }
  'tooltip:hide': void
  'crosshair:move': { x: number; label: string | number | Date }
  'crosshair:hide': void
  'zoom:change': { zoomX: number; zoomY: number; panX: number; panY: number }
  'zoom:reset': void
  'brush:end': { startIndex: number; endIndex: number; startLabel: string | number | Date; endLabel: string | number | Date }
  'destroy': void
}

export type EventHandler<T> = (payload: T) => void
export type Unsubscribe = () => void

export interface EventBus {
  on<K extends keyof ChartEvents>(event: K, handler: EventHandler<ChartEvents[K]>): Unsubscribe
  emit<K extends keyof ChartEvents>(event: K, payload: ChartEvents[K]): void
  off<K extends keyof ChartEvents>(event: K, handler: EventHandler<ChartEvents[K]>): void
  destroy(): void
}
