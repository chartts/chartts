/**
 * Interactive DataZoom slider widget.
 *
 * A real DOM element with draggable handles and minimap sparkline.
 * Lives outside the chart render loop — manages its own pointer events.
 *
 * Usage:
 * ```ts
 * const widget = createDataZoomWidget({
 *   data: fullData,
 *   onChange: (range) => {
 *     chart.setData(applyDataZoom(fullData, range))
 *   },
 * })
 * container.appendChild(widget.element)
 * ```
 */

import type { ChartData } from '../types'
import { createDataZoomState, type DataZoomState, type DataZoomRange } from './datazoom'

export interface DataZoomWidgetOptions {
  /** Chart data (first series used for minimap sparkline). */
  data: ChartData
  /** Height of the slider in pixels. Default 40. */
  height?: number
  /** Initial visible range. Default { start: 0, end: 1 }. */
  initialRange?: Partial<DataZoomRange>
  /** Called when range changes via user interaction. */
  onChange?: (range: DataZoomRange) => void
  /** Track background color. */
  trackColor?: string
  /** Handle color. */
  handleColor?: string
  /** Selected region color. */
  selectedColor?: string
  /** Minimap line color. */
  minimapColor?: string
}

export interface DataZoomWidget {
  /** The DOM element to insert into the page. */
  element: HTMLElement
  /** The state manager (setRange, reset, zoomIn, zoomOut, panLeft, panRight). */
  state: DataZoomState
  /** Update minimap sparkline data. */
  setData(data: ChartData): void
  /** Destroy and clean up. */
  destroy(): void
}

export function createDataZoomWidget(options: DataZoomWidgetOptions): DataZoomWidget {
  const h = options.height ?? 40
  const trackColor = options.trackColor ?? '#e5e7eb'
  const handleColor = options.handleColor ?? '#6b7280'
  const selectedColor = options.selectedColor ?? 'rgba(59,130,246,0.25)'
  const minimapColor = options.minimapColor ?? '#9ca3af'

  let currentData = options.data

  // State
  const state = createDataZoomState(
    options.initialRange,
    (range) => {
      updateLayout()
      options.onChange?.(range)
    },
  )

  // -----------------------------------------------------------------------
  // DOM construction
  // -----------------------------------------------------------------------

  const root = document.createElement('div')
  root.className = 'chartts-datazoom-widget'
  root.style.cssText = `position:relative;height:${h}px;width:100%;user-select:none;touch-action:none;`

  // Track background
  const track = document.createElement('div')
  track.className = 'chartts-datazoom-track'
  track.style.cssText = `position:absolute;inset:0;background:${trackColor};border-radius:4px;overflow:hidden;`
  root.appendChild(track)

  // Minimap canvas
  const minimap = document.createElement('canvas')
  minimap.className = 'chartts-datazoom-minimap'
  minimap.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;'
  track.appendChild(minimap)

  // Left mask (dimmed area)
  const maskLeft = document.createElement('div')
  maskLeft.style.cssText = `position:absolute;top:0;left:0;height:100%;background:rgba(0,0,0,0.15);border-radius:4px 0 0 4px;pointer-events:none;`
  root.appendChild(maskLeft)

  // Right mask (dimmed area)
  const maskRight = document.createElement('div')
  maskRight.style.cssText = `position:absolute;top:0;right:0;height:100%;background:rgba(0,0,0,0.15);border-radius:0 4px 4px 0;pointer-events:none;`
  root.appendChild(maskRight)

  // Selected region (draggable for pan)
  const selected = document.createElement('div')
  selected.className = 'chartts-datazoom-selected'
  selected.style.cssText = `position:absolute;top:0;height:100%;background:${selectedColor};cursor:grab;border-top:2px solid ${handleColor};border-bottom:2px solid ${handleColor};`
  root.appendChild(selected)

  // Left handle
  const handleLeft = document.createElement('div')
  handleLeft.className = 'chartts-datazoom-handle-left'
  handleLeft.style.cssText = `position:absolute;top:2px;width:8px;height:${h - 4}px;background:${handleColor};border-radius:4px;cursor:ew-resize;z-index:2;transform:translateX(-50%);`
  root.appendChild(handleLeft)

  // Right handle
  const handleRight = document.createElement('div')
  handleRight.className = 'chartts-datazoom-handle-right'
  handleRight.style.cssText = `position:absolute;top:2px;width:8px;height:${h - 4}px;background:${handleColor};border-radius:4px;cursor:ew-resize;z-index:2;transform:translateX(-50%);`
  root.appendChild(handleRight)

  // -----------------------------------------------------------------------
  // Layout update
  // -----------------------------------------------------------------------

  function updateLayout(): void {
    const w = root.clientWidth || root.offsetWidth || 300
    const { start, end } = state.range

    const leftPx = start * w
    const rightPx = end * w
    const selWidth = rightPx - leftPx

    maskLeft.style.width = `${leftPx}px`
    maskRight.style.width = `${w - rightPx}px`

    selected.style.left = `${leftPx}px`
    selected.style.width = `${selWidth}px`

    handleLeft.style.left = `${leftPx}px`
    handleRight.style.left = `${rightPx}px`
  }

  // -----------------------------------------------------------------------
  // Minimap rendering
  // -----------------------------------------------------------------------

  function drawMinimap(): void {
    const w = root.clientWidth || root.offsetWidth || 300
    const dpr = window.devicePixelRatio || 1
    minimap.width = Math.round(w * dpr)
    minimap.height = Math.round(h * dpr)
    minimap.style.width = `${w}px`
    minimap.style.height = `${h}px`

    const ctx = minimap.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const series = currentData.series[0]
    if (!series || series.values.length === 0) return

    const values = series.values.filter(v => !isNaN(v))
    if (values.length === 0) return

    const max = Math.max(...values)
    const min = Math.min(...values)
    const range = max - min || 1
    const pad = 4

    ctx.beginPath()
    ctx.strokeStyle = minimapColor
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.5

    let started = false
    for (let i = 0; i < series.values.length; i++) {
      const v = series.values[i]!
      if (isNaN(v)) continue
      const x = (i / Math.max(series.values.length - 1, 1)) * w
      const y = h - pad - ((v - min) / range) * (h - pad * 2)
      if (!started) { ctx.moveTo(x, y); started = true }
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // Fill area below the line
    if (started) {
      ctx.lineTo(w, h)
      ctx.lineTo(0, h)
      ctx.closePath()
      ctx.fillStyle = minimapColor
      ctx.globalAlpha = 0.08
      ctx.fill()
    }
  }

  // -----------------------------------------------------------------------
  // Pointer interaction
  // -----------------------------------------------------------------------

  type DragMode = 'left' | 'right' | 'pan' | null
  let dragMode: DragMode = null
  let dragStartX = 0
  let dragStartRange: DataZoomRange = { start: 0, end: 1 }

  function toNormalized(clientX: number): number {
    const r = root.getBoundingClientRect()
    return Math.max(0, Math.min(1, (clientX - r.left) / r.width))
  }

  function onPointerDown(e: PointerEvent): void {
    const target = e.target as HTMLElement
    if (target === handleLeft || target.closest('.chartts-datazoom-handle-left')) {
      dragMode = 'left'
    } else if (target === handleRight || target.closest('.chartts-datazoom-handle-right')) {
      dragMode = 'right'
    } else if (target === selected || target.closest('.chartts-datazoom-selected')) {
      dragMode = 'pan'
      selected.style.cursor = 'grabbing'
    } else {
      // Click on track — jump to position
      const pos = toNormalized(e.clientX)
      const span = state.range.end - state.range.start
      state.setRange(pos - span / 2, pos + span / 2)
      return
    }

    dragStartX = e.clientX
    dragStartRange = { ...state.range }
    root.setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  function onPointerMove(e: PointerEvent): void {
    if (!dragMode) return

    const dx = e.clientX - dragStartX
    const w = root.clientWidth || root.offsetWidth || 300
    const delta = dx / w

    if (dragMode === 'left') {
      state.setRange(
        Math.min(dragStartRange.start + delta, state.range.end - 0.02),
        state.range.end,
      )
    } else if (dragMode === 'right') {
      state.setRange(
        state.range.start,
        Math.max(dragStartRange.end + delta, state.range.start + 0.02),
      )
    } else if (dragMode === 'pan') {
      const span = dragStartRange.end - dragStartRange.start
      let newStart = dragStartRange.start + delta
      let newEnd = dragStartRange.end + delta
      // Clamp to bounds
      if (newStart < 0) { newStart = 0; newEnd = span }
      if (newEnd > 1) { newEnd = 1; newStart = 1 - span }
      state.setRange(newStart, newEnd)
    }
  }

  function onPointerUp(_e: PointerEvent): void {
    dragMode = null
    selected.style.cursor = 'grab'
  }

  function onDblClick(): void {
    state.reset()
  }

  root.addEventListener('pointerdown', onPointerDown)
  root.addEventListener('pointermove', onPointerMove)
  root.addEventListener('pointerup', onPointerUp)
  root.addEventListener('dblclick', onDblClick)

  // -----------------------------------------------------------------------
  // Resize observer
  // -----------------------------------------------------------------------

  let resizeObserver: ResizeObserver | null = null
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      updateLayout()
      drawMinimap()
    })
    resizeObserver.observe(root)
  }

  // Initial draw (deferred to next frame so root has dimensions)
  requestAnimationFrame(() => {
    updateLayout()
    drawMinimap()
  })

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  return {
    element: root,
    state,

    setData(data: ChartData): void {
      currentData = data
      drawMinimap()
    },

    destroy(): void {
      resizeObserver?.disconnect()
      root.removeEventListener('pointerdown', onPointerDown)
      root.removeEventListener('pointermove', onPointerMove)
      root.removeEventListener('pointerup', onPointerUp)
      root.removeEventListener('dblclick', onDblClick)
      root.remove()
    },
  }
}
