import {
  Component, ElementRef, Input, OnChanges, OnDestroy, AfterViewInit,
  SimpleChanges, ViewChild,
} from '@angular/core'
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
  type ChartData, type ChartOptions, type ChartInstance, type ChartTypePlugin,
} from '@chartts/core'

// ---------------------------------------------------------------------------
// Base chart component — shared lifecycle logic
// ---------------------------------------------------------------------------

const BASE_TEMPLATE = `<div #container></div>`
const BASE_STYLES = [':host { display: block; }']

abstract class BaseChart implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>
  @Input({ required: true }) data!: ChartData
  @Input() options: ChartOptions = {}

  protected abstract readonly chartType: ChartTypePlugin
  private instance: ChartInstance | null = null

  ngAfterViewInit(): void {
    this.instance = createChart(
      this.containerRef.nativeElement,
      this.chartType,
      this.data,
      this.options,
    )
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.instance) return
    if (changes['data']) this.instance.setData(this.data)
    if (changes['options']) this.instance.setOptions(this.options)
  }

  ngOnDestroy(): void {
    this.instance?.destroy()
    this.instance = null
  }

  getInstance(): ChartInstance | null {
    return this.instance
  }
}

// ---------------------------------------------------------------------------
// Chart components — one per chart type
// ---------------------------------------------------------------------------

@Component({ selector: 'chartts-line', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class LineChartComponent extends BaseChart { protected readonly chartType = lineChartType }

@Component({ selector: 'chartts-bar', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class BarChartComponent extends BaseChart { protected readonly chartType = barChartType }

@Component({ selector: 'chartts-stacked-bar', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class StackedBarChartComponent extends BaseChart { protected readonly chartType = stackedBarChartType }

@Component({ selector: 'chartts-horizontal-bar', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class HorizontalBarChartComponent extends BaseChart { protected readonly chartType = horizontalBarChartType }

@Component({ selector: 'chartts-pie', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class PieChartComponent extends BaseChart { protected readonly chartType = pieChartType }

@Component({ selector: 'chartts-donut', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class DonutChartComponent extends BaseChart { protected readonly chartType = donutChartType }

@Component({ selector: 'chartts-scatter', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class ScatterChartComponent extends BaseChart { protected readonly chartType = scatterChartType }

@Component({ selector: 'chartts-sparkline', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class SparklineChartComponent extends BaseChart { protected readonly chartType = sparklineChartType }

@Component({ selector: 'chartts-area', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class AreaChartComponent extends BaseChart { protected readonly chartType = areaChartType }

@Component({ selector: 'chartts-radar', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class RadarChartComponent extends BaseChart { protected readonly chartType = radarChartType }

@Component({ selector: 'chartts-bubble', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class BubbleChartComponent extends BaseChart { protected readonly chartType = bubbleChartType }

@Component({ selector: 'chartts-candlestick', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class CandlestickChartComponent extends BaseChart { protected readonly chartType = candlestickChartType }

@Component({ selector: 'chartts-gauge', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class GaugeChartComponent extends BaseChart { protected readonly chartType = gaugeChartType }

@Component({ selector: 'chartts-waterfall', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class WaterfallChartComponent extends BaseChart { protected readonly chartType = waterfallChartType }

@Component({ selector: 'chartts-funnel', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class FunnelChartComponent extends BaseChart { protected readonly chartType = funnelChartType }

@Component({ selector: 'chartts-heatmap', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class HeatmapChartComponent extends BaseChart { protected readonly chartType = heatmapChartType }

@Component({ selector: 'chartts-boxplot', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class BoxplotChartComponent extends BaseChart { protected readonly chartType = boxplotChartType }

@Component({ selector: 'chartts-histogram', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class HistogramChartComponent extends BaseChart { protected readonly chartType = histogramChartType }

@Component({ selector: 'chartts-treemap', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class TreemapChartComponent extends BaseChart { protected readonly chartType = treemapChartType }

@Component({ selector: 'chartts-polar', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class PolarChartComponent extends BaseChart { protected readonly chartType = polarChartType }

@Component({ selector: 'chartts-radialbar', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class RadialBarChartComponent extends BaseChart { protected readonly chartType = radialBarChartType }

@Component({ selector: 'chartts-lollipop', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class LollipopChartComponent extends BaseChart { protected readonly chartType = lollipopChartType }

@Component({ selector: 'chartts-bullet', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class BulletChartComponent extends BaseChart { protected readonly chartType = bulletChartType }

@Component({ selector: 'chartts-dumbbell', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class DumbbellChartComponent extends BaseChart { protected readonly chartType = dumbbellChartType }

@Component({ selector: 'chartts-calendar', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class CalendarChartComponent extends BaseChart { protected readonly chartType = calendarChartType }

@Component({ selector: 'chartts-combo', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class ComboChartComponent extends BaseChart { protected readonly chartType = comboChartType }

@Component({ selector: 'chartts-sankey', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class SankeyChartComponent extends BaseChart { protected readonly chartType = sankeyChartType }

@Component({ selector: 'chartts-sunburst', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class SunburstChartComponent extends BaseChart { protected readonly chartType = sunburstChartType }

@Component({ selector: 'chartts-tree', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class TreeChartComponent extends BaseChart { protected readonly chartType = treeChartType }

@Component({ selector: 'chartts-graph', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class GraphChartComponent extends BaseChart { protected readonly chartType = graphChartType }

@Component({ selector: 'chartts-parallel', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class ParallelChartComponent extends BaseChart { protected readonly chartType = parallelChartType }

@Component({ selector: 'chartts-themeriver', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class ThemeRiverChartComponent extends BaseChart { protected readonly chartType = themeRiverChartType }

@Component({ selector: 'chartts-pictorialbar', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class PictorialBarChartComponent extends BaseChart { protected readonly chartType = pictorialBarChartType }

@Component({ selector: 'chartts-chord', standalone: true, template: BASE_TEMPLATE, styles: BASE_STYLES })
export class ChordChartComponent extends BaseChart { protected readonly chartType = chordChartType }

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
} from '@chartts/core'
export type { ChartData, ChartOptions, ChartInstance, ChartTypePlugin } from '@chartts/core'
