import type {
  ChartTypePlugin, RenderContext, EventBus, DataPoint,
  PreparedData, TooltipConfig, ThemeConfig, CrosshairConfig,
  Renderer, RendererRoot, RenderNode, HitResult,
} from '../types'
import { createTooltip, type TooltipInstance } from '../tooltip/tooltip'
import { CSS_PREFIX } from '../constants'
import { defaultHighlightNodes, applyDimming } from './highlight'

export interface CanvasHighlightConfig {
  renderer: Renderer
  root: RendererRoot
  getLastNodes: () => RenderNode[]
}

export interface InteractionLayer {
  attach(svg: SVGElement | HTMLCanvasElement, container: HTMLElement): void
  detach(): void
  destroy(): void
}

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * Interaction layer — handles mouse/touch events on the chart.
 * Provides: hover highlights, tooltips, crosshair (vertical/horizontal/both), click events.
 *
 * For SVG renderer, interaction elements are appended directly to the SVG.
 * For Canvas renderer, a transparent SVG overlay is created on top of the
 * canvas to host crosshair lines, highlight dots, and other visual feedback.
 */
export function createInteractionLayer(
  chartType: ChartTypePlugin,
  getContext: () => RenderContext,
  getData: () => PreparedData,
  bus: EventBus,
  tooltipConfig: false | TooltipConfig,
  theme: ThemeConfig,
  onClick?: (point: DataPoint, event: MouseEvent) => void,
  onHover?: (point: DataPoint | null, event: MouseEvent) => void,
  interactionState?: { isPanning: boolean },
  canvasHighlight?: CanvasHighlightConfig,
): InteractionLayer {
  let targetEl: SVGElement | HTMLCanvasElement | null = null
  let container: HTMLElement | null = null
  let tooltip: TooltipInstance | null = null
  let crosshairVLineEl: SVGLineElement | null = null
  let crosshairHLineEl: SVGLineElement | null = null
  let crosshairTipEl: HTMLDivElement | null = null
  let crosshairYTipEl: HTMLDivElement | null = null
  let crosshairDots: SVGCircleElement[] = []
  let activePoint: { seriesIndex: number; pointIndex: number } | null = null
  let activeCrosshairIndex = -1
  let linkedUnsubs: (() => void)[] = []

  // Canvas overlay — a transparent SVG positioned over the canvas
  let overlayEl: SVGSVGElement | null = null
  let isCanvas = false

  // Create tooltip if configured
  if (tooltipConfig) {
    tooltip = createTooltip(
      typeof tooltipConfig === 'object' ? tooltipConfig : { enabled: true },
      theme,
    )
  }

  /** Get the SVG element where interaction visuals should be drawn */
  function getOverlay(): SVGElement | null {
    if (isCanvas) return overlayEl
    return targetEl as SVGElement | null
  }

  /** Sync overlay SVG to match the canvas CSS pixel dimensions exactly */
  function syncOverlay(): void {
    if (!overlayEl || !targetEl) return
    const canvas = targetEl as HTMLCanvasElement
    // CSS pixel width/height = chart coordinate system
    const w = canvas.offsetWidth || canvas.clientWidth || parseInt(canvas.style.width) || 400
    const h = canvas.offsetHeight || canvas.clientHeight || parseInt(canvas.style.height) || 300
    overlayEl.setAttribute('viewBox', `0 0 ${w} ${h}`)
    overlayEl.style.width = `${w}px`
    overlayEl.style.height = `${h}px`
  }

  function getCrosshairConfig(): false | CrosshairConfig {
    try {
      return getContext().options.crosshair
    } catch { return false }
  }

  // -----------------------------------------------------------------------
  // Crosshair helpers
  // -----------------------------------------------------------------------

  function ensureCrosshairVLine(): SVGLineElement {
    if (crosshairVLineEl) return crosshairVLineEl
    crosshairVLineEl = document.createElementNS(SVG_NS, 'line')
    crosshairVLineEl.setAttribute('class', 'chartts-crosshair-line chartts-crosshair-vline')
    crosshairVLineEl.setAttribute('stroke', theme.textMuted)
    crosshairVLineEl.setAttribute('stroke-width', '1')
    crosshairVLineEl.setAttribute('stroke-dasharray', '4,3')
    crosshairVLineEl.style.pointerEvents = 'none'
    crosshairVLineEl.style.opacity = '0'
    crosshairVLineEl.style.transition = 'opacity 0.12s ease'
    return crosshairVLineEl
  }

  function ensureCrosshairHLine(): SVGLineElement {
    if (crosshairHLineEl) return crosshairHLineEl
    crosshairHLineEl = document.createElementNS(SVG_NS, 'line')
    crosshairHLineEl.setAttribute('class', 'chartts-crosshair-line chartts-crosshair-hline')
    crosshairHLineEl.setAttribute('stroke', theme.textMuted)
    crosshairHLineEl.setAttribute('stroke-width', '1')
    crosshairHLineEl.setAttribute('stroke-dasharray', '4,3')
    crosshairHLineEl.style.pointerEvents = 'none'
    crosshairHLineEl.style.opacity = '0'
    crosshairHLineEl.style.transition = 'opacity 0.12s ease'
    return crosshairHLineEl
  }

  function ensureCrosshairTip(): HTMLDivElement {
    if (crosshairTipEl) return crosshairTipEl
    crosshairTipEl = document.createElement('div')
    crosshairTipEl.className = 'chartts-crosshair-tooltip'
    crosshairTipEl.style.cssText = `
      position: absolute;
      pointer-events: none;
      z-index: 9999;
      padding: 10px 14px;
      border-radius: var(${CSS_PREFIX}-radius, 8px);
      background: var(${CSS_PREFIX}-tooltip-bg, ${theme.tooltipBackground});
      color: var(${CSS_PREFIX}-tooltip-text, ${theme.tooltipText});
      border: 1px solid var(${CSS_PREFIX}-tooltip-border, ${theme.tooltipBorder});
      font-family: var(${CSS_PREFIX}-font-family, ${theme.fontFamily});
      font-size: var(${CSS_PREFIX}-font-size-sm, ${theme.fontSizeSmall}px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
      backdrop-filter: blur(12px) saturate(1.5);
      -webkit-backdrop-filter: blur(12px) saturate(1.5);
      transition: opacity 0.15s ease, transform 0.1s ease;
      opacity: 0;
      transform: translateY(4px);
      white-space: nowrap;
    `
    return crosshairTipEl
  }

  function ensureCrosshairYTip(): HTMLDivElement {
    if (crosshairYTipEl) return crosshairYTipEl
    crosshairYTipEl = document.createElement('div')
    crosshairYTipEl.className = 'chartts-crosshair-ytip'
    crosshairYTipEl.style.cssText = `
      position: absolute;
      pointer-events: none;
      z-index: 9998;
      padding: 2px 6px;
      border-radius: 3px;
      background: ${theme.textMuted};
      color: ${theme.tooltipBackground};
      font-family: ${theme.fontFamily};
      font-size: ${theme.fontSizeSmall - 1}px;
      font-variant-numeric: tabular-nums;
      opacity: 0;
      transition: opacity 0.12s ease;
      white-space: nowrap;
    `
    return crosshairYTipEl
  }

  function clearCrosshairDots(): void {
    for (const d of crosshairDots) d.remove()
    crosshairDots = []
  }

  function showCrosshair(pointIndex: number, mouseX: number, mouseY: number, svgY: number): void {
    if (!targetEl || !container) return
    const overlay = getOverlay()
    if (!overlay) return

    if (isCanvas) syncOverlay()

    const ctx = getContext()
    const data = getData()
    const { area, xScale } = ctx
    const chConfig = getCrosshairConfig()
    if (!chConfig) return
    const mode = chConfig.mode ?? 'vertical'

    const label = data.labels[pointIndex]!
    const xPos = xScale.map(label)

    // Vertical line
    if (mode === 'vertical' || mode === 'both') {
      const vline = ensureCrosshairVLine()
      vline.setAttribute('x1', String(xPos))
      vline.setAttribute('y1', String(area.y))
      vline.setAttribute('x2', String(xPos))
      vline.setAttribute('y2', String(area.y + area.height))
      vline.style.opacity = '0.6'
      if (!vline.parentElement) overlay.appendChild(vline)
    }

    // Horizontal line
    if (mode === 'horizontal' || mode === 'both') {
      const hline = ensureCrosshairHLine()
      hline.setAttribute('x1', String(area.x))
      hline.setAttribute('y1', String(svgY))
      hline.setAttribute('x2', String(area.x + area.width))
      hline.setAttribute('y2', String(svgY))
      hline.style.opacity = '0.6'
      if (!hline.parentElement) overlay.appendChild(hline)

      // Y-value label on left axis
      const yVal = ctx.yScale.invert(svgY)
      const yTip = ensureCrosshairYTip()
      yTip.textContent = ctx.options.yFormat(yVal)
      if (!yTip.parentElement) {
        container.style.position = 'relative'
        container.appendChild(yTip)
      }
      // Position at left edge
      yTip.style.left = '0px'
      yTip.style.top = `${mouseY - 10}px`
      yTip.style.opacity = '1'
    }

    // Dots on each series at this x
    if (mode === 'vertical' || mode === 'both') {
      clearCrosshairDots()
      for (const series of data.series) {
        const val = series.values[pointIndex]
        if (val == null || isNaN(val)) continue
        const yPos = ctx.yScale.map(val)
        const dot = document.createElementNS(SVG_NS, 'circle')
        dot.setAttribute('cx', String(xPos))
        dot.setAttribute('cy', String(yPos))
        dot.setAttribute('r', '5')
        dot.setAttribute('fill', series.color)
        dot.setAttribute('stroke', theme.tooltipBackground)
        dot.setAttribute('stroke-width', '2')
        dot.style.pointerEvents = 'none'
        dot.style.transition = 'cx 0.1s ease, cy 0.1s ease'
        overlay.appendChild(dot)
        crosshairDots.push(dot)
      }
    }

    // Multi-series tooltip
    const tip = ensureCrosshairTip()
    let html = `<div style="font-weight:600;margin-bottom:6px;letter-spacing:-0.01em;">${formatLabel(label)}</div>`
    for (const series of data.series) {
      const val = series.values[pointIndex]
      if (val == null || isNaN(val)) continue
      html += `<div style="display:flex;align-items:center;gap:8px;margin-top:3px;">
        <span style="width:8px;height:8px;border-radius:50%;background:${series.color};display:inline-block;box-shadow:0 0 6px ${series.color};flex-shrink:0;"></span>
        <span style="flex:1;color:var(${CSS_PREFIX}-text-muted, #6b7280);">${series.name}</span>
        <span style="font-weight:700;font-variant-numeric:tabular-nums;margin-left:12px;">${ctx.options.yFormat(val)}</span>
      </div>`
    }
    tip.innerHTML = html
    if (!tip.parentElement) {
      container.style.position = 'relative'
      container.appendChild(tip)
    }

    // Position tooltip
    requestAnimationFrame(() => {
      if (!tip.parentElement || !container) return
      const tipRect = tip.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      let left = mouseX + 16
      let top = mouseY - tipRect.height / 2
      if (left + tipRect.width > containerRect.width) left = mouseX - tipRect.width - 16
      if (top < 0) top = 4
      if (top + tipRect.height > containerRect.height) top = containerRect.height - tipRect.height - 4
      tip.style.left = `${left}px`
      tip.style.top = `${top}px`
      tip.style.opacity = '1'
      tip.style.transform = 'translateY(0)'
    })

    activeCrosshairIndex = pointIndex
    bus.emit('crosshair:move', { x: xPos, label })
  }

  function hideCrosshair(): void {
    if (activeCrosshairIndex === -1) return
    if (crosshairVLineEl) crosshairVLineEl.style.opacity = '0'
    if (crosshairHLineEl) crosshairHLineEl.style.opacity = '0'
    if (crosshairTipEl) {
      crosshairTipEl.style.opacity = '0'
      crosshairTipEl.style.transform = 'translateY(4px)'
    }
    if (crosshairYTipEl) {
      crosshairYTipEl.style.opacity = '0'
    }
    clearCrosshairDots()
    activeCrosshairIndex = -1
    bus.emit('crosshair:hide', undefined as never)
  }

  function formatLabel(label: string | number | Date): string {
    try { return getContext().options.xFormat(label) } catch { return String(label) }
  }

  /** Find nearest label index given an svgX coordinate */
  function nearestLabelIndex(svgX: number): number {
    const data = getData()
    const ctx = getContext()
    let bestIdx = 0
    let bestDist = Infinity
    for (let i = 0; i < data.labels.length; i++) {
      const pos = ctx.xScale.map(data.labels[i]!)
      const dist = Math.abs(svgX - pos)
      if (dist < bestDist) { bestDist = dist; bestIdx = i }
    }
    return bestIdx
  }

  // -----------------------------------------------------------------------
  // Event handlers
  // -----------------------------------------------------------------------

  function toChartCoords(el: SVGElement | HTMLCanvasElement, clientX: number, clientY: number): { x: number; y: number; svgX: number; svgY: number } {
    const r = el.getBoundingClientRect()
    const x = clientX - r.left
    const y = clientY - r.top

    // Canvas: coords are CSS pixels (matching our coordinate system)
    if (el instanceof HTMLCanvasElement) {
      return { x, y, svgX: x, svgY: y }
    }
    // SVG: scale to viewBox coords
    const viewBox = el.getAttribute('viewBox')?.split(' ').map(Number) ?? [0, 0, r.width, r.height]
    const scaleX = viewBox[2]! / r.width
    const scaleY = viewBox[3]! / r.height
    return { x, y, svgX: x * scaleX, svgY: y * scaleY }
  }

  function onMouseMove(e: MouseEvent): void {
    if (!targetEl || !container) return
    // Skip tooltip/crosshair updates during active pan drag
    if (interactionState?.isPanning) return

    const { x, y, svgX, svgY } = toChartCoords(targetEl, e.clientX, e.clientY)

    const ctx = getContext()
    const chConfig = getCrosshairConfig()

    // Crosshair mode — snap to nearest label
    if (chConfig) {
      const { area } = ctx
      if (svgX >= area.x && svgX <= area.x + area.width && svgY >= area.y && svgY <= area.y + area.height) {
        const idx = nearestLabelIndex(svgX)
        if (idx !== activeCrosshairIndex) {
          showCrosshair(idx, x, y, svgY)
        } else {
          // Update horizontal line position and reposition tooltip
          if (chConfig.mode === 'horizontal' || chConfig.mode === 'both') {
            if (crosshairHLineEl) {
              crosshairHLineEl.setAttribute('y1', String(svgY))
              crosshairHLineEl.setAttribute('y2', String(svgY))
            }
            if (crosshairYTipEl) {
              const yVal = ctx.yScale.invert(svgY)
              crosshairYTipEl.textContent = ctx.options.yFormat(yVal)
              crosshairYTipEl.style.top = `${y - 10}px`
            }
          }
          if (crosshairTipEl) {
            const tipRect = crosshairTipEl.getBoundingClientRect()
            const containerRect = container.getBoundingClientRect()
            let left = x + 16
            let top = y - tipRect.height / 2
            if (left + tipRect.width > containerRect.width) left = x - tipRect.width - 16
            if (top < 0) top = 4
            if (top + tipRect.height > containerRect.height) top = containerRect.height - tipRect.height - 4
            crosshairTipEl.style.left = `${left}px`
            crosshairTipEl.style.top = `${top}px`
          }
        }
      } else {
        hideCrosshair()
      }
      // In crosshair mode, skip single-point tooltip
      return
    }

    // Standard single-point mode
    const hit = chartType.hitTest(ctx, svgX, svgY)

    if (hit) {
      const data = getData()
      const series = data.series[hit.seriesIndex]!
      const point: DataPoint = {
        label: data.labels[hit.pointIndex]!,
        value: series.values[hit.pointIndex]!,
        index: hit.pointIndex,
        seriesIndex: hit.seriesIndex,
        seriesName: series.name,
      }

      // Update hover highlights
      if (!activePoint || activePoint.seriesIndex !== hit.seriesIndex || activePoint.pointIndex !== hit.pointIndex) {
        clearHighlights()
        highlightPoint(hit)
        activePoint = { seriesIndex: hit.seriesIndex, pointIndex: hit.pointIndex }

        bus.emit('point:enter', { point, event: e })
        onHover?.(point, e)
      }

      // Show tooltip
      if (tooltip) {
        tooltip.show(point, series.color, x, y, container)
        bus.emit('tooltip:show', { point, x: svgX, y: svgY })
      }
    } else {
      if (activePoint) {
        clearHighlights()
        activePoint = null
        bus.emit('point:leave', { event: e })
        onHover?.(null, e)
      }
      if (tooltip) {
        tooltip.hide()
        bus.emit('tooltip:hide', undefined as never)
      }
    }
  }

  function onMouseLeave(e: MouseEvent): void {
    clearHighlights()
    activePoint = null
    tooltip?.hide()
    hideCrosshair()
    bus.emit('point:leave', { event: e })
    onHover?.(null, e)
  }

  function onClickHandler(e: MouseEvent): void {
    if (!targetEl || !onClick) return

    const { svgX, svgY } = toChartCoords(targetEl, e.clientX, e.clientY)

    const ctx = getContext()
    const hit = chartType.hitTest(ctx, svgX, svgY)

    if (hit) {
      const data = getData()
      const series = data.series[hit.seriesIndex]!
      const point: DataPoint = {
        label: data.labels[hit.pointIndex]!,
        value: series.values[hit.pointIndex]!,
        index: hit.pointIndex,
        seriesIndex: hit.seriesIndex,
        seriesName: series.name,
      }
      onClick(point, e)
      bus.emit('point:click', { point, event: e })
    }
  }

  // -----------------------------------------------------------------------
  // Linked chart crosshair — respond to bus events from linkCharts
  // -----------------------------------------------------------------------

  function setupLinkedCrosshair(): void {
    const unsub1 = bus.on('crosshair:move', ((payload: { x: number; label: string | number | Date }) => {
      if (!targetEl || !container) return
      const data = getData()
      const idx = data.labels.findIndex(l => String(l) === String(payload.label))
      if (idx < 0) return
      if (idx === activeCrosshairIndex) return
      // Show crosshair at this index with approximate positioning
      const ctx = getContext()
      const xPos = ctx.xScale.map(data.labels[idx]!)
      const rect = targetEl.getBoundingClientRect()
      showCrosshair(idx, xPos, rect.height / 2, ctx.area.y + ctx.area.height / 2)
    }) as never)

    const unsub2 = bus.on('crosshair:hide', (() => {
      hideCrosshair()
    }) as never)

    linkedUnsubs.push(unsub1, unsub2)
  }

  // -----------------------------------------------------------------------
  // Highlight / dim
  // -----------------------------------------------------------------------

  let highlightRafId = 0

  function highlightPoint(hit: HitResult): void {
    if (isCanvas && canvasHighlight) {
      // Canvas: re-render with dimmed series + highlight nodes
      if (highlightRafId) return // already scheduled
      highlightRafId = requestAnimationFrame(() => {
        highlightRafId = 0
        const ctx = getContext()
        const baseNodes = canvasHighlight!.getLastNodes()
        const dimmed = applyDimming(baseNodes, hit)
        const highlight = chartType.getHighlightNodes
          ? chartType.getHighlightNodes(ctx, hit)
          : defaultHighlightNodes(hit, ctx)
        canvasHighlight!.renderer.render(canvasHighlight!.root, [...dimmed, ...highlight])
      })
      return
    }

    // SVG mode: manipulate DOM elements directly
    const svg = targetEl as SVGElement
    if (!svg) return
    const target = svg.querySelector(
      `[data-series="${hit.seriesIndex}"][data-index="${hit.pointIndex}"]`,
    ) as SVGElement | null

    if (target?.classList.contains('chartts-point')) {
      target.style.transition = 'r 0.15s ease, stroke-width 0.15s ease'
      target.setAttribute('r', '6')
      target.setAttribute('stroke-width', '3')
    }

    const targetGroup = target?.closest('.chartts-series')
    svg.querySelectorAll('.chartts-series').forEach((el) => {
      if (el !== targetGroup) {
        ;(el as SVGElement).style.opacity = '0.3'
        ;(el as SVGElement).style.transition = 'opacity 0.15s ease'
      }
    })
  }

  function clearHighlights(): void {
    if (isCanvas && canvasHighlight) {
      // Cancel pending highlight RAF
      if (highlightRafId) {
        cancelAnimationFrame(highlightRafId)
        highlightRafId = 0
      }
      // Re-render without dimming/highlight
      canvasHighlight.renderer.render(canvasHighlight.root, canvasHighlight.getLastNodes())
      return
    }

    const svg = targetEl as SVGElement | null
    if (!svg) return

    svg.querySelectorAll('.chartts-point').forEach((p) => {
      const el = p as SVGElement
      el.setAttribute('r', el.getAttribute('data-original-r') || '3.5')
      el.setAttribute('stroke-width', '2')
    })

    svg.querySelectorAll('.chartts-series').forEach((el) => {
      ;(el as SVGElement).style.opacity = ''
    })
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  return {
    attach(svgEl: SVGElement | HTMLCanvasElement, containerEl: HTMLElement): void {
      targetEl = svgEl
      container = containerEl
      isCanvas = svgEl instanceof HTMLCanvasElement

      if (isCanvas) {
        containerEl.style.position = 'relative'
        overlayEl = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement
        const canvas = svgEl as unknown as HTMLCanvasElement
        const w = canvas.offsetWidth || canvas.clientWidth || parseInt(canvas.style.width) || 400
        const h = canvas.offsetHeight || canvas.clientHeight || parseInt(canvas.style.height) || 300
        overlayEl.setAttribute('viewBox', `0 0 ${w} ${h}`)
        overlayEl.style.cssText = `position:absolute;top:0;left:0;width:${w}px;height:${h}px;pointer-events:none;overflow:visible;`
        containerEl.appendChild(overlayEl)
      }

      svgEl.style.cursor = 'crosshair'
      const el = svgEl as unknown as HTMLElement
      el.addEventListener('mousemove', onMouseMove as EventListener)
      el.addEventListener('mouseleave', onMouseLeave as EventListener)
      el.addEventListener('click', onClickHandler as EventListener)

      // Set up linked chart crosshair listener
      setupLinkedCrosshair()
    },

    detach(): void {
      if (!targetEl) return
      const el = targetEl as unknown as HTMLElement
      el.removeEventListener('mousemove', onMouseMove as EventListener)
      el.removeEventListener('mouseleave', onMouseLeave as EventListener)
      el.removeEventListener('click', onClickHandler as EventListener)
      for (const unsub of linkedUnsubs) unsub()
      linkedUnsubs = []
    },

    destroy(): void {
      this.detach()
      tooltip?.destroy()
      crosshairVLineEl?.remove()
      crosshairHLineEl?.remove()
      crosshairTipEl?.remove()
      crosshairYTipEl?.remove()
      clearCrosshairDots()
      overlayEl?.remove()
      overlayEl = null
      targetEl = null
      container = null
    },
  }
}
