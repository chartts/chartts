/**
 * Zoom & Pan interaction module.
 *
 * Works with all renderers — modifies scale domains, not DOM elements.
 * Wheel zoom on the x-axis, drag to pan. Touch pinch support.
 */

import type { Scale, ChartArea } from '../types'

export interface ZoomPanConfig {
  /** Enable x-axis zoom. Default true. */
  x?: boolean
  /** Enable y-axis zoom. Default false. */
  y?: boolean
  /** Enable wheel zoom. Default true. */
  wheel?: boolean
  /** Enable drag pan. Default true. */
  drag?: boolean
  /** Enable pinch zoom. Default true. */
  pinch?: boolean
  /** Minimum zoom level (1 = no zoom). Default 1. */
  minZoom?: number
  /** Maximum zoom level. Default 20. */
  maxZoom?: number
}

export interface ZoomPanState {
  zoomX: number
  zoomY: number
  panX: number
  panY: number
}

export interface ZoomPanInstance {
  attach(el: HTMLElement | SVGElement, getArea: () => ChartArea, getScales: () => { xScale: Scale; yScale: Scale }): void
  reset(): void
  getState(): ZoomPanState
  applyToScales(xScale: Scale, yScale: Scale, area: ChartArea): void
  destroy(): void
}

/**
 * Create a zoom & pan controller.
 *
 * Usage:
 * ```ts
 * const zp = createZoomPan({ x: true, y: false }, () => render())
 * zp.attach(svgElement, () => chartArea, () => ({ xScale, yScale }))
 * // On each render, apply to scales:
 * zp.applyToScales(xScale, yScale, area)
 * ```
 */
export function createZoomPan(
  config: ZoomPanConfig,
  onUpdate: () => void,
  interactionState?: { isPanning: boolean },
): ZoomPanInstance {
  const cfg = {
    x: config.x ?? true,
    y: config.y ?? false,
    wheel: config.wheel ?? true,
    drag: config.drag ?? true,
    pinch: config.pinch ?? true,
    minZoom: config.minZoom ?? 1,
    maxZoom: config.maxZoom ?? 20,
  }

  const state: ZoomPanState = {
    zoomX: 1,
    zoomY: 1,
    panX: 0,
    panY: 0,
  }

  let el: HTMLElement | SVGElement | null = null
  let getArea: (() => ChartArea) | null = null
  let isDragging = false
  let dragStartX = 0
  let dragStartY = 0
  let dragStartPanX = 0
  let dragStartPanY = 0

  // Touch state
  let lastPinchDist = 0

  // -----------------------------------------------------------------------
  // Wheel zoom
  // -----------------------------------------------------------------------

  function onWheel(e: WheelEvent): void {
    if (!cfg.wheel || !getArea) return
    e.preventDefault()

    const area = getArea()
    const rect = el!.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const relX = (mouseX - area.x) / area.width

    // Zoom factor
    const delta = e.deltaY > 0 ? 0.9 : 1.1

    if (cfg.x) {
      const newZoom = clamp(state.zoomX * delta, cfg.minZoom, cfg.maxZoom)
      // Adjust pan to zoom around cursor position
      const zoomRatio = newZoom / state.zoomX
      state.panX = relX - (relX - state.panX) * zoomRatio
      state.zoomX = newZoom
    }

    if (cfg.y) {
      const mouseY = e.clientY - rect.top
      const relY = (mouseY - area.y) / area.height
      const newZoomY = clamp(state.zoomY * delta, cfg.minZoom, cfg.maxZoom)
      const zoomRatioY = newZoomY / state.zoomY
      state.panY = relY - (relY - state.panY) * zoomRatioY
      state.zoomY = newZoomY
    }

    clampPan()
    onUpdate()
  }

  // -----------------------------------------------------------------------
  // Drag pan
  // -----------------------------------------------------------------------

  function onPointerDown(e: PointerEvent): void {
    if (!cfg.drag) return
    // Don't start pan if shift is held (reserved for brush selection)
    if (e.shiftKey) return
    isDragging = true
    if (interactionState) interactionState.isPanning = true
    dragStartX = e.clientX
    dragStartY = e.clientY
    dragStartPanX = state.panX
    dragStartPanY = state.panY
    el!.setPointerCapture(e.pointerId)
    ;(el as HTMLElement).style.cursor = 'grabbing'
  }

  function onPointerMove(e: PointerEvent): void {
    if (!isDragging || !getArea) return
    const area = getArea()
    const dx = e.clientX - dragStartX
    const dy = e.clientY - dragStartY

    if (cfg.x) {
      state.panX = dragStartPanX + dx / (area.width * state.zoomX)
    }
    if (cfg.y) {
      state.panY = dragStartPanY + dy / (area.height * state.zoomY)
    }

    clampPan()
    onUpdate()
  }

  function onPointerUp(e: PointerEvent): void {
    if (!isDragging) return
    isDragging = false
    if (interactionState) interactionState.isPanning = false
    el!.releasePointerCapture(e.pointerId)
    ;(el as HTMLElement).style.cursor = 'crosshair'
  }

  // -----------------------------------------------------------------------
  // Touch pinch
  // -----------------------------------------------------------------------

  let lastPinchCenterX = 0
  let lastPinchCenterY = 0

  function onTouchStart(e: TouchEvent): void {
    if (!cfg.pinch || e.touches.length !== 2) return
    lastPinchDist = pinchDistance(e)
    lastPinchCenterX = (e.touches[0]!.clientX + e.touches[1]!.clientX) / 2
    lastPinchCenterY = (e.touches[0]!.clientY + e.touches[1]!.clientY) / 2
  }

  function onTouchMove(e: TouchEvent): void {
    if (!cfg.pinch || e.touches.length !== 2 || !getArea) return
    e.preventDefault()

    const area = getArea()
    const rect = el!.getBoundingClientRect()
    const dist = pinchDistance(e)
    const scaleFactor = dist / lastPinchDist
    lastPinchDist = dist

    // Pinch center in chart-relative coords
    const cx = (lastPinchCenterX - rect.left - area.x) / area.width
    const cy = (lastPinchCenterY - rect.top - area.y) / area.height

    // Update pinch center for next frame
    lastPinchCenterX = (e.touches[0]!.clientX + e.touches[1]!.clientX) / 2
    lastPinchCenterY = (e.touches[0]!.clientY + e.touches[1]!.clientY) / 2

    // Zoom toward pinch center (same formula as wheel zoom)
    if (cfg.x) {
      const newZoom = clamp(state.zoomX * scaleFactor, cfg.minZoom, cfg.maxZoom)
      const ratio = newZoom / state.zoomX
      state.panX = cx - (cx - state.panX) * ratio
      state.zoomX = newZoom
    }
    if (cfg.y) {
      const newZoom = clamp(state.zoomY * scaleFactor, cfg.minZoom, cfg.maxZoom)
      const ratio = newZoom / state.zoomY
      state.panY = cy - (cy - state.panY) * ratio
      state.zoomY = newZoom
    }

    clampPan()
    onUpdate()
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  function clampPan(): void {
    // Keep visible window within bounds.
    // panX/panY represent the offset of the viewport origin as a fraction of the full area.
    // At zoom=1, pan must be 0. At zoom=2, pan range is [-0.5, 0.5] (can shift half the view).
    const halfVisX = (1 - 1 / state.zoomX) / 2
    state.panX = clamp(state.panX, -halfVisX, halfVisX)

    const halfVisY = (1 - 1 / state.zoomY) / 2
    state.panY = clamp(state.panY, -halfVisY, halfVisY)
  }

  function pinchDistance(e: TouchEvent): number {
    const dx = e.touches[0]!.clientX - e.touches[1]!.clientX
    const dy = e.touches[0]!.clientY - e.touches[1]!.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  function clamp(v: number, min: number, max: number): number {
    return Math.min(Math.max(v, min), max)
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  return {
    attach(element, areaFn, _scalesFn) {
      el = element
      getArea = areaFn

      if (cfg.wheel) {
        el.addEventListener('wheel', onWheel as EventListener, { passive: false })
      }
      if (cfg.drag) {
        el.addEventListener('pointerdown', onPointerDown as EventListener)
        el.addEventListener('pointermove', onPointerMove as EventListener)
        el.addEventListener('pointerup', onPointerUp as EventListener)
      }
      if (cfg.pinch) {
        el.addEventListener('touchstart', onTouchStart as EventListener, { passive: false })
        el.addEventListener('touchmove', onTouchMove as EventListener, { passive: false })
      }
    },

    reset() {
      state.zoomX = 1
      state.zoomY = 1
      state.panX = 0
      state.panY = 0
      onUpdate()
    },

    getState() {
      return { ...state }
    },

    /**
     * Apply current zoom/pan to scales by adjusting their domains.
     * Call this at the start of each render, after creating scales.
     */
    applyToScales(xScale, yScale, area) {
      if (state.zoomX === 1 && state.zoomY === 1 && state.panX === 0 && state.panY === 0) return

      if (cfg.x && state.zoomX !== 1) {
        const [xMin, xMax] = xScale.getRange()
        const fullWidth = xMax - xMin
        const visibleWidth = fullWidth / state.zoomX
        const offset = -state.panX * fullWidth
        xScale.setRange(area.x + offset, area.x + offset + visibleWidth)
      }

      if (cfg.y && state.zoomY !== 1) {
        const [yMin, yMax] = yScale.getDomain() as [number, number]
        const fullRange = yMax - yMin
        const visibleRange = fullRange / state.zoomY
        const offset = -state.panY * fullRange
        yScale.setDomain(yMin + offset, yMin + offset + visibleRange)
      }
    },

    destroy() {
      if (!el) return
      el.removeEventListener('wheel', onWheel as EventListener)
      el.removeEventListener('pointerdown', onPointerDown as EventListener)
      el.removeEventListener('pointermove', onPointerMove as EventListener)
      el.removeEventListener('pointerup', onPointerUp as EventListener)
      el.removeEventListener('touchstart', onTouchStart as EventListener)
      el.removeEventListener('touchmove', onTouchMove as EventListener)
      el = null
      getArea = null
    },
  }
}
