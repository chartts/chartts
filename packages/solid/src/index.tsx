import { onMount, onCleanup, createEffect, splitProps } from 'solid-js'
import type { Component } from 'solid-js'
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
// Props
// ---------------------------------------------------------------------------

export interface ChartProps extends ChartOptions {
  data: ChartData
  class?: string
  ref?: (instance: ChartInstance) => void
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

function createChartComponent(chartType: ChartTypePlugin): Component<ChartProps> {
  return (props: ChartProps) => {
    let container!: HTMLDivElement
    let instance: ChartInstance | null = null
    const [local, options] = splitProps(props, ['data', 'class', 'ref'])

    onMount(() => {
      instance = createChart(container, chartType, local.data, options)
      local.ref?.(instance)
    })

    createEffect(() => {
      instance?.setData(local.data)
    })

    createEffect(() => {
      const opts = { ...options }
      instance?.setOptions(opts)
    })

    onCleanup(() => {
      instance?.destroy()
      instance = null
    })

    return <div ref={container} class={local.class} />
  }
}

// ---------------------------------------------------------------------------
// Chart components — one per chart type
// ---------------------------------------------------------------------------

export const LineChart = createChartComponent(lineChartType)
export const BarChart = createChartComponent(barChartType)
export const StackedBarChart = createChartComponent(stackedBarChartType)
export const HorizontalBarChart = createChartComponent(horizontalBarChartType)
export const PieChart = createChartComponent(pieChartType)
export const DonutChart = createChartComponent(donutChartType)
export const ScatterChart = createChartComponent(scatterChartType)
export const SparklineChart = createChartComponent(sparklineChartType)
export const AreaChart = createChartComponent(areaChartType)
export const RadarChart = createChartComponent(radarChartType)
export const BubbleChart = createChartComponent(bubbleChartType)
export const CandlestickChart = createChartComponent(candlestickChartType)
export const GaugeChart = createChartComponent(gaugeChartType)
export const WaterfallChart = createChartComponent(waterfallChartType)
export const FunnelChart = createChartComponent(funnelChartType)
export const HeatmapChart = createChartComponent(heatmapChartType)
export const BoxplotChart = createChartComponent(boxplotChartType)
export const HistogramChart = createChartComponent(histogramChartType)
export const TreemapChart = createChartComponent(treemapChartType)
export const PolarChart = createChartComponent(polarChartType)
export const RadialBarChart = createChartComponent(radialBarChartType)
export const LollipopChart = createChartComponent(lollipopChartType)
export const BulletChart = createChartComponent(bulletChartType)
export const DumbbellChart = createChartComponent(dumbbellChartType)
export const CalendarChart = createChartComponent(calendarChartType)
export const ComboChart = createChartComponent(comboChartType)
export const SankeyChart = createChartComponent(sankeyChartType)
export const SunburstChart = createChartComponent(sunburstChartType)
export const TreeChart = createChartComponent(treeChartType)
export const GraphChart = createChartComponent(graphChartType)
export const ParallelChart = createChartComponent(parallelChartType)
export const ThemeRiverChart = createChartComponent(themeRiverChartType)
export const PictorialBarChart = createChartComponent(pictorialBarChartType)
export const ChordChart = createChartComponent(chordChartType)
export const GeoChart = createChartComponent(geoChartType)
export const LinesChart = createChartComponent(linesChartType)
export const MatrixChart = createChartComponent(matrixChartType)
export const CustomChart = createChartComponent(customChartType)
export const OHLCChart = createChartComponent(ohlcChartType)
export const StepChart = createChartComponent(stepChartType)
export const VolumeChart = createChartComponent(volumeChartType)
export const RangeChart = createChartComponent(rangeChartType)
export const BaselineChart = createChartComponent(baselineChartType)
export const KagiChart = createChartComponent(kagiChartType)
export const RenkoChart = createChartComponent(renkoChartType)

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
