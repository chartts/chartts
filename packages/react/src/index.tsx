import {
  useRef, useEffect, forwardRef, useImperativeHandle,
  type Ref,
} from 'react'
import {
  createChart, CHART_TYPES,
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
  loading?: boolean
  error?: string | boolean
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
// Generate chart components from CHART_TYPES map
// ---------------------------------------------------------------------------

const _components = Object.fromEntries(
  Object.entries(CHART_TYPES).map(([name, plugin]) => [
    `${name}Chart`,
    createChartComponent(plugin, `${name}Chart`),
  ]),
) as Record<string, ReturnType<typeof createChartComponent>>

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
// Re-exports from core
// ---------------------------------------------------------------------------

export { useChart }
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
  resolveTheme, applyTheme,
  LIGHT_THEME, DARK_THEME, PALETTE,
  THEME_PRESETS, CORPORATE_THEME, SAAS_THEME, STARTUP_THEME, EDITORIAL_THEME, OCEAN_THEME,
  formatValue, formatPercent,
} from '@chartts/core'
export type { ChartData, ChartOptions, ChartInstance, ChartTypePlugin, ThemeConfig, Series } from '@chartts/core'
