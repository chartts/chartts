import { onMount, onCleanup, createEffect, splitProps } from 'solid-js'
import type { Component } from 'solid-js'
import {
  createChart, CHART_TYPES,
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
// Generate chart components from CHART_TYPES map
// ---------------------------------------------------------------------------

const _components = Object.fromEntries(
  Object.entries(CHART_TYPES).map(([name, plugin]) => [
    `${name}Chart`,
    createChartComponent(plugin),
  ]),
) as Record<string, Component<ChartProps>>

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
