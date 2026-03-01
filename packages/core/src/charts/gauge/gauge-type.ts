import type {
  ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode,
} from '../../types'
import { defineChartType } from '../../api/define'
import { prepareNoAxes } from '../../utils/prepare'
import { path, circle, text } from '../../render/tree'
import { PathBuilder } from '../../render/tree'

export interface GaugeOptions extends ResolvedOptions {
  /** Minimum value. Default 0. */
  gaugeMin?: number
  /** Maximum value. Default 100. */
  gaugeMax?: number
  /** Show value text in center. Default true. */
  showValue?: boolean
  /** Value format function. Default: round to int. */
  valueFormat?: (v: number) => string
}

/**
 * Gauge / Meter chart — single-value 240° arc with stroke-based rendering.
 *
 * Uses stroke-linecap:round for clean rounded endcaps. No fill-based donut arcs.
 * Looks like a modern dashboard gauge (Grafana, Material style).
 */
export const gaugeChartType = defineChartType({
  type: 'gauge',
  suppressAxes: true,


  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme, options } = ctx
    const nodes: RenderNode[] = []

    const series = data.series[0]
    if (!series || series.values.length === 0) return nodes

    const gOpts = options as GaugeOptions
    const min = gOpts.gaugeMin ?? 0
    const max = gOpts.gaugeMax ?? 100
    const showValue = gOpts.showValue ?? true
    const valueFormat = gOpts.valueFormat ?? ((v: number) => String(Math.round(v)))

    const value = series.values[0]!
    const pct = Math.max(0, Math.min(1, (value - min) / (max - min || 1)))

    // ----- Layout -----
    const cx = area.x + area.width / 2

    // Arc angles: 240° sweep, opening at the bottom
    // Start at 150° (bottom-left), sweep CW to 30° (bottom-right)
    const toRad = (d: number) => (d * Math.PI) / 180
    const startRad = toRad(150)
    const endRad = toRad(390)  // 390° = 30° but keeps sweep direction clear

    // Size the arc to fit within the area with padding for labels
    // The arc bottom-most points are at 150° and 30° — y = cy + r*sin(30°) = cy + r*0.5
    // The arc top is at cy - r
    // Below the arc we need ~50px for value text, label, min/max
    const labelSpace = Math.min(60, area.height * 0.22)
    const availH = area.height - labelSpace
    // Arc top to arc bottom-endpoints: r + r*sin(30°) = r*1.5
    // So r*1.5 + strokeW <= availH
    const maxRadiusH = (availH - 8) / 1.55
    const maxRadiusW = (area.width - 16) / 2
    const radius = Math.min(maxRadiusH, maxRadiusW)
    const strokeW = Math.max(12, Math.min(radius * 0.18, 28))

    // Position: the top of the arc (cy - radius - strokeW/2) should be just inside area.y
    const cy = area.y + radius + strokeW / 2 + 4

    // Arc bottom-left/right y coordinate
    const arcBottomY = cy + radius * Math.sin(toRad(30))

    // ----- Track arc (background) -----
    nodes.push(path(strokeArc(cx, cy, radius, startRad, endRad), {
      class: 'chartts-gauge-track',
      stroke: theme.gridColor,
      strokeWidth: strokeW,
      fill: 'none',
      opacity: 0.3,
      style: 'stroke-linecap:round',
    }))

    // ----- Value arc -----
    const color = options.colors[0]!
    if (pct > 0.005) {
      const valueRad = startRad + (endRad - startRad) * pct
      nodes.push(path(strokeArc(cx, cy, radius, startRad, valueRad), {
        class: 'chartts-gauge-fill',
        stroke: color,
        strokeWidth: strokeW,
        fill: 'none',
        style: 'stroke-linecap:round',
        'data-series': 0,
        'data-index': 0,
      }))
    }

    // ----- Needle -----
    const needleAngle = startRad + (endRad - startRad) * pct
    const needleLen = radius - strokeW / 2 - 2
    const needleTipX = cx + needleLen * Math.cos(needleAngle)
    const needleTipY = cy + needleLen * Math.sin(needleAngle)

    // Tapered needle triangle
    const baseR = 3.5
    const bAngle1 = needleAngle + Math.PI / 2
    const bAngle2 = needleAngle - Math.PI / 2
    const npb = new PathBuilder()
    npb.moveTo(needleTipX, needleTipY)
    npb.lineTo(cx + baseR * Math.cos(bAngle1), cy + baseR * Math.sin(bAngle1))
    npb.lineTo(cx + baseR * Math.cos(bAngle2), cy + baseR * Math.sin(bAngle2))
    npb.close()

    nodes.push(path(npb.build(), {
      class: 'chartts-gauge-needle',
      fill: color,
      opacity: 0.85,
    }))

    // Center cap
    nodes.push(circle(cx, cy, 5, {
      class: 'chartts-gauge-needle-cap',
      fill: color,
    }))

    // ----- Labels -----
    if (showValue) {
      // Big value — in the gap below the arc center
      const valueFontSize = Math.max(16, Math.min(radius * 0.35, 40))
      const valueY = arcBottomY + labelSpace * 0.28
      nodes.push(text(cx, valueY, valueFormat(value), {
        class: 'chartts-gauge-value',
        fill: theme.textColor,
        textAnchor: 'middle',
        dominantBaseline: 'central',
        fontSize: valueFontSize,
        fontFamily: theme.fontFamily,
        fontWeight: 700,
      }))

      // Series name
      if (series.name) {
        nodes.push(text(cx, valueY + valueFontSize * 0.85, series.name, {
          class: 'chartts-gauge-label',
          fill: theme.textMuted,
          textAnchor: 'middle',
          dominantBaseline: 'central',
          fontSize: theme.fontSizeSmall,
          fontFamily: theme.fontFamily,
        }))
      }

      // Min / Max at arc endpoints
      const minX = cx + radius * Math.cos(startRad)
      const minY = cy + radius * Math.sin(startRad) + strokeW / 2 + 12
      nodes.push(text(minX, minY, valueFormat(min), {
        class: 'chartts-gauge-min',
        fill: theme.textMuted,
        textAnchor: 'middle',
        dominantBaseline: 'central',
        fontSize: theme.fontSizeSmall,
        fontFamily: theme.fontFamily,
      }))

      const maxX = cx + radius * Math.cos(toRad(30))
      const maxY = cy + radius * Math.sin(toRad(30)) + strokeW / 2 + 12
      nodes.push(text(maxX, maxY, valueFormat(max), {
        class: 'chartts-gauge-max',
        fill: theme.textMuted,
        textAnchor: 'middle',
        dominantBaseline: 'central',
        fontSize: theme.fontSizeSmall,
        fontFamily: theme.fontFamily,
      }))
    }

    return nodes
  },

})

/**
 * Stroke-based arc path (open, for use with thick stroke + stroke-linecap:round).
 * Angles in radians, CW from positive X axis (SVG convention).
 */
function strokeArc(
  cx: number, cy: number, r: number,
  startAngle: number, endAngle: number,
): string {
  const pb = new PathBuilder()
  const x1 = cx + r * Math.cos(startAngle)
  const y1 = cy + r * Math.sin(startAngle)
  const x2 = cx + r * Math.cos(endAngle)
  const y2 = cy + r * Math.sin(endAngle)

  let span = endAngle - startAngle
  if (span < 0) span += 2 * Math.PI
  const largeArc = span > Math.PI

  pb.moveTo(x1, y1)
  pb.arc(r, r, 0, largeArc, true, x2, y2)
  return pb.build()
}
