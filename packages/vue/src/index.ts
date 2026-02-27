import {
  defineComponent, ref, onMounted, onUnmounted, watch, h,
  type PropType,
} from 'vue'
import {
  createChart, CHART_TYPES,
  type ChartData, type ChartOptions, type ChartInstance, type ChartTypePlugin,
} from '@chartts/core'

// ---------------------------------------------------------------------------
// Shared composable
// ---------------------------------------------------------------------------

function useChart(
  containerRef: ReturnType<typeof ref<HTMLDivElement | undefined>>,
  chartType: ChartTypePlugin,
  getData: () => ChartData,
  getOptions: () => ChartOptions,
) {
  let instance: ChartInstance | null = null

  onMounted(() => {
    if (!containerRef.value) return
    instance = createChart(containerRef.value, chartType, getData(), getOptions())
  })

  watch(getData, (data) => {
    instance?.setData(data)
  }, { deep: true })

  watch(getOptions, (opts) => {
    instance?.setOptions(opts)
  }, { deep: true })

  onUnmounted(() => {
    instance?.destroy()
    instance = null
  })

  return { getInstance: () => instance }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

const chartProps = {
  data: { type: Object as PropType<ChartData>, required: true as const },
  theme: { type: [String, Object] as PropType<ChartOptions['theme']> },
  width: { type: Number },
  height: { type: Number },
  xLabel: { type: String },
  yLabel: { type: String },
  xGrid: { type: Boolean },
  yGrid: { type: Boolean },
  xAxis: { type: Boolean },
  yAxis: { type: Boolean },
  legend: { type: [Boolean, String] as PropType<ChartOptions['legend']> },
  tooltip: { type: [Boolean, Object] as PropType<ChartOptions['tooltip']> },
  animate: { type: Boolean },
  colors: { type: Array as PropType<string[]> },
  curve: { type: String as PropType<ChartOptions['curve']> },
  barRadius: { type: Number },
  barGap: { type: Number },
  yMin: { type: Number },
  yMax: { type: Number },
  ariaLabel: { type: String },
}

function propsToOptions(props: Record<string, unknown>): ChartOptions {
  const opts: ChartOptions = {}
  const skip = new Set(['data', 'class', 'style'])
  for (const [key, value] of Object.entries(props)) {
    if (skip.has(key) || value === undefined) continue
    ;(opts as Record<string, unknown>)[key] = value
  }
  return opts
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

function createVueChart(chartType: ChartTypePlugin, name: string) {
  return defineComponent({
    name,
    props: chartProps,
    setup(props, { expose }) {
      const container = ref<HTMLDivElement>()
      const { getInstance } = useChart(
        container,
        chartType,
        () => props.data!,
        () => propsToOptions(props),
      )
      expose({ getInstance })
      return () => h('div', { ref: container })
    },
  })
}

// ---------------------------------------------------------------------------
// Generate chart components from CHART_TYPES map
// ---------------------------------------------------------------------------

const _components = Object.fromEntries(
  Object.entries(CHART_TYPES).map(([name, plugin]) => [
    `${name}Chart`,
    createVueChart(plugin, `${name}Chart`),
  ]),
) as Record<string, ReturnType<typeof createVueChart>>

export const LineChart = _components.LineChart!
export const BarChart = _components.BarChart!
export const StackedBarChart = _components.StackedBarChart!
export const HorizontalBarChart = _components.HorizontalBarChart!
export const PieChart = _components.PieChart!
export const DonutChart = _components.DonutChart!
export const ScatterChart = _components.ScatterChart!
export const SparklineChart = _components.SparklineChart!
export const AreaChart = _components.AreaChart!
export const RadarChart = _components.RadarChart!
export const BubbleChart = _components.BubbleChart!
export const CandlestickChart = _components.CandlestickChart!
export const GaugeChart = _components.GaugeChart!
export const WaterfallChart = _components.WaterfallChart!
export const FunnelChart = _components.FunnelChart!
export const HeatmapChart = _components.HeatmapChart!
export const BoxplotChart = _components.BoxplotChart!
export const HistogramChart = _components.HistogramChart!
export const TreemapChart = _components.TreemapChart!
export const PolarChart = _components.PolarChart!
export const RadialBarChart = _components.RadialBarChart!
export const LollipopChart = _components.LollipopChart!
export const BulletChart = _components.BulletChart!
export const DumbbellChart = _components.DumbbellChart!
export const CalendarChart = _components.CalendarChart!
export const ComboChart = _components.ComboChart!
export const SankeyChart = _components.SankeyChart!
export const SunburstChart = _components.SunburstChart!
export const TreeChart = _components.TreeChart!
export const GraphChart = _components.GraphChart!
export const ParallelChart = _components.ParallelChart!
export const ThemeRiverChart = _components.ThemeRiverChart!
export const PictorialBarChart = _components.PictorialBarChart!
export const ChordChart = _components.ChordChart!
export const GeoChart = _components.GeoChart!
export const LinesChart = _components.LinesChart!
export const MatrixChart = _components.MatrixChart!
export const CustomChart = _components.CustomChart!
export const OHLCChart = _components.OHLCChart!
export const StepChart = _components.StepChart!
export const VolumeChart = _components.VolumeChart!
export const RangeChart = _components.RangeChart!
export const BaselineChart = _components.BaselineChart!
export const KagiChart = _components.KagiChart!
export const RenkoChart = _components.RenkoChart!

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export { CHART_TYPES } from '@chartts/core'
export {
  lineChartType, barChartType, stackedBarChartType, horizontalBarChartType,
  pieChartType, donutChartType, scatterChartType, sparklineChartType,
  areaChartType, radarChartType, bubbleChartType, candlestickChartType,
  gaugeChartType, waterfallChartType, funnelChartType, heatmapChartType,
  boxplotChartType, histogramChartType, treemapChartType, polarChartType,
  radialBarChartType, lollipopChartType, bulletChartType, dumbbellChartType,
  calendarChartType, comboChartType, sankeyChartType,
  sunburstChartType, treeChartType, graphChartType, parallelChartType,
  themeRiverChartType, pictorialBarChartType, chordChartType,
  geoChartType, linesChartType, matrixChartType, customChartType,
  ohlcChartType, stepChartType, volumeChartType, rangeChartType,
  baselineChartType, kagiChartType, renkoChartType,
} from '@chartts/core'
export type { ChartData, ChartOptions, ChartInstance, ChartTypePlugin } from '@chartts/core'
