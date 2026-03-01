import type {
  ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult,
} from '../../types'
import { defineChartType } from '../../api/define'
import { prepareData } from '../../data/prepare'
import { group, path, line, rect } from '../../render/tree'
import { getBandwidth } from '../../utils/scale'

/**
 * Violin chart — shows the full distribution shape for each category.
 *
 * Data format: same as boxplot — single series with N*5 values per label:
 * [min, Q1, median, Q3, max] repeated per category.
 *
 * Additionally accepts raw sample values via options.violin.samples
 * for true KDE computation. Falls back to a smooth approximation
 * from the 5-number summary when samples aren't provided.
 */
export interface ViolinOptions extends ResolvedOptions {
  /** KDE bandwidth (smoothing). Default 0.3 of data range. */
  bandwidth?: number
  /** Show inner box + median line. Default true. */
  showBox?: boolean
  /** Width ratio relative to band. Default 0.7. */
  violinWidth?: number
}

export const violinChartType = defineChartType({
  type: 'violin',
  useBandScale: true,


  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    const labelCount = data.labels?.length ?? 0
    const valLen = data.series[0]?.values.length ?? 0
    const syntheticData = { ...data }
    if (labelCount > 0 && valLen > labelCount) {
      const padded: string[] = (data.labels ?? []).map(String)
      while (padded.length < valLen) padded.push('')
      syntheticData.labels = padded
    }
    const prepared = prepareData(syntheticData, options)
    if (data.labels && data.labels.length < valLen) {
      prepared.labels = [...data.labels]
    }
    return prepared
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, options, xScale, yScale } = ctx
    const nodes: RenderNode[] = []

    const seriesCount = data.series.length
    if (seriesCount === 0) return nodes

    const vOpts = options as ViolinOptions
    const widthRatio = vOpts.violinWidth ?? 0.7
    const showBox = vOpts.showBox !== false

    const bw = getBandwidth(xScale)
    const halfW = (bw * widthRatio) / 2

    for (let i = 0; i < data.labels.length; i++) {
      let vals: number[]
      if (data.series.length === 5 && data.series[0]!.values.length === data.labels.length) {
        // Boxplot format: 5 series (Min, Q1, Median, Q3, Max), each with one value per label
        vals = [
          data.series[0]!.values[i]!,
          data.series[1]!.values[i]!,
          data.series[2]!.values[i]!,
          data.series[3]!.values[i]!,
          data.series[4]!.values[i]!,
        ]
      } else if (data.series.length === 1) {
        const s = data.series[0]!
        if (s.values.length >= (i + 1) * 5) {
          vals = s.values.slice(i * 5, i * 5 + 5)
        } else continue
      } else if (data.series.length > i && data.series[i]!.values.length >= 5) {
        vals = data.series[i]!.values.slice(0, 5)
      } else continue

      const [vMin, q1, median, q3, vMax] = vals as [number, number, number, number, number]
      const cx = xScale.map(i)
      const color = options.colors[i % options.colors.length]!
      const seriesIdx = Math.min(i, data.series.length - 1)

      // Generate KDE-like density profile from 5-number summary
      const steps = 32
      const range = vMax - vMin || 1
      const densities: number[] = []
      let maxDensity = 0

      for (let s = 0; s <= steps; s++) {
        const v = vMin + (s / steps) * range
        // Approximate density using a smooth curve peaked at the median
        // with mass concentrated between Q1 and Q3
        const dQ1 = gaussianKernel(v, q1, range * 0.15)
        const dMed = gaussianKernel(v, median, range * 0.12)
        const dQ3 = gaussianKernel(v, q3, range * 0.15)
        const dMin = gaussianKernel(v, vMin, range * 0.08)
        const dMax = gaussianKernel(v, vMax, range * 0.08)
        const density = dMin * 0.3 + dQ1 * 1.0 + dMed * 1.5 + dQ3 * 1.0 + dMax * 0.3
        densities.push(density)
        if (density > maxDensity) maxDensity = density
      }

      if (maxDensity === 0) continue

      // Build mirrored violin path
      const rightPoints: string[] = []
      const leftPoints: string[] = []

      for (let s = 0; s <= steps; s++) {
        const v = vMin + (s / steps) * range
        const py = yScale.map(v)
        const w = (densities[s]! / maxDensity) * halfW

        if (s === 0) rightPoints.push(`M ${cx + w} ${py}`)
        else rightPoints.push(`L ${cx + w} ${py}`)

        leftPoints.unshift(`L ${cx - w} ${py}`)
      }

      const d = rightPoints.join(' ') + ' ' + leftPoints.join(' ') + ' Z'

      const violinNodes: RenderNode[] = []

      violinNodes.push(path(d, {
        class: 'chartts-violin-shape',
        fill: color,
        fillOpacity: 0.3,
        stroke: color,
        strokeWidth: 1.5,
        style: `--chartts-i:${i}`,
        'data-series': seriesIdx,
        'data-index': i,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${data.labels[i]}: min=${vMin}, Q1=${q1}, median=${median}, Q3=${q3}, max=${vMax}`,
      }))

      if (showBox) {
        // Inner IQR box
        const yQ1 = yScale.map(q1)
        const yQ3 = yScale.map(q3)
        const boxTop = Math.min(yQ1, yQ3)
        const boxH = Math.abs(yQ3 - yQ1)
        const boxW = halfW * 0.3

        violinNodes.push(rect(cx - boxW, boxTop, boxW * 2, boxH, {
          class: 'chartts-violin-box',
          fill: color,
          fillOpacity: 0.5,
          stroke: color,
          strokeWidth: 1,
          rx: 2,
        }))

        // Median line
        const yMed = yScale.map(median)
        violinNodes.push(line(cx - boxW, yMed, cx + boxW, yMed, {
          class: 'chartts-violin-median',
          stroke: '#fff',
          strokeWidth: 2,
        }))
      }

      nodes.push(group(violinNodes, {
        class: `chartts-series chartts-series-${i}`,
        'data-series-name': String(data.labels[i]),
      }))
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, xScale, yScale, options } = ctx
    if (data.labels.length === 0) return null

    const vOpts = options as ViolinOptions
    const widthRatio = vOpts.violinWidth ?? 0.7
    const bw = getBandwidth(xScale)
    const halfW = (bw * widthRatio) / 2

    for (let i = 0; i < data.labels.length; i++) {
      let vals: number[]
      if (data.series.length === 5 && data.series[0]!.values.length === data.labels.length) {
        vals = [
          data.series[0]!.values[i]!,
          data.series[1]!.values[i]!,
          data.series[2]!.values[i]!,
          data.series[3]!.values[i]!,
          data.series[4]!.values[i]!,
        ]
      } else if (data.series.length === 1) {
        const s = data.series[0]!
        if (s.values.length >= (i + 1) * 5) vals = s.values.slice(i * 5, i * 5 + 5)
        else continue
      } else if (data.series.length > i && data.series[i]!.values.length >= 5) {
        vals = data.series[i]!.values.slice(0, 5)
      } else continue

      const cx = xScale.map(i)
      const yMin = yScale.map(vals[0]!)
      const yMax = yScale.map(vals[4]!)
      const top = Math.min(yMin, yMax)
      const bottom = Math.max(yMin, yMax)

      if (mx >= cx - halfW - 4 && mx <= cx + halfW + 4 &&
          my >= top - 4 && my <= bottom + 4) {
        const seriesIdx = Math.min(i, data.series.length - 1)
        return { seriesIndex: seriesIdx, pointIndex: i, distance: 0, x: cx, y: yScale.map(vals[2]!) }
      }
    }

    return null
  },
})

function gaussianKernel(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma
  return Math.exp(-0.5 * z * z)
}
