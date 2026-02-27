import type { ChartData, ChartOptions, ChartInstance } from '../types'
import { createChart } from './create'
import { CHART_TYPES } from './chart-types'

interface ChartConfig extends ChartOptions {
  data: ChartData
  debug?: boolean
}

type ConvenienceFunction = (target: string | HTMLElement, config: ChartConfig) => ChartInstance

/**
 * Generate all convenience functions from the CHART_TYPES map.
 * Each function is: (target, { data, ...options }) => createChart(target, plugin, data, options)
 */
function generateConvenienceFunctions(): Record<string, ConvenienceFunction> {
  const fns: Record<string, ConvenienceFunction> = {}
  for (const [name, chartType] of Object.entries(CHART_TYPES)) {
    fns[name] = (target: string | HTMLElement, config: ChartConfig): ChartInstance => {
      const { data, ...options } = config
      return createChart(target, chartType, data, options)
    }
  }
  return fns
}

const _fns = generateConvenienceFunctions()

// Export named convenience functions for backwards-compatible API
export const Line = _fns.Line!
export const Bar = _fns.Bar!
export const StackedBar = _fns.StackedBar!
export const HorizontalBar = _fns.HorizontalBar!
export const Pie = _fns.Pie!
export const Donut = _fns.Donut!
export const Scatter = _fns.Scatter!
export const Sparkline = _fns.Sparkline!
export const Area = _fns.Area!
export const Radar = _fns.Radar!
export const Bubble = _fns.Bubble!
export const Candlestick = _fns.Candlestick!
export const Gauge = _fns.Gauge!
export const Waterfall = _fns.Waterfall!
export const Funnel = _fns.Funnel!
export const Heatmap = _fns.Heatmap!
export const Boxplot = _fns.Boxplot!
export const Histogram = _fns.Histogram!
export const Treemap = _fns.Treemap!
export const Polar = _fns.Polar!
export const RadialBar = _fns.RadialBar!
export const Lollipop = _fns.Lollipop!
export const Bullet = _fns.Bullet!
export const Dumbbell = _fns.Dumbbell!
export const Calendar = _fns.Calendar!
export const Combo = _fns.Combo!
export const Sankey = _fns.Sankey!
export const Sunburst = _fns.Sunburst!
export const Tree = _fns.Tree!
export const Graph = _fns.Graph!
export const Parallel = _fns.Parallel!
export const ThemeRiver = _fns.ThemeRiver!
export const PictorialBar = _fns.PictorialBar!
export const Chord = _fns.Chord!
export const Geo = _fns.Geo!
export const Lines = _fns.Lines!
export const Matrix = _fns.Matrix!
export const Custom = _fns.Custom!
export const OHLC = _fns.OHLC!
export const Step = _fns.Step!
export const Volume = _fns.Volume!
export const Range = _fns.Range!
export const Baseline = _fns.Baseline!
export const Kagi = _fns.Kagi!
export const Renko = _fns.Renko!
export const Violin = _fns.Violin!
export const Pack = _fns.Pack!
export const Voronoi = _fns.Voronoi!
export const WordCloud = _fns.WordCloud!
export const Pillar = _fns.Pillar!
