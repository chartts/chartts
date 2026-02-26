/**
 * Linked charts — sync crosshair position across multiple chart instances.
 *
 * Usage:
 * ```ts
 * const unlink = linkCharts(chart1, chart2, chart3)
 * // Later:
 * unlink()
 * ```
 */

import type { ChartInstance } from '../types'

/**
 * Link multiple chart instances so their crosshair positions stay in sync.
 * When one chart emits a crosshair:move event, all others receive it.
 *
 * Returns an unlink function to disconnect the charts.
 */
export function linkCharts(...charts: ChartInstance[]): () => void {
  if (charts.length < 2) return () => {}

  let broadcasting = false
  const unsubs: (() => void)[] = []

  for (const chart of charts) {
    const unsub = chart.on('crosshair:move', (payload: unknown) => {
      if (broadcasting) return
      broadcasting = true

      const { x, label } = payload as { x: number; label: string | number | Date }

      // Broadcast to all other charts
      for (const other of charts) {
        if (other === chart) continue
        // Emit synthetic crosshair event on linked charts
        try {
          (other as unknown as { _bus?: { emit(e: string, p: unknown): void } })._bus?.emit('crosshair:move', { x, label })
        } catch { /* ignore if bus not exposed */ }
      }

      broadcasting = false
    })

    unsubs.push(unsub)

    // Also sync hide events
    const unsubHide = chart.on('crosshair:hide', () => {
      if (broadcasting) return
      broadcasting = true
      for (const other of charts) {
        if (other === chart) continue
        try {
          (other as unknown as { _bus?: { emit(e: string, p: unknown): void } })._bus?.emit('crosshair:hide', undefined)
        } catch { /* ignore */ }
      }
      broadcasting = false
    })
    unsubs.push(unsubHide)
  }

  return () => {
    for (const unsub of unsubs) unsub()
    unsubs.length = 0
  }
}
