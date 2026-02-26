import {
  useRef, useEffect, forwardRef, useImperativeHandle,
  type Ref,
} from 'react'
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
// Shared hook — manages chart lifecycle, data updates, and options
// ---------------------------------------------------------------------------

function useChart(
  ref: React.RefObject<HTMLDivElement | null>,
  chartType: ChartTypePlugin,
  data: ChartData,
  options: ChartOptions,
): React.RefObject<ChartInstance | null> {
  const instance = useRef<ChartInstance | null>(null)

  useEffect(() => {
    if (!ref.current) return

    instance.current = createChart(ref.current, chartType, data, options)

    return () => {
      instance.current?.destroy()
      instance.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref.current])

  useEffect(() => {
    instance.current?.setData(data)
  }, [data])

  useEffect(() => {
    instance.current?.setOptions(options)
  }, [options])

  return instance
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ChartProps extends ChartOptions {
  data: ChartData
  className?: string
  style?: React.CSSProperties
  /** Show loading skeleton instead of chart */
  loading?: boolean
  /** Show error state with optional message */
  error?: string | boolean
  /** Show empty state with optional message */
  empty?: string | boolean
}

// ---------------------------------------------------------------------------
// Factory — generates typed chart components from chart type plugins
// ---------------------------------------------------------------------------

function createChartComponent(chartType: ChartTypePlugin, displayName: string) {
  const Component = forwardRef<ChartInstance, ChartProps>(
    function ChartComponent(
      { data, className, style, loading, error, empty, ...options }: ChartProps,
      fwdRef: Ref<ChartInstance>,
    ) {
      const container = useRef<HTMLDivElement | null>(null)
      const instance = useChart(container, chartType, data, options)

      useImperativeHandle(fwdRef, () => instance.current!, [instance])

      // Handle state props
      useEffect(() => {
        if (!instance.current) return
        if (loading) {
          instance.current.setLoading(true)
        } else if (error) {
          instance.current.setError(typeof error === 'string' ? error : undefined)
        } else if (empty) {
          instance.current.setEmpty(typeof empty === 'string' ? empty : undefined)
        } else {
          instance.current.setLoading(false)
        }
      }, [loading, error, empty])

      return <div ref={container} className={className} style={style} />
    },
  )
  Component.displayName = displayName
  return Component
}

// ---------------------------------------------------------------------------
// Chart components — one per chart type
// ---------------------------------------------------------------------------

export const LineChart = createChartComponent(lineChartType, 'LineChart')
export const BarChart = createChartComponent(barChartType, 'BarChart')
export const StackedBarChart = createChartComponent(stackedBarChartType, 'StackedBarChart')
export const HorizontalBarChart = createChartComponent(horizontalBarChartType, 'HorizontalBarChart')
export const PieChart = createChartComponent(pieChartType, 'PieChart')
export const DonutChart = createChartComponent(donutChartType, 'DonutChart')
export const ScatterChart = createChartComponent(scatterChartType, 'ScatterChart')
export const SparklineChart = createChartComponent(sparklineChartType, 'SparklineChart')
export const AreaChart = createChartComponent(areaChartType, 'AreaChart')
export const RadarChart = createChartComponent(radarChartType, 'RadarChart')
export const BubbleChart = createChartComponent(bubbleChartType, 'BubbleChart')
export const CandlestickChart = createChartComponent(candlestickChartType, 'CandlestickChart')
export const GaugeChart = createChartComponent(gaugeChartType, 'GaugeChart')
export const WaterfallChart = createChartComponent(waterfallChartType, 'WaterfallChart')
export const FunnelChart = createChartComponent(funnelChartType, 'FunnelChart')
export const HeatmapChart = createChartComponent(heatmapChartType, 'HeatmapChart')
export const BoxplotChart = createChartComponent(boxplotChartType, 'BoxplotChart')
export const HistogramChart = createChartComponent(histogramChartType, 'HistogramChart')
export const TreemapChart = createChartComponent(treemapChartType, 'TreemapChart')
export const PolarChart = createChartComponent(polarChartType, 'PolarChart')
export const RadialBarChart = createChartComponent(radialBarChartType, 'RadialBarChart')
export const LollipopChart = createChartComponent(lollipopChartType, 'LollipopChart')
export const BulletChart = createChartComponent(bulletChartType, 'BulletChart')
export const DumbbellChart = createChartComponent(dumbbellChartType, 'DumbbellChart')
export const CalendarChart = createChartComponent(calendarChartType, 'CalendarChart')
export const ComboChart = createChartComponent(comboChartType, 'ComboChart')
export const SankeyChart = createChartComponent(sankeyChartType, 'SankeyChart')
export const SunburstChart = createChartComponent(sunburstChartType, 'SunburstChart')
export const TreeChart = createChartComponent(treeChartType, 'TreeChart')
export const GraphChart = createChartComponent(graphChartType, 'GraphChart')
export const ParallelChart = createChartComponent(parallelChartType, 'ParallelChart')
export const ThemeRiverChart = createChartComponent(themeRiverChartType, 'ThemeRiverChart')
export const PictorialBarChart = createChartComponent(pictorialBarChartType, 'PictorialBarChart')
export const ChordChart = createChartComponent(chordChartType, 'ChordChart')
export const GeoChart = createChartComponent(geoChartType, 'GeoChart')
export const LinesChart = createChartComponent(linesChartType, 'LinesChart')
export const MatrixChart = createChartComponent(matrixChartType, 'MatrixChart')
export const CustomChart = createChartComponent(customChartType, 'CustomChart')
export const OHLCChart = createChartComponent(ohlcChartType, 'OHLCChart')
export const StepChart = createChartComponent(stepChartType, 'StepChart')
export const VolumeChart = createChartComponent(volumeChartType, 'VolumeChart')
export const RangeChart = createChartComponent(rangeChartType, 'RangeChart')
export const BaselineChart = createChartComponent(baselineChartType, 'BaselineChart')
export const KagiChart = createChartComponent(kagiChartType, 'KagiChart')
export const RenkoChart = createChartComponent(renkoChartType, 'RenkoChart')

// ---------------------------------------------------------------------------
// Generic Chart — pass any ChartTypePlugin
// ---------------------------------------------------------------------------

export interface GenericChartProps extends ChartProps {
  type: ChartTypePlugin
}

export const Chart = forwardRef<ChartInstance, GenericChartProps>(
  function Chart(
    { type, data, className, style, loading, error, empty, ...options }: GenericChartProps,
    fwdRef: Ref<ChartInstance>,
  ) {
    const container = useRef<HTMLDivElement | null>(null)
    const instance = useChart(container, type, data, options)

    useImperativeHandle(fwdRef, () => instance.current!, [instance])

    useEffect(() => {
      if (!instance.current) return
      if (loading) {
        instance.current.setLoading(true)
      } else if (error) {
        instance.current.setError(typeof error === 'string' ? error : undefined)
      } else if (empty) {
        instance.current.setEmpty(typeof empty === 'string' ? empty : undefined)
      } else {
        instance.current.setLoading(false)
      }
    }, [loading, error, empty])

    return <div ref={container} className={className} style={style} />
  },
)

// ---------------------------------------------------------------------------
// useChart hook for advanced use cases
// ---------------------------------------------------------------------------

export { useChart }

// ---------------------------------------------------------------------------
// Re-exports from core
// ---------------------------------------------------------------------------

export {
  // Chart type plugins
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
  // Theme
  resolveTheme, applyTheme,
  LIGHT_THEME, DARK_THEME, PALETTE,
  THEME_PRESETS, CORPORATE_THEME, SAAS_THEME, STARTUP_THEME, EDITORIAL_THEME, OCEAN_THEME,
  // Formatters
  formatValue, formatPercent,
} from '@chartts/core'
export type { ChartData, ChartOptions, ChartInstance, ChartTypePlugin, ThemeConfig, Series } from '@chartts/core'
