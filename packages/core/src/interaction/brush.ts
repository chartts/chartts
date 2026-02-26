/**
 * Brush selection module.
 *
 * Click-drag to select a data range on the chart area.
 * When pan is also enabled, requires Shift+drag to activate.
 * Emits brush:end event with start/end label indices.
 */

import type { ChartArea, Scale, EventBus, PreparedData } from '../types'

export interface BrushConfig {
  /** Fill color of selection rect. Default rgba(59,130,246,0.15). */
  fillColor?: string
  /** Border color of selection rect. Default rgba(59,130,246,0.5). */
  strokeColor?: string
}

export interface BrushInstance {
  destroy(): void
}

export function createBrush(
  config: BrushConfig,
  bus: EventBus,
  el: HTMLElement | SVGElement,
  getArea: () => ChartArea,
  getXScale: () => Scale,
  getData: () => PreparedData,
  isPanEnabled: boolean,
): BrushInstance {
  const fillColor = config.fillColor ?? 'rgba(59,130,246,0.15)'
  const strokeColor = config.strokeColor ?? 'rgba(59,130,246,0.5)'

  let isBrushing = false
  let startClientX = 0
  let brushRect: HTMLDivElement | null = null
  let parentEl: HTMLElement | null = null

  // We need a parent element for absolute positioning
  function getParent(): HTMLElement {
    if (parentEl) return parentEl
    parentEl = el.parentElement as HTMLElement
    if (!parentEl) parentEl = el as unknown as HTMLElement
    parentEl.style.position = 'relative'
    return parentEl
  }

  function toLocalX(clientX: number): number {
    const r = el.getBoundingClientRect()
    return clientX - r.left
  }

  function onPointerDown(e: PointerEvent): void {
    // If pan is enabled, require Shift for brush
    if (isPanEnabled && !e.shiftKey) return
    // If pan is NOT enabled, any click starts brush
    if (!isPanEnabled && e.shiftKey) return // shift reserved for other uses when no pan

    const area = getArea()
    const localX = toLocalX(e.clientX)
    const r = el.getBoundingClientRect()
    const localY = e.clientY - r.top

    // Only start if within chart area
    if (localX < area.x || localX > area.x + area.width) return
    if (localY < area.y || localY > area.y + area.height) return

    isBrushing = true
    startClientX = e.clientX
    ;(el as HTMLElement).setPointerCapture(e.pointerId)

    // Create selection rect
    brushRect = document.createElement('div')
    brushRect.className = 'chartts-brush-rect'
    brushRect.style.cssText = `
      position: absolute;
      top: ${area.y}px;
      height: ${area.height}px;
      left: ${localX}px;
      width: 0px;
      background: ${fillColor};
      border-left: 1px solid ${strokeColor};
      border-right: 1px solid ${strokeColor};
      pointer-events: none;
      z-index: 10;
    `
    getParent().appendChild(brushRect)
  }

  function onPointerMove(e: PointerEvent): void {
    if (!isBrushing || !brushRect) return

    const area = getArea()
    const startX = Math.max(toLocalX(startClientX), area.x)
    const currentX = Math.min(Math.max(toLocalX(e.clientX), area.x), area.x + area.width)

    const left = Math.min(startX, currentX)
    const width = Math.abs(currentX - startX)

    brushRect.style.left = `${left}px`
    brushRect.style.width = `${width}px`
  }

  function onPointerUp(e: PointerEvent): void {
    if (!isBrushing) return
    isBrushing = false
    ;(el as HTMLElement).releasePointerCapture(e.pointerId)

    const area = getArea()
    const xScale = getXScale()
    const data = getData()

    const startX = Math.max(toLocalX(startClientX), area.x)
    const endX = Math.min(Math.max(toLocalX(e.clientX), area.x), area.x + area.width)

    // Remove rect
    brushRect?.remove()
    brushRect = null

    // Minimum drag distance to count as selection (5px)
    if (Math.abs(endX - startX) < 5) return

    // Convert pixel positions to data indices
    const leftX = Math.min(startX, endX)
    const rightX = Math.max(startX, endX)

    // Find nearest label indices
    let startIdx = 0
    let endIdx = data.labels.length - 1
    let bestStartDist = Infinity
    let bestEndDist = Infinity

    for (let i = 0; i < data.labels.length; i++) {
      const pos = xScale.map(data.labels[i]!)
      const distToStart = Math.abs(pos - leftX)
      const distToEnd = Math.abs(pos - rightX)
      if (distToStart < bestStartDist) { bestStartDist = distToStart; startIdx = i }
      if (distToEnd < bestEndDist) { bestEndDist = distToEnd; endIdx = i }
    }

    if (startIdx > endIdx) [startIdx, endIdx] = [endIdx, startIdx]

    bus.emit('brush:end', {
      startIndex: startIdx,
      endIndex: endIdx,
      startLabel: data.labels[startIdx]!,
      endLabel: data.labels[endIdx]!,
    })
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && isBrushing) {
      isBrushing = false
      brushRect?.remove()
      brushRect = null
    }
  }

  // Attach listeners
  el.addEventListener('pointerdown', onPointerDown as EventListener)
  el.addEventListener('pointermove', onPointerMove as EventListener)
  el.addEventListener('pointerup', onPointerUp as EventListener)
  document.addEventListener('keydown', onKeyDown)

  return {
    destroy(): void {
      el.removeEventListener('pointerdown', onPointerDown as EventListener)
      el.removeEventListener('pointermove', onPointerMove as EventListener)
      el.removeEventListener('pointerup', onPointerUp as EventListener)
      document.removeEventListener('keydown', onKeyDown)
      brushRect?.remove()
    },
  }
}
