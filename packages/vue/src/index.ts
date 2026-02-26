import {
  defineComponent, ref, onMounted, onUnmounted, watch, h,
  type PropType,
} from 'vue'
import {
  createChart,
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
// Chart components — one per chart type
// ---------------------------------------------------------------------------

export const LineChart = createVueChart(lineChartType, 'LineChart')
export const BarChart = createVueChart(barChartType, 'BarChart')
export const StackedBarChart = createVueChart(stackedBarChartType, 'StackedBarChart')
export const HorizontalBarChart = createVueChart(horizontalBarChartType, 'HorizontalBarChart')
export const PieChart = createVueChart(pieChartType, 'PieChart')
export const DonutChart = createVueChart(donutChartType, 'DonutChart')
export const ScatterChart = createVueChart(scatterChartType, 'ScatterChart')
export const SparklineChart = createVueChart(sparklineChartType, 'SparklineChart')
export const AreaChart = createVueChart(areaChartType, 'AreaChart')
export const RadarChart = createVueChart(radarChartType, 'RadarChart')
export const BubbleChart = createVueChart(bubbleChartType, 'BubbleChart')
export const CandlestickChart = createVueChart(candlestickChartType, 'CandlestickChart')
export const GaugeChart = createVueChart(gaugeChartType, 'GaugeChart')
export const WaterfallChart = createVueChart(waterfallChartType, 'WaterfallChart')
export const FunnelChart = createVueChart(funnelChartType, 'FunnelChart')
export const HeatmapChart = createVueChart(heatmapChartType, 'HeatmapChart')
export const BoxplotChart = createVueChart(boxplotChartType, 'BoxplotChart')
export const HistogramChart = createVueChart(histogramChartType, 'HistogramChart')
export const TreemapChart = createVueChart(treemapChartType, 'TreemapChart')
export const PolarChart = createVueChart(polarChartType, 'PolarChart')
export const RadialBarChart = createVueChart(radialBarChartType, 'RadialBarChart')
export const LollipopChart = createVueChart(lollipopChartType, 'LollipopChart')
export const BulletChart = createVueChart(bulletChartType, 'BulletChart')
export const DumbbellChart = createVueChart(dumbbellChartType, 'DumbbellChart')
export const CalendarChart = createVueChart(calendarChartType, 'CalendarChart')
export const ComboChart = createVueChart(comboChartType, 'ComboChart')
export const SankeyChart = createVueChart(sankeyChartType, 'SankeyChart')
export const SunburstChart = createVueChart(sunburstChartType, 'SunburstChart')
export const TreeChart = createVueChart(treeChartType, 'TreeChart')
export const GraphChart = createVueChart(graphChartType, 'GraphChart')
export const ParallelChart = createVueChart(parallelChartType, 'ParallelChart')
export const ThemeRiverChart = createVueChart(themeRiverChartType, 'ThemeRiverChart')
export const PictorialBarChart = createVueChart(pictorialBarChartType, 'PictorialBarChart')
export const ChordChart = createVueChart(chordChartType, 'ChordChart')
export const GeoChart = createVueChart(geoChartType, 'GeoChart')
export const LinesChart = createVueChart(linesChartType, 'LinesChart')
export const MatrixChart = createVueChart(matrixChartType, 'MatrixChart')
export const CustomChart = createVueChart(customChartType, 'CustomChart')
export const OHLCChart = createVueChart(ohlcChartType, 'OHLCChart')
export const StepChart = createVueChart(stepChartType, 'StepChart')
export const VolumeChart = createVueChart(volumeChartType, 'VolumeChart')
export const RangeChart = createVueChart(rangeChartType, 'RangeChart')
export const BaselineChart = createVueChart(baselineChartType, 'BaselineChart')
export const KagiChart = createVueChart(kagiChartType, 'KagiChart')
export const RenkoChart = createVueChart(renkoChartType, 'RenkoChart')

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

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
