import type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  RenderNode, RenderContext, EventBus, PreparedData, Renderer, RendererRoot,
} from '../types'
import { resolveOptions, NO_AXES_TYPES, BAND_SCALE_TYPES } from '../constants'
import { resolveTheme, applyTheme, watchScheme } from '../theme/engine'
import { createEventBus } from '../events/bus'
import { createSVGRenderer } from '../render/svg'
import { createCanvasRenderer } from '../render/canvas'
import { createWebGLRenderer } from '../render/webgl'
import { computeLayout } from '../layout/compute'
import { observeResize } from '../layout/responsive'
import { renderXAxis, renderYAxis, renderGrid } from '../axis/axis'
import { renderLegend } from '../legend/legend'
import { createLinearScale } from '../scales/linear'
import { createCategoricalScale } from '../scales/categorical'
import { group, defs, clipPathDef, rect } from '../render/tree'
import { createEffectDefs } from '../render/effects'
import { createInteractionLayer } from '../interaction/interaction'
import { createDebugPanel, type DebugPanel } from '../debug/debug'
import { renderEmptyState, renderLoadingState, renderErrorState } from '../render/states'
import { decimateData } from '../data/decimate'

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
  let chartState: 'ready' | 'loading' | 'error' | 'empty' = 'ready'
  let stateMessage: string | undefined

  // Systems — resolve renderer
  let resolvedRenderer = currentOptions.renderer
  if (resolvedRenderer === 'auto') {
    const totalPoints = data.series.reduce((sum, s) => sum + s.values.length, 0)
    resolvedRenderer = totalPoints > 100_000 ? 'webgl' : totalPoints > 5_000 ? 'canvas' : 'svg'
  }
  const useCanvas = resolvedRenderer === 'canvas' || resolvedRenderer === 'webgl'
  const bus: EventBus = createEventBus()
  const renderer: Renderer = resolvedRenderer === 'webgl'
    ? createWebGLRenderer(currentTheme)
    : resolvedRenderer === 'canvas'
      ? createCanvasRenderer(currentTheme)
      : createSVGRenderer()
  const root: RendererRoot = renderer.createRoot(container, width, height, {
    class: `chartts ${currentOptions.className}`.trim(),
    role: 'img',
    ariaLabel: currentOptions.ariaLabel,
  })

  if (!useCanvas) {
    applyTheme(root.element, currentTheme)
  }

  // Interaction layer — attaches to SVG; for Canvas, attaches to the canvas element
  const interaction = createInteractionLayer(
    chartType,
    () => lastCtx!,
    () => lastPrepared!,
    bus,
    currentOptions.tooltip,
    currentTheme,
    currentOptions.onClick,
    currentOptions.onHover,
  )
  if (useCanvas) {
    interaction.attach(root.element as unknown as SVGElement, container)
  } else {
    interaction.attach(root.element as SVGElement, container)
  }

  // Debug panel
  let debug: DebugPanel | null = null
  if (options.debug) {
    debug = createDebugPanel()
    debug.attach(container, root.element as SVGElement)
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
        applyTheme(root.element, currentTheme)
        render()
      })
    : () => {}

  // Initial render
  render()

  // -----------------------------------------------------------------------
  function render(): void {
    // Canvas: resize canvas element; SVG: update viewBox
    if (useCanvas) {
      const canvas = root.element as HTMLCanvasElement
      const dpr = window.devicePixelRatio || 1
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      const ctx2d = canvas.getContext('2d')!
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0)
    } else {
      root.element.setAttribute('viewBox', `0 0 ${width} ${height}`)
    }

    // Render state overlays (loading / error / empty)
    if (chartState === 'loading') {
      renderer.render(root, renderLoadingState(width, height, currentTheme))
      return
    }
    if (chartState === 'error') {
      renderer.render(root, renderErrorState(width, height, currentTheme, stateMessage))
      return
    }

    const isEmpty = !currentData.series.length ||
      currentData.series.every(s => s.values.length === 0)
    if (chartState === 'empty' || isEmpty) {
      renderer.render(root, renderEmptyState(width, height, currentTheme, stateMessage))
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
    const suppressAxes = NO_AXES_TYPES.has(chartType.type)
    const layoutOpts = suppressAxes
      ? { ...currentOptions, xAxis: false, yAxis: false, xLabel: '', yLabel: '', legend: false as const, padding: [4, 4, 4, 4] as [number, number, number, number] }
      : currentOptions
    const { area } = computeLayout(width, height, layoutOpts, prepared)

    // Use band mode for bar-like charts so bars don't overflow the chart area
    const useBand = BAND_SCALE_TYPES.has(chartType.type)
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

    const ctx: RenderContext = {
      data: prepared,
      options: currentOptions,
      area,
      xScale,
      yScale,
      theme: currentTheme,
    }
    lastCtx = ctx

    const clipId = 'chartts-clip'
    const nodes: RenderNode[] = []

    // Clip rect to prevent chart content from overflowing
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

    renderer.render(root, nodes)

    // SVG-only: inject effect gradient/filter defs
    if (!useCanvas) {
      const NS = 'http://www.w3.org/2000/svg'
      let fxDefs = root.element.querySelector('defs.chartts-fx') as SVGElement
      if (!fxDefs) {
        fxDefs = document.createElementNS(NS, 'defs')
        fxDefs.classList.add('chartts-fx')
        root.element.insertBefore(fxDefs, root.element.firstChild)
      }
      fxDefs.innerHTML = createEffectDefs(currentOptions.colors)
    }

    // Update debug panel
    debug?.update(ctx, nodes)
  }
  // -----------------------------------------------------------------------

  const instance: ChartInstance = {
    setData(newData: ChartData): void {
      const prev = currentData
      currentData = newData
      currentOptions = resolveOptions(options, newData.series.length)
      chartState = 'ready'
      stateMessage = undefined
      render()
      bus.emit('data:change', { previous: prev, current: newData })
    },

    setOptions(newOpts: Partial<ChartOptions>): void {
      Object.assign(options, newOpts)
      currentOptions = resolveOptions(options, currentData.series.length)
      currentTheme = resolveTheme(currentOptions.theme)
      applyTheme(root.element, currentTheme)
      render()
    },

    getData() { return currentData },
    getOptions() { return currentOptions },

    setLoading(loading = true): void {
      chartState = loading ? 'loading' : 'ready'
      stateMessage = undefined
      render()
    },

    setError(message?: string): void {
      chartState = 'error'
      stateMessage = message
      render()
    },

    setEmpty(message?: string): void {
      chartState = 'empty'
      stateMessage = message
      render()
    },

    toSVG(): string {
      if (useCanvas) throw new Error('[chartts] toSVG() is not available with canvas renderer')
      return root.element.outerHTML
    },

    async toPNG(opts?: { scale?: number }): Promise<Blob> {
      // Canvas renderer: export directly from the canvas
      if (useCanvas) {
        const canvas = root.element as HTMLCanvasElement
        return new Promise((resolve, reject) => {
          canvas.toBlob((b) => b ? resolve(b) : reject(new Error('PNG export failed')), 'image/png')
        })
      }

      // SVG renderer: rasterize via Image
      const scale = opts?.scale ?? 2
      const canvas = document.createElement('canvas')
      canvas.width = width * scale
      canvas.height = height * scale
      const canvasCtx = canvas.getContext('2d')!
      const svgStr = this.toSVG()
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.width = width * scale
      img.height = height * scale

      return new Promise((resolve, reject) => {
        img.onload = () => {
          canvasCtx.drawImage(img, 0, 0, width * scale, height * scale)
          URL.revokeObjectURL(url)
          canvas.toBlob((b) => b ? resolve(b) : reject(new Error('PNG export failed')), 'image/png')
        }
        img.onerror = reject
        img.src = url
      })
    },

    async toClipboard(): Promise<void> {
      const blob = await this.toPNG()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
    },

    on(event, handler) {
      return bus.on(event as never, handler as never)
    },

    resize(w: number, h: number): void {
      width = w
      height = h
      render()
    },

    destroy(): void {
      stopResize()
      stopThemeWatch()
      interaction.destroy()
      debug?.destroy()
      bus.emit('destroy', undefined as never)
      bus.destroy()
      renderer.destroy(root)
    },

    get element(): SVGElement | HTMLCanvasElement {
      return root.element as SVGElement | HTMLCanvasElement
    },
  }

  return instance
}
