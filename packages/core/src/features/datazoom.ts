import type { ChartData, RenderNode } from '../types'
import { rect, path, text } from '../render/tree'
import { PathBuilder } from '../render/tree'

/**
 * DataZoom — interactive data range selection and filtering.
 *
 * Provides utilities to:
 * 1. Filter chart data to a visible window (applyDataZoom)
 * 2. Render a zoom slider control (renderDataZoomSlider)
 * 3. Manage zoom state (createDataZoomState)
 */

export interface DataZoomRange {
  /** Start percentage 0..1 */
  start: number
  /** End percentage 0..1 */
  end: number
}

export interface DataZoomState {
  range: DataZoomRange
  setRange(start: number, end: number): void
  reset(): void
  zoomIn(factor?: number): void
  zoomOut(factor?: number): void
  panLeft(amount?: number): void
  panRight(amount?: number): void
}

export interface DataZoomSliderOptions {
  x: number
  y: number
  width: number
  height?: number
  trackColor?: string
  handleColor?: string
  selectedColor?: string
  showMinimap?: boolean
}

/** Create a DataZoom state manager. */
export function createDataZoomState(
  initial?: Partial<DataZoomRange>,
  onChange?: (range: DataZoomRange) => void,
): DataZoomState {
  const range: DataZoomRange = {
    start: initial?.start ?? 0,
    end: initial?.end ?? 1,
  }

  function clamp() {
    range.start = Math.max(0, Math.min(range.start, 1))
    range.end = Math.max(range.start + 0.01, Math.min(range.end, 1))
    onChange?.(range)
  }

  return {
    range,
    setRange(start: number, end: number) {
      range.start = start
      range.end = end
      clamp()
    },
    reset() {
      range.start = 0
      range.end = 1
      onChange?.(range)
    },
    zoomIn(factor = 0.1) {
      const center = (range.start + range.end) / 2
      const halfSpan = (range.end - range.start) / 2 * (1 - factor)
      range.start = center - halfSpan
      range.end = center + halfSpan
      clamp()
    },
    zoomOut(factor = 0.1) {
      const center = (range.start + range.end) / 2
      const halfSpan = (range.end - range.start) / 2 * (1 + factor)
      range.start = center - halfSpan
      range.end = center + halfSpan
      clamp()
    },
    panLeft(amount = 0.05) {
      const span = range.end - range.start
      range.start = Math.max(0, range.start - amount)
      range.end = range.start + span
      clamp()
    },
    panRight(amount = 0.05) {
      const span = range.end - range.start
      range.end = Math.min(1, range.end + amount)
      range.start = range.end - span
      clamp()
    },
  }
}

/** Apply DataZoom range to filter chart data. */
export function applyDataZoom(data: ChartData, range: DataZoomRange): ChartData {
  const labels = data.labels ?? []
  const total = labels.length
  if (total === 0) return data

  const startIdx = Math.floor(range.start * total)
  const endIdx = Math.ceil(range.end * total)

  return {
    ...data,
    labels: (labels as unknown[]).slice(startIdx, endIdx) as ChartData['labels'],
    series: data.series.map(s => ({
      ...s,
      values: s.values.slice(startIdx, endIdx),
    })),
  }
}

/** Render a DataZoom slider as RenderNode[]. */
export function renderDataZoomSlider(
  data: ChartData,
  range: DataZoomRange,
  opts: DataZoomSliderOptions,
): RenderNode[] {
  const nodes: RenderNode[] = []
  const h = opts.height ?? 30
  const trackColor = opts.trackColor ?? '#e5e7eb'
  const handleColor = opts.handleColor ?? '#6b7280'
  const selectedColor = opts.selectedColor ?? 'rgba(59,130,246,0.2)'

  // Track background
  nodes.push(rect(opts.x, opts.y, opts.width, h, {
    class: 'chartts-datazoom-track',
    fill: trackColor,
    rx: 4,
    ry: 4,
  }))

  // Minimap sparkline
  if (opts.showMinimap !== false && data.series[0]) {
    const values = data.series[0].values
    const max = Math.max(...values.map(Math.abs), 1)
    const pb = new PathBuilder()

    for (let i = 0; i < values.length; i++) {
      const x = opts.x + (i / Math.max(values.length - 1, 1)) * opts.width
      const y = opts.y + h - (Math.abs(values[i]!) / max) * (h - 4) - 2
      if (i === 0) pb.moveTo(x, y)
      else pb.lineTo(x, y)
    }

    nodes.push(path(pb.build(), {
      class: 'chartts-datazoom-minimap',
      fill: 'none',
      stroke: handleColor,
      strokeWidth: 1,
      strokeOpacity: 0.4,
    }))
  }

  // Selected region
  const selX = opts.x + range.start * opts.width
  const selW = (range.end - range.start) * opts.width

  nodes.push(rect(selX, opts.y, selW, h, {
    class: 'chartts-datazoom-selected',
    fill: selectedColor,
    rx: 2,
    ry: 2,
  }))

  // Left handle
  nodes.push(rect(selX - 3, opts.y + 4, 6, h - 8, {
    class: 'chartts-datazoom-handle chartts-datazoom-handle-left',
    fill: handleColor,
    rx: 3,
    ry: 3,
    cursor: 'ew-resize',
  }))

  // Right handle
  nodes.push(rect(selX + selW - 3, opts.y + 4, 6, h - 8, {
    class: 'chartts-datazoom-handle chartts-datazoom-handle-right',
    fill: handleColor,
    rx: 3,
    ry: 3,
    cursor: 'ew-resize',
  }))

  // Range labels
  const dlabels = data.labels ?? []
  const total = dlabels.length
  const startIdx = Math.floor(range.start * total)
  const endIdx = Math.min(Math.ceil(range.end * total) - 1, total - 1)

  if (total > 0) {
    nodes.push(text(selX, opts.y + h + 12, String((dlabels as unknown[])[startIdx] ?? ''), {
      class: 'chartts-datazoom-label',
      fill: handleColor,
      textAnchor: 'start',
      fontSize: 9,
    }))

    nodes.push(text(selX + selW, opts.y + h + 12, String((dlabels as unknown[])[endIdx] ?? ''), {
      class: 'chartts-datazoom-label',
      fill: handleColor,
      textAnchor: 'end',
      fontSize: 9,
    }))
  }

  return nodes
}
