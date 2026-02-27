import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareData } from '../../data/prepare'
import { group, rect, line } from '../../render/tree'
import { getBandwidth } from '../../utils/scale'

/**
 * Boxplot / Whisker chart — displays statistical distribution for each category.
 *
 * Data format: each series has exactly 5 values per label:
 * [min, Q1, median, Q3, max]
 *
 * For simplicity, if there are N labels, series[0] has N*5 values:
 * [min1, q1_1, med1, q3_1, max1, min2, q1_2, med2, q3_2, max2, ...]
 *
 * Or use multiple series where each series has 5 values for its category.
 */
export interface BoxplotOptions {
  /** Width ratio of boxes. Default 0.6. */
  boxWidth?: number
}

export const boxplotChartType: ChartTypePlugin = {
  type: 'boxplot',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    // Boxplot: single series with N*5 values. Create synthetic labels if needed.
    // We need to trick the validator: expand labels to match values length.
    const labelCount = data.labels?.length ?? 0
    const valLen = data.series[0]?.values.length ?? 0
    const syntheticData = { ...data }
    if (labelCount > 0 && valLen > labelCount) {
      // Pad labels to match values length (validator needs them equal)
      const padded: string[] = (data.labels ?? []).map(String)
      while (padded.length < valLen) padded.push('')
      syntheticData.labels = padded
    }

    const prepared = prepareData(syntheticData, options)

    // Restore original labels for rendering
    if (data.labels && data.labels.length < valLen) {
      prepared.labels = [...data.labels]
    }

    return prepared
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, options, xScale, yScale } = ctx
    const nodes: RenderNode[] = []

    // Each series represents one boxplot: 5 values = [min, Q1, median, Q3, max]
    const seriesCount = data.series.length
    if (seriesCount === 0) return nodes

    const bOpts = options as unknown as BoxplotOptions
    const boxWidthRatio = bOpts.boxWidth ?? 0.6

    const bw = getBandwidth(xScale)
    const boxWidth = bw * boxWidthRatio

    for (let i = 0; i < data.labels.length; i++) {
      // Collect the 5 values for this label from all series,
      // or if single series with N*5 values, extract 5 at offset i*5
      let vals: number[]
      if (data.series.length === 1) {
        const s = data.series[0]!
        if (s.values.length >= (i + 1) * 5) {
          vals = s.values.slice(i * 5, i * 5 + 5)
        } else continue
      } else if (data.series.length > i && data.series[i]!.values.length >= 5) {
        vals = data.series[i]!.values.slice(0, 5)
      } else continue

      const [vMin, q1, median, q3, vMax] = vals as [number, number, number, number, number]
      const cx = xScale.map(i)
      const boxX = cx - boxWidth / 2

      const yMin = yScale.map(vMin)
      const yQ1 = yScale.map(q1)
      const yMed = yScale.map(median)
      const yQ3 = yScale.map(q3)
      const yMax = yScale.map(vMax)

      const color = options.colors[i % options.colors.length]!
      const seriesIdx = Math.min(i, data.series.length - 1)
      const boxNodes: RenderNode[] = []

      // Whisker line (min to max)
      boxNodes.push(line(cx, yMin, cx, yMax, {
        class: 'chartts-boxplot-whisker',
        stroke: color,
        strokeWidth: 1.5,
      }))

      // Min whisker cap
      boxNodes.push(line(cx - boxWidth * 0.3, yMin, cx + boxWidth * 0.3, yMin, {
        class: 'chartts-boxplot-cap',
        stroke: color,
        strokeWidth: 1.5,
      }))

      // Max whisker cap
      boxNodes.push(line(cx - boxWidth * 0.3, yMax, cx + boxWidth * 0.3, yMax, {
        class: 'chartts-boxplot-cap',
        stroke: color,
        strokeWidth: 1.5,
      }))

      // IQR box (Q1 to Q3)
      const boxTop = Math.min(yQ1, yQ3)
      const boxH = Math.abs(yQ3 - yQ1)
      boxNodes.push(rect(boxX, boxTop, boxWidth, boxH, {
        class: 'chartts-boxplot-box',
        fill: color,
        fillOpacity: 0.25,
        stroke: color,
        strokeWidth: 1.5,
        rx: 4,
        ry: 4,
        'data-series': seriesIdx,
        'data-index': i,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${data.labels[i]}: min=${vMin}, Q1=${q1}, median=${median}, Q3=${q3}, max=${vMax}`,
      }))

      // Median line
      boxNodes.push(line(boxX, yMed, boxX + boxWidth, yMed, {
        class: 'chartts-boxplot-median',
        stroke: color,
        strokeWidth: 2.5,
      }))

      nodes.push(group(boxNodes, {
        class: `chartts-series chartts-series-${i}`,
        'data-series-name': String(data.labels[i]),
      }))
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, xScale, yScale, options } = ctx
    if (data.labels.length === 0) return null

    const bOpts = options as unknown as BoxplotOptions
    const boxWidthRatio = bOpts.boxWidth ?? 0.6
    const bw = getBandwidth(xScale)
    const boxWidth = bw * boxWidthRatio

    for (let i = 0; i < data.labels.length; i++) {
      let vals: number[]
      if (data.series.length === 1) {
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

      if (mx >= cx - boxWidth / 2 - 4 && mx <= cx + boxWidth / 2 + 4 &&
          my >= top - 4 && my <= bottom + 4) {
        const seriesIdx = Math.min(i, data.series.length - 1)
        return { seriesIndex: seriesIdx, pointIndex: i, distance: 0, x: cx, y: yScale.map(vals[2]!) }
      }
    }

    return null
  },
}
