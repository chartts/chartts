/**
 * Pillar chart — stacked rounded-rectangle bars.
 * Each data value = one segment. Width proportional to value.
 * Symmetric rounded rectangles stacked along an axis.
 */

import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareNoAxes } from '../../utils/prepare'
import { group, rect, text } from '../../render/tree'

export interface PillarOptions {
  /** Scale for ring width. Default 1. */
  intensity?: number
  /** Show value labels. Default true. */
  showLabels?: boolean
  /** Orientation: 'vertical' (default) or 'horizontal'. */
  orientation?: 'vertical' | 'horizontal'
}

export const pillarChartType: ChartTypePlugin = {
  type: 'pillar',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme, options } = ctx
    const nodes: RenderNode[] = []
    const series = data.series[0]
    if (!series || series.values.length === 0) return nodes

    const opts = options as unknown as PillarOptions
    const intensity = opts.intensity ?? 1
    const showLabels = opts.showLabels ?? true
    const horizontal = opts.orientation === 'horizontal'

    const values = series.values
    const numRings = values.length
    let maxVal = 0
    for (const v of values) if (Math.abs(v) > maxVal) maxVal = Math.abs(v)
    if (maxVal === 0) maxVal = 1

    const gap = 3
    const cx = area.x + area.width / 2
    const cy = area.y + area.height / 2

    if (horizontal) {
      // Rings stacked left to right, width = data value, height = ring thickness
      const totalW = area.width * 0.9
      const ringW = (totalW - gap * (numRings - 1)) / numRings
      const maxH = area.height * 0.85 * intensity
      const startX = cx - totalW / 2

      for (let i = 0; i < numRings; i++) {
        const norm = Math.abs(values[i]!) / maxVal
        const h = maxH * (0.15 + norm * 0.85)
        const x = startX + i * (ringW + gap)
        const y = cy - h / 2
        const color = options.colors[i % options.colors.length]!
        const colorIndex = i % options.colors.length
        const r = Math.min(ringW * 0.25, h * 0.15, 8)

        const segNodes: RenderNode[] = []
        segNodes.push(rect(x, y, ringW, h, {
          fill: `url(#chartts-bar-${colorIndex})`,
          stroke: color,
          strokeWidth: 1,
          rx: r, ry: r,
          opacity: 0.92,
          'data-series': 0,
          'data-index': i,
          tabindex: 0,
          role: 'img',
          ariaLabel: `${data.labels[i] ?? `Ring ${i + 1}`}: ${values[i]}`,
        }))

        if (showLabels) {
          const label = data.labels[i] != null ? String(data.labels[i]) : ''
          const valStr = label ? `${label}\n${values[i]}` : String(values[i])
          segNodes.push(text(x + ringW / 2, cy, valStr, {
            fill: theme.textColor,
            textAnchor: 'middle',
            dominantBaseline: 'central',
            fontSize: theme.fontSize - 1,
            fontFamily: theme.fontFamily,
            fontWeight: 600,
          }))
        }

        nodes.push(group(segNodes, {
          class: `chartts-series chartts-series-${i}`,
          'data-series-name': String(data.labels[i] ?? `Ring ${i + 1}`),
        }))
      }
    } else {
      // Vertical: rings stacked top to bottom, height = ring thickness, width = data value
      const totalH = area.height * 0.9
      const ringH = (totalH - gap * (numRings - 1)) / numRings
      const maxW = area.width * 0.85 * intensity
      const startY = cy - totalH / 2

      for (let i = 0; i < numRings; i++) {
        const norm = Math.abs(values[i]!) / maxVal
        const w = maxW * (0.15 + norm * 0.85)
        const x = cx - w / 2
        const y = startY + i * (ringH + gap)
        const color = options.colors[i % options.colors.length]!
        const colorIndex = i % options.colors.length
        const r = Math.min(w * 0.08, ringH * 0.25, 8)

        const segNodes: RenderNode[] = []
        segNodes.push(rect(x, y, w, ringH, {
          fill: `url(#chartts-bar-${colorIndex})`,
          stroke: color,
          strokeWidth: 1,
          rx: r, ry: r,
          opacity: 0.92,
          'data-series': 0,
          'data-index': i,
          tabindex: 0,
          role: 'img',
          ariaLabel: `${data.labels[i] ?? `Ring ${i + 1}`}: ${values[i]}`,
        }))

        if (showLabels) {
          const label = data.labels[i] != null ? String(data.labels[i]) : ''
          const valStr = label ? `${label}: ${values[i]}` : String(values[i])
          segNodes.push(text(cx, y + ringH / 2, valStr, {
            fill: theme.textColor,
            textAnchor: 'middle',
            dominantBaseline: 'central',
            fontSize: theme.fontSize - 1,
            fontFamily: theme.fontFamily,
            fontWeight: 600,
          }))
        }

        nodes.push(group(segNodes, {
          class: `chartts-series chartts-series-${i}`,
          'data-series-name': String(data.labels[i] ?? `Ring ${i + 1}`),
        }))
      }
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area, options } = ctx
    const series = data.series[0]
    if (!series || series.values.length === 0) return null

    const opts = options as unknown as PillarOptions
    const horizontal = opts.orientation === 'horizontal'
    const numRings = series.values.length
    const gap = 3
    const cx = area.x + area.width / 2
    const cy = area.y + area.height / 2

    if (horizontal) {
      const totalW = area.width * 0.9
      const ringW = (totalW - gap * (numRings - 1)) / numRings
      const startX = cx - totalW / 2
      const idx = Math.floor((mx - startX) / (ringW + gap))
      if (idx < 0 || idx >= numRings) return null
      const ringCx = startX + idx * (ringW + gap) + ringW / 2
      return { seriesIndex: 0, pointIndex: idx, distance: Math.abs(mx - ringCx), x: ringCx, y: cy }
    } else {
      const totalH = area.height * 0.9
      const ringH = (totalH - gap * (numRings - 1)) / numRings
      const startY = cy - totalH / 2
      const idx = Math.floor((my - startY) / (ringH + gap))
      if (idx < 0 || idx >= numRings) return null
      const ringCy = startY + idx * (ringH + gap) + ringH / 2
      return { seriesIndex: 0, pointIndex: idx, distance: Math.abs(my - ringCy), x: cx, y: ringCy }
    }
  },
}
