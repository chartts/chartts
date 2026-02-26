/**
 * Realtime streaming data module.
 *
 * Provides a circular buffer + rolling window for live data feeds.
 * Throttled re-render via requestAnimationFrame.
 *
 * Usage:
 * ```ts
 * const stream = createStreamingChart(chart, {
 *   windowSize: 100,     // show last 100 points
 *   seriesCount: 3,      // 3 data series
 *   seriesNames: ['CPU', 'Memory', 'Disk'],
 * })
 *
 * // Push single data point (one value per series)
 * stream.push([45, 72, 30], 'now')
 *
 * // Push batch of data points
 * stream.pushBatch([
 *   { values: [45, 72, 30], label: '10:00' },
 *   { values: [46, 71, 31], label: '10:01' },
 * ])
 *
 * // Pause / resume
 * stream.pause()
 * stream.resume()
 *
 * // Clean up
 * stream.destroy()
 * ```
 */

import type { ChartInstance, ChartData } from '../types'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface StreamingConfig {
  /** Number of data points visible in the rolling window. Default 100. */
  windowSize?: number
  /** Number of data series. Default 1. */
  seriesCount?: number
  /** Series names. Default ['Series 1', 'Series 2', ...] */
  seriesNames?: string[]
  /** Series colors (optional — falls back to chart palette). */
  seriesColors?: string[]
  /** Maximum buffer size (oldest data is discarded beyond this). Default 10x windowSize. */
  maxBufferSize?: number
  /** Throttle interval in ms (0 = use rAF). Default 0. */
  throttleMs?: number
}

// ---------------------------------------------------------------------------
// Instance
// ---------------------------------------------------------------------------

export interface StreamingInstance {
  /** Push one data point (one value per series). */
  push(values: number[], label?: string | number | Date): void
  /** Push a batch of data points at once. */
  pushBatch(points: Array<{ values: number[]; label?: string | number | Date }>): void
  /** Pause streaming (stops re-renders but still accepts data). */
  pause(): void
  /** Resume streaming re-renders. */
  resume(): void
  /** Clear all buffered data. */
  clear(): void
  /** Get current buffer size. */
  getBufferSize(): number
  /** Destroy the streaming instance and clean up. */
  destroy(): void
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export function createStreamingChart(
  chart: ChartInstance,
  config: StreamingConfig = {},
): StreamingInstance {
  const windowSize = config.windowSize ?? 100
  const seriesCount = config.seriesCount ?? 1
  const maxBuffer = config.maxBufferSize ?? windowSize * 10
  const throttleMs = config.throttleMs ?? 0

  const names: string[] = config.seriesNames
    ?? Array.from({ length: seriesCount }, (_, i) => `Series ${i + 1}`)
  const colors: (string | undefined)[] = config.seriesColors ?? []

  // Circular buffers: one per series + one for labels
  const buffers: number[][] = Array.from({ length: seriesCount }, () => [])
  const labels: (string | number | Date)[] = []
  let totalPushed = 0

  let paused = false
  let dirty = false
  let rafId: number | null = null
  let throttleTimer: ReturnType<typeof setTimeout> | null = null

  // -----------------------------------------------------------------------
  // Internal: schedule a chart update
  // -----------------------------------------------------------------------

  function scheduleUpdate(): void {
    if (paused) { dirty = true; return }

    if (throttleMs > 0) {
      if (throttleTimer !== null) return
      throttleTimer = setTimeout(() => {
        throttleTimer = null
        flush()
      }, throttleMs)
    } else {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        flush()
      })
    }
  }

  function flush(): void {
    dirty = false

    // Build ChartData from the rolling window
    const start = Math.max(0, labels.length - windowSize)
    const windowLabels = labels.slice(start)
    const series = buffers.map((buf, i) => ({
      name: names[i] ?? `Series ${i + 1}`,
      values: buf.slice(start),
      ...(colors[i] ? { color: colors[i] } : {}),
    }))

    const data: ChartData = {
      labels: windowLabels as string[],
      series,
    }

    chart.setData(data)
  }

  // -----------------------------------------------------------------------
  // Trim buffer if it exceeds maxBuffer
  // -----------------------------------------------------------------------

  function trimBuffer(): void {
    if (labels.length <= maxBuffer) return
    const excess = labels.length - maxBuffer
    labels.splice(0, excess)
    for (const buf of buffers) {
      buf.splice(0, excess)
    }
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  return {
    push(values: number[], label?: string | number | Date): void {
      totalPushed++
      const lbl = label ?? totalPushed
      labels.push(lbl)

      for (let i = 0; i < seriesCount; i++) {
        buffers[i]!.push(values[i] ?? 0)
      }

      trimBuffer()
      scheduleUpdate()
    },

    pushBatch(points): void {
      for (const pt of points) {
        totalPushed++
        const lbl = pt.label ?? totalPushed
        labels.push(lbl)

        for (let i = 0; i < seriesCount; i++) {
          buffers[i]!.push(pt.values[i] ?? 0)
        }
      }

      trimBuffer()
      scheduleUpdate()
    },

    pause(): void {
      paused = true
    },

    resume(): void {
      paused = false
      if (dirty) scheduleUpdate()
    },

    clear(): void {
      labels.length = 0
      for (const buf of buffers) buf.length = 0
      totalPushed = 0
      dirty = false
    },

    getBufferSize(): number {
      return labels.length
    },

    destroy(): void {
      if (rafId !== null) cancelAnimationFrame(rafId)
      if (throttleTimer !== null) clearTimeout(throttleTimer)
      labels.length = 0
      for (const buf of buffers) buf.length = 0
    },
  }
}
