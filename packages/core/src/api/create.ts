import type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  RenderNode, RenderContext, EventBus, PreparedData,
} from '../types'
import { resolveOptions } from '../constants'
import { resolveTheme, watchScheme } from '../theme/engine'
import { createEventBus } from '../events/bus'
import { computeLayout } from '../layout/compute'
import { observeResize } from '../layout/responsive'
import { renderXAxis, renderYAxis, renderGrid } from '../axis/axis'
import { renderLegend } from '../legend/legend'
import { createLinearScale } from '../scales/linear'
import { createCategoricalScale } from '../scales/categorical'
import { group, defs, clipPathDef, rect } from '../render/tree'
import { createInteractionLayer } from '../interaction/interaction'
import { createZoomPan, type ZoomPanInstance } from '../interaction/zoom-pan'
import { createBrush, type BrushInstance } from '../interaction/brush'
import { createDebugPanel, type DebugPanel } from '../debug/debug'
import { renderEmptyState, renderLoadingState, renderErrorState } from '../render/states'
import { decimateData } from '../data/decimate'
import { resolveRendererType, createRendererManager } from './renderer-manager'
import { createStateManager } from './state-manager'
import { createExporter } from './exporter'

/** Extended options for createChart (includes debug flag) */
interface CreateChartOptions extends ChartOptions {
  debug?: boolean
}

/**
 * Create a chart instance.
 * This is the core factory — all convenience functions (Line, Bar) call this.
 */
export function createChart(
  target: string | HTMLElement,
  chartType: ChartTypePlugin,
  data: ChartData,
  options: CreateChartOptions = {},
): ChartInstance {
  const container = typeof target === 'string'
    ? document.querySelector<HTMLElement>(target)
    : target

  if (!container) {
    throw new Error(`[chartts] Target element not found: ${target}`)
  }

  // State
  let currentData = data
  let currentOptions = resolveOptions(options, data.series.length)
  let currentTheme = resolveTheme(currentOptions.theme)
  let width = currentOptions.width || container.clientWidth || 400
  let height = currentOptions.height || container.clientHeight || 300
  let lastCtx: RenderContext | null = null
  let lastPrepared: PreparedData | null = null
  let lastRenderedNodes: RenderNode[] = []

  // Renderer subsystem
  const rendererType = resolveRendererType(currentOptions.renderer, data)
  const rm = createRendererManager({
    container,
    rendererType,
    theme: currentTheme,
    width,
    height,
    className: currentOptions.className,
    ariaLabel: currentOptions.ariaLabel,
  })

  // State manager
  const stateManager = createStateManager(() => render())

  // Exporter
  const exporter = createExporter({
    getRoot: () => rm.root,
    getWidth: () => width,
    getHeight: () => height,
    isCanvas: rm.useCanvas,
  })

  // Event bus
  const bus: EventBus = createEventBus()

  // Shared interaction state — coordinates between zoom-pan and interaction layer
  const interactionState = { isPanning: false }

  // Interaction layer
  const interaction = createInteractionLayer(
    chartType,
    () => lastCtx!,
    () => lastPrepared!,
    bus,
    currentOptions.tooltip,
    currentTheme,
    currentOptions.onClick,
    currentOptions.onHover,
    interactionState,
    rm.useCanvas ? { renderer: rm.renderer, root: rm.root, getLastNodes: () => lastRenderedNodes } : undefined,
  )
  if (rm.useCanvas) {
    interaction.attach(rm.root.element as unknown as SVGElement, container)
  } else {
    interaction.attach(rm.root.element as SVGElement, container)
  }

  // Zoom & Pan
  let zoomPan: ZoomPanInstance | null = null
  if (currentOptions.zoom || currentOptions.pan) {
    const needs2DZoom = !!chartType.suppressAxes
    zoomPan = createZoomPan(
      {
        x: true,
        y: needs2DZoom,
        wheel: currentOptions.zoom,
        drag: currentOptions.pan,
        pinch: currentOptions.zoom,
        normalizedPan: !needs2DZoom,
      },
      () => {
        render()
        const state = zoomPan!.getState()
        bus.emit('zoom:change', state)
      },
      interactionState,
    )
    zoomPan.attach(
      rm.root.element as HTMLElement | SVGElement,
      () => lastCtx!.area,
      () => ({ xScale: lastCtx!.xScale, yScale: lastCtx!.yScale }),
    )
  }

  // Brush selection
  let brush: BrushInstance | null = null
  if (currentOptions.brush) {
    brush = createBrush(
      {},
      bus,
      rm.root.element as HTMLElement | SVGElement,
      () => lastCtx!.area,
      () => lastCtx!.xScale,
      () => lastPrepared!,
      !!currentOptions.pan,
    )
  }

  // Debug panel
  let debug: DebugPanel | null = null
  if (options.debug) {
    debug = createDebugPanel()
    debug.attach(container, rm.root.element as SVGElement)
  }

  // Auto-resize
  const stopResize = currentOptions.width && currentOptions.height
    ? () => {}
    : observeResize(container, (w, h) => {
        width = w
        height = h
        render()
        bus.emit('resize', { width: w, height: h })
      })

  // Theme watch
  const stopThemeWatch = currentOptions.theme === 'auto'
    ? watchScheme(() => {
        currentTheme = resolveTheme('auto')
        rm.applyTheme(currentTheme)
        render()
      })
    : () => {}

  // Initial render
  render()
  requestAnimationFrame(() => {
    rm.root.element.classList.add('chartts-skip-anim')
  })

  // -----------------------------------------------------------------------
  function render(): void {
    rm.updateViewport(width, height)

    // Render state overlays (loading / error / empty)
    if (stateManager.state === 'loading') {
      rm.renderer.render(rm.root, renderLoadingState(width, height, currentTheme))
      return
    }
    if (stateManager.state === 'error') {
      rm.renderer.render(rm.root, renderErrorState(width, height, currentTheme, stateManager.message))
      return
    }

    const hasRichGraphData = chartType.type === 'graph' &&
      ((options as Record<string, unknown>).nodes || (options as Record<string, unknown>).edges)
    const isEmpty = !hasRichGraphData && (
      !currentData.series.length ||
      currentData.series.every(s => s.values.length === 0)
    )
    if (stateManager.state === 'empty' || isEmpty) {
      rm.renderer.render(rm.root, renderEmptyState(width, height, currentTheme, stateManager.message))
      return
    }

    // Decimate large datasets before preparing
    const decimateOpt = (options as Record<string, unknown>).decimate
    const dataForRender = decimateOpt
      ? decimateData(currentData, typeof decimateOpt === 'object' ? decimateOpt : { threshold: Math.max(width * 2, 500) })
      : currentData

    const prepared = chartType.prepareData(dataForRender, currentOptions)
    lastPrepared = prepared

    // Chart types that suppress axes/grid don't need axis margins
    const suppressAxes = !!chartType.suppressAxes
    const layoutOpts = suppressAxes
      ? { ...currentOptions, xAxis: false, yAxis: false, xLabel: '', yLabel: '', legend: false as const, padding: [4, 4, 4, 4] as [number, number, number, number] }
      : currentOptions
    const { area } = computeLayout(width, height, layoutOpts, prepared)

    // Use band mode for bar-like charts so bars don't overflow the chart area
    const useBand = !!chartType.useBandScale
    const xScale = createCategoricalScale({
      categories: prepared.labels,
      range: [area.x, area.x + area.width],
      format: currentOptions.xFormat,
      band: useBand,
    })

    const yScale = createLinearScale({
      domain: [prepared.bounds.yMin, prepared.bounds.yMax],
      range: [area.y + area.height, area.y],
      nice: true,
      format: currentOptions.yFormat,
    })

    // Apply zoom/pan state to scales
    if (zoomPan) {
      zoomPan.applyToScales(xScale, yScale, area)
    }

    const ctx: RenderContext = {
      data: prepared,
      options: currentOptions,
      area,
      xScale,
      yScale,
      theme: currentTheme,
      zoomPan: zoomPan ? zoomPan.getState() : undefined,
    }
    lastCtx = ctx

    const clipId = 'chartts-clip'
    const nodes: RenderNode[] = []

    nodes.push(defs([
      clipPathDef(clipId, [rect(area.x, area.y, area.width, area.height)]),
    ]))

    if (!suppressAxes) {
      nodes.push(renderGrid(xScale, yScale, area, currentOptions, currentTheme))
      nodes.push(renderXAxis(xScale, area, currentOptions, currentTheme))
      nodes.push(renderYAxis(yScale, area, currentOptions, currentTheme))
    }

    const chartNodes = chartType.render(ctx)
    nodes.push(group(chartNodes, { class: 'chartts-content', clipPath: clipId }))

    if (!suppressAxes) {
      const legend = renderLegend(prepared, area, currentOptions, currentTheme)
      if (legend) nodes.push(legend)
    }

    lastRenderedNodes = nodes
    rm.renderer.render(rm.root, nodes)

    // SVG-only: inject effect gradient/filter defs
    rm.injectEffectDefs(currentOptions.colors)

    // Update debug panel
    debug?.update(ctx, nodes)
  }
  // -----------------------------------------------------------------------

  const instance: ChartInstance = {
    setData(newData: ChartData): void {
      const prev = currentData
      currentData = newData
      currentOptions = resolveOptions(options, newData.series.length)
      stateManager.reset()
      render()
      bus.emit('data:change', { previous: prev, current: newData })
    },

    setOptions(newOpts: Partial<ChartOptions>): void {
      Object.assign(options, newOpts)
      currentOptions = resolveOptions(options, currentData.series.length)
      currentTheme = resolveTheme(currentOptions.theme)
      rm.applyTheme(currentTheme)
      render()
    },

    getData() { return currentData },
    getOptions() { return currentOptions },

    setLoading(loading = true) { stateManager.setLoading(loading) },
    setError(message?: string) { stateManager.setError(message) },
    setEmpty(message?: string) { stateManager.setEmpty(message) },

    toSVG: () => exporter.toSVG(),
    toPNG: (opts) => exporter.toPNG(opts),
    toClipboard: () => exporter.toClipboard(),

    on(event, handler) {
      return bus.on(event as never, handler as never)
    },

    resize(w: number, h: number): void {
      width = w
      height = h
      render()
    },

    resetZoom(): void {
      if (zoomPan) {
        zoomPan.reset()
        bus.emit('zoom:reset', undefined as never)
      }
    },

    destroy(): void {
      stopResize()
      stopThemeWatch()
      interaction.destroy()
      zoomPan?.destroy()
      brush?.destroy()
      debug?.destroy()
      bus.emit('destroy', undefined as never)
      bus.destroy()
      rm.destroy()
    },

    get element(): SVGElement | HTMLCanvasElement {
      return rm.root.element as SVGElement | HTMLCanvasElement
    },

    get _bus(): EventBus {
      return bus
    },
  }

  return instance
}
