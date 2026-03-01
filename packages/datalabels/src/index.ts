import type { RenderNode, ChartArea, Scale, PreparedData, RenderAttrs } from '@chartts/core'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DataLabelOptions {
  position?: 'top' | 'center' | 'bottom' | 'outside' | 'inside'
  format?: (value: number, index: number, seriesIndex: number) => string
  color?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string | number
  offset?: number
  rotation?: number
  anchor?: 'start' | 'middle' | 'end'
  display?: boolean | ((value: number, index: number) => boolean)
  backgroundColor?: string
  padding?: number
  borderRadius?: number
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const DEFAULT_FORMAT = (value: number): string =>
  String(Math.round(value * 100) / 100)

function shouldDisplay(
  display: DataLabelOptions['display'],
  value: number,
  index: number,
): boolean {
  if (display === false) return false
  if (display === true || display === undefined) return true
  return display(value, index)
}

function computeYPosition(
  py: number,
  position: DataLabelOptions['position'],
  offset: number,
): number {
  switch (position) {
    case 'top':
      return py - offset
    case 'bottom':
      return py + offset
    case 'center':
      return py
    case 'outside':
      return py - offset
    case 'inside':
      return py + offset / 2
    default:
      return py - offset
  }
}

function buildLabelAttrs(opts: DataLabelOptions): RenderAttrs & {
  textAnchor?: 'start' | 'middle' | 'end'
  dominantBaseline?: 'auto' | 'middle' | 'hanging' | 'central'
  fontSize?: number
  fontFamily?: string
  fontWeight?: string | number
} {
  const attrs: RenderAttrs & {
    textAnchor?: 'start' | 'middle' | 'end'
    dominantBaseline?: 'auto' | 'middle' | 'hanging' | 'central'
    fontSize?: number
    fontFamily?: string
    fontWeight?: string | number
  } = {
    fill: opts.color ?? '#374151',
    textAnchor: opts.anchor ?? 'middle',
    dominantBaseline: 'auto',
    fontSize: opts.fontSize ?? 11,
  }

  if (opts.fontFamily) attrs.fontFamily = opts.fontFamily
  if (opts.fontWeight) attrs.fontWeight = opts.fontWeight
  if (opts.rotation) attrs.transform = `rotate(${opts.rotation})`

  return attrs
}

function createBackgroundRect(
  x: number,
  y: number,
  text: string,
  opts: DataLabelOptions,
): RenderNode | null {
  if (!opts.backgroundColor) return null

  const padding = opts.padding ?? 3
  const fontSize = opts.fontSize ?? 11
  const estimatedWidth = text.length * fontSize * 0.6
  const height = fontSize + padding * 2
  const width = estimatedWidth + padding * 2

  return {
    type: 'rect',
    x: x - width / 2,
    y: y - height + padding,
    width,
    height,
    rx: opts.borderRadius ?? 2,
    ry: opts.borderRadius ?? 2,
    attrs: {
      fill: opts.backgroundColor,
      fillOpacity: 0.85,
    },
  }
}

// ---------------------------------------------------------------------------
// Main API
// ---------------------------------------------------------------------------

/**
 * Generate text RenderNodes for all data points across all series.
 *
 * Maps each data value through the provided scales and positions a text
 * label relative to each data point.
 */
export function createDataLabels(
  data: PreparedData,
  _area: ChartArea,
  xScale: Scale,
  yScale: Scale,
  options?: DataLabelOptions,
): RenderNode[] {
  const opts = options ?? {}
  const position = opts.position ?? 'top'
  const offset = opts.offset ?? 14
  const format = opts.format ?? ((v: number) => DEFAULT_FORMAT(v))
  const attrs = buildLabelAttrs(opts)
  const nodes: RenderNode[] = []

  for (let si = 0; si < data.series.length; si++) {
    const series = data.series[si]!
    for (let i = 0; i < series.values.length; i++) {
      const value = series.values[i]!
      if (!shouldDisplay(opts.display, value, i)) continue
      if (isNaN(value)) continue

      const label = data.labels[i]!
      const px = xScale.map(label)
      const rawY = yScale.map(value)
      const py = computeYPosition(rawY, position, offset)
      const text = format(value, i, si)

      const bg = createBackgroundRect(px, py, text, opts)
      if (bg) nodes.push(bg)

      nodes.push({
        type: 'text',
        x: px,
        y: py,
        content: text,
        attrs: { ...attrs },
      })
    }
  }

  return [{ type: 'group', children: nodes, attrs: { class: 'chartts-datalabels' } }]
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

/**
 * Preset for bar charts. Labels are placed above each bar ('top' position).
 */
export function barLabels(
  data: PreparedData,
  area: ChartArea,
  xScale: Scale,
  yScale: Scale,
  opts?: DataLabelOptions,
): RenderNode[] {
  return createDataLabels(data, area, xScale, yScale, {
    position: 'top',
    anchor: 'middle',
    offset: 8,
    fontSize: 11,
    ...opts,
  })
}

/**
 * Preset for pie/donut charts. Labels are positioned around arc centers
 * using polar coordinate math.
 *
 * Assumes data has a single series. Each value maps to a slice.
 * Labels are placed at the centroid of each arc segment.
 */
export function pieLabels(
  data: PreparedData,
  area: ChartArea,
  opts?: DataLabelOptions,
): RenderNode[] {
  if (data.series.length === 0) return []

  const series = data.series[0]!
  const total = series.values.reduce((sum, v) => sum + Math.abs(v), 0)
  if (total === 0) return []

  const cx = area.x + area.width / 2
  const cy = area.y + area.height / 2
  const radius = Math.min(area.width, area.height) / 2
  const position = opts?.position ?? 'outside'
  const labelRadius = position === 'inside' ? radius * 0.55 : radius * 0.78
  const format = opts?.format ?? ((v: number) => DEFAULT_FORMAT(v))
  const labelAttrs = buildLabelAttrs({ ...opts, anchor: 'middle' })
  const nodes: RenderNode[] = []

  let startAngle = -Math.PI / 2

  for (let i = 0; i < series.values.length; i++) {
    const value = series.values[i]!
    if (!shouldDisplay(opts?.display, value, i)) {
      startAngle += (Math.abs(value) / total) * Math.PI * 2
      continue
    }

    const sliceAngle = (Math.abs(value) / total) * Math.PI * 2
    const midAngle = startAngle + sliceAngle / 2

    const lx = cx + Math.cos(midAngle) * labelRadius
    const ly = cy + Math.sin(midAngle) * labelRadius
    const text = format(value, i, 0)

    const bg = createBackgroundRect(lx, ly, text, opts ?? {})
    if (bg) nodes.push(bg)

    nodes.push({
      type: 'text',
      x: lx,
      y: ly,
      content: text,
      attrs: { ...labelAttrs, dominantBaseline: 'central' },
    })

    startAngle += sliceAngle
  }

  return [{ type: 'group', children: nodes, attrs: { class: 'chartts-datalabels-pie' } }]
}

/**
 * Preset for line charts. Labels are placed above data points ('top').
 * By default, only shows labels on key points (first, last, min, max)
 * to avoid clutter. Pass `display: true` to show all.
 */
export function lineLabels(
  data: PreparedData,
  area: ChartArea,
  xScale: Scale,
  yScale: Scale,
  opts?: DataLabelOptions,
): RenderNode[] {
  // If display is explicitly set, use it as-is
  const hasExplicitDisplay = opts?.display !== undefined

  if (hasExplicitDisplay) {
    return createDataLabels(data, area, xScale, yScale, {
      position: 'top',
      anchor: 'middle',
      offset: 12,
      fontSize: 10,
      ...opts,
    })
  }

  // Smart mode: only label key points (first, last, min, max per series)
  const keyIndices = new Set<string>()

  for (let si = 0; si < data.series.length; si++) {
    const values = data.series[si]!.values
    if (values.length === 0) continue

    // Always show first and last
    keyIndices.add(`${si}:0`)
    keyIndices.add(`${si}:${values.length - 1}`)

    // Find min and max indices
    let minIdx = 0
    let maxIdx = 0
    for (let i = 1; i < values.length; i++) {
      if (values[i]! < values[minIdx]!) minIdx = i
      if (values[i]! > values[maxIdx]!) maxIdx = i
    }
    keyIndices.add(`${si}:${minIdx}`)
    keyIndices.add(`${si}:${maxIdx}`)
  }

  const smartDisplay = (_value: number, index: number): boolean => {
    // This is called per series, so we check all series
    for (let si = 0; si < data.series.length; si++) {
      if (keyIndices.has(`${si}:${index}`)) return true
    }
    return false
  }

  return createDataLabels(data, area, xScale, yScale, {
    position: 'top',
    anchor: 'middle',
    offset: 12,
    fontSize: 10,
    display: smartDisplay,
    ...opts,
    // Keep smart display unless user explicitly overrides
  })
}
