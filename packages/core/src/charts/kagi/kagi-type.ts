import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareNoAxes } from '../../utils/prepare'
import { group, path, text } from '../../render/tree'
import { PathBuilder } from '../../render/tree'

export interface KagiOptions {
  /** Reversal amount. If < 1, treated as percentage of range. Default 0.04 (4%). */
  reversalAmount?: number
  /** Yang (up-trend) color. Default green. */
  yangColor?: string
  /** Yin (down-trend) color. Default red. */
  yinColor?: string
  /** Yang line width (thick). Default 3. */
  yangWidth?: number
  /** Yin line width (thin). Default 1.5. */
  yinWidth?: number
  /** Show price labels at turning points. Default false. */
  showLabels?: boolean
}

interface KagiSegment {
  startY: number
  endY: number
  x: number
  isYang: boolean   // thick = up trend
  priceStart: number
  priceEnd: number
}

/**
 * Kagi chart — Japanese reversal chart.
 *
 * Lines change direction only on significant price moves.
 * Thick lines (yang) = up trend, thin lines (yin) = down trend.
 * Thickness changes when price breaks prior high/low.
 */
export const kagiChartType: ChartTypePlugin = {
  type: 'kagi',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, options, theme } = ctx
    const nodes: RenderNode[] = []

    const series = data.series[0]
    if (!series || series.values.length < 2) return nodes

    const opts = options as unknown as KagiOptions
    const yangColor = opts.yangColor ?? 'var(--color-emerald-500, #10b981)'
    const yinColor = opts.yinColor ?? 'var(--color-red-500, #ef4444)'
    const yangWidth = opts.yangWidth ?? 3
    const yinWidth = opts.yinWidth ?? 1.5
    const showLabels = opts.showLabels ?? false

    const values = series.values
    const vMin = Math.min(...values)
    const vMax = Math.max(...values)
    const vRange = vMax - vMin || 1

    // Reversal amount
    let reversal = opts.reversalAmount ?? 0.04
    if (reversal < 1) reversal = reversal * vRange

    // Build kagi segments
    const segments = computeKagiSegments(values, reversal)
    if (segments.length === 0) return nodes

    // Map to pixel coordinates
    const padding = 20
    const usableWidth = area.width - padding * 2
    const usableHeight = area.height - padding * 2
    const colWidth = segments.length > 1 ? usableWidth / (segments.length - 1) : usableWidth

    const mapY = (v: number) => area.y + padding + (1 - (v - vMin) / vRange) * usableHeight
    const actualColWidth = Math.min(colWidth, 20)
    const totalWidth = actualColWidth * (segments.length - 1)
    const xOffset = area.x + (area.width - totalWidth) / 2

    const kagiNodes: RenderNode[] = []

    // Draw segments
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]!
      const x = xOffset + i * actualColWidth
      const y1 = mapY(seg.priceStart)
      const y2 = mapY(seg.priceEnd)
      const color = seg.isYang ? yangColor : yinColor
      const width = seg.isYang ? yangWidth : yinWidth

      // Vertical segment
      const pb = new PathBuilder()
      pb.moveTo(x, y1).lineTo(x, y2)

      // Horizontal connector to next segment
      if (i < segments.length - 1) {
        const nextX = xOffset + (i + 1) * actualColWidth
        pb.lineTo(nextX, y2)
      }

      kagiNodes.push(path(pb.build(), {
        class: 'chartts-kagi-line',
        stroke: color,
        strokeWidth: width,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'data-series': 0,
        'data-index': i,
      }))

      // Price labels at turning points
      if (showLabels && (i === 0 || i === segments.length - 1)) {
        kagiNodes.push(text(x, y2 + (seg.priceEnd > seg.priceStart ? -8 : 14), seg.priceEnd.toFixed(1), {
          class: 'chartts-kagi-label',
          fill: theme.textMuted,
          fontSize: theme.fontSizeSmall,
          textAnchor: 'middle',
        }))
      }
    }

    nodes.push(group(kagiNodes, {
      class: 'chartts-series chartts-series-0',
      'data-series-name': series.name,
    }))

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area } = ctx
    const series = data.series[0]
    if (!series || series.values.length < 2) return null

    // Approximate: map mouse X to data index
    const frac = (mx - area.x) / area.width
    const idx = Math.round(frac * (series.values.length - 1))
    if (idx >= 0 && idx < series.values.length) {
      return { seriesIndex: 0, pointIndex: idx, distance: 10, x: mx, y: my }
    }
    return null
  },
}

/**
 * Compute kagi line segments from raw price data.
 */
function computeKagiSegments(values: number[], reversal: number): KagiSegment[] {
  const segments: KagiSegment[] = []
  if (values.length < 2) return segments

  let direction: 'up' | 'down' = values[1]! >= values[0]! ? 'up' : 'down'
  let currentStart = values[0]!
  let currentEnd = values[1]!
  let priorHigh = Math.max(values[0]!, values[1]!)
  let priorLow = Math.min(values[0]!, values[1]!)
  let isYang = direction === 'up'

  for (let i = 2; i < values.length; i++) {
    const v = values[i]!

    if (direction === 'up') {
      if (v >= currentEnd) {
        // Continue up
        currentEnd = v
        if (v > priorHigh) isYang = true
      } else if (currentEnd - v >= reversal) {
        // Reversal down
        segments.push({
          startY: 0, endY: 0, x: 0,
          isYang,
          priceStart: currentStart,
          priceEnd: currentEnd,
        })
        priorHigh = currentEnd
        currentStart = currentEnd
        currentEnd = v
        direction = 'down'
        if (v < priorLow) isYang = false
      }
    } else {
      if (v <= currentEnd) {
        // Continue down
        currentEnd = v
        if (v < priorLow) isYang = false
      } else if (v - currentEnd >= reversal) {
        // Reversal up
        segments.push({
          startY: 0, endY: 0, x: 0,
          isYang,
          priceStart: currentStart,
          priceEnd: currentEnd,
        })
        priorLow = currentEnd
        currentStart = currentEnd
        currentEnd = v
        direction = 'up'
        if (v > priorHigh) isYang = true
      }
    }
  }

  // Push final segment
  segments.push({
    startY: 0, endY: 0, x: 0,
    isYang,
    priceStart: currentStart,
    priceEnd: currentEnd,
  })

  return segments
}
