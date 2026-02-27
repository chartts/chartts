import type { ChartInstance } from '../../types'

/**
 * Enable interactive drag-to-pin for graph charts.
 *
 * When a node is dragged, its position is pinned (converted to normalized
 * coordinates 0-1 within the chart area). Other nodes reflow around it
 * via a quick warm-start force re-simulation.
 *
 * Returns a cleanup function to remove event listeners.
 *
 * Usage:
 *   const cleanup = enableGraphDrag(chartInstance)
 *   // later:
 *   cleanup()
 */
export function enableGraphDrag(instance: ChartInstance): () => void {
  const el = instance.element
  let dragNodeIndex: number | null = null
  let dragging = false

  function onPointerDown(e: Event): void {
    const pe = e as PointerEvent
    const target = pe.target as Element
    const seriesAttr = target?.getAttribute?.('data-series')
    if (seriesAttr == null) return

    dragNodeIndex = parseInt(seriesAttr, 10)
    if (isNaN(dragNodeIndex)) {
      dragNodeIndex = null
      return
    }

    dragging = true
    el.setPointerCapture(pe.pointerId)
    pe.preventDefault()
  }

  function onPointerMove(e: Event): void {
    const pe = e as PointerEvent
    if (!dragging || dragNodeIndex == null) return

    const rect = el.getBoundingClientRect()
    const x = pe.clientX - rect.left
    const y = pe.clientY - rect.top

    const nx = x / rect.width
    const ny = y / rect.height

    instance._bus.emit('graph:drag', {
      nodeIndex: dragNodeIndex,
      pin: { x: Math.max(0, Math.min(1, nx)), y: Math.max(0, Math.min(1, ny)) },
    })

    instance.setData(instance.getData())
    pe.preventDefault()
  }

  function onPointerUp(e: Event): void {
    const pe = e as PointerEvent
    if (dragging) {
      el.releasePointerCapture(pe.pointerId)
    }
    dragging = false
    dragNodeIndex = null
  }

  el.addEventListener('pointerdown', onPointerDown)
  el.addEventListener('pointermove', onPointerMove)
  el.addEventListener('pointerup', onPointerUp)

  return () => {
    el.removeEventListener('pointerdown', onPointerDown)
    el.removeEventListener('pointermove', onPointerMove)
    el.removeEventListener('pointerup', onPointerUp)
  }
}
