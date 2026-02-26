import type {
  ChartTypePlugin, RenderContext, EventBus, DataPoint,
  PreparedData, TooltipConfig, ThemeConfig,
} from '../types'
import { createTooltip, type TooltipInstance } from '../tooltip/tooltip'
import { CSS_PREFIX } from '../constants'

export interface InteractionLayer {
  attach(svg: SVGElement | HTMLCanvasElement, container: HTMLElement): void
  detach(): void
  destroy(): void
}

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * Interaction layer — handles mouse/touch events on the chart.
 * Provides: hover highlights, tooltips, crosshair, click events.
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
): InteractionLayer {
  let targetEl: SVGElement | HTMLCanvasElement | null = null
  let container: HTMLElement | null = null
  let tooltip: TooltipInstance | null = null
  let crosshairEl: SVGLineElement | null = null
  let crosshairTipEl: HTMLDivElement | null = null
  let crosshairDots: SVGCircleElement[] = []
  let activePoint: { seriesIndex: number; pointIndex: number } | null = null
  let activeCrosshairIndex = -1

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

  /** Sync overlay SVG dimensions with the canvas */
  function syncOverlay(): void {
    if (!overlayEl || !targetEl) return
    const w = (targetEl as HTMLCanvasElement).clientWidth || parseInt((targetEl as HTMLCanvasElement).style.width) || 400
    const h = (targetEl as HTMLCanvasElement).clientHeight || parseInt((targetEl as HTMLCanvasElement).style.height) || 300
    overlayEl.setAttribute('viewBox', `0 0 ${w} ${h}`)
    overlayEl.setAttribute('width', String(w))
    overlayEl.setAttribute('height', String(h))
  }

  function isCrosshairEnabled(): boolean {
    try { return getContext().options.crosshair } catch { return false }
  }

  // -----------------------------------------------------------------------
  // Crosshair helpers
  // -----------------------------------------------------------------------

  function ensureCrosshairLine(): SVGLineElement {
    if (crosshairEl) return crosshairEl
    crosshairEl = document.createElementNS(SVG_NS, 'line')
    crosshairEl.setAttribute('class', 'chartts-crosshair-line')
    crosshairEl.setAttribute('stroke', theme.textMuted)
    crosshairEl.setAttribute('stroke-width', '1')
    crosshairEl.setAttribute('stroke-dasharray', '4,3')
    crosshairEl.style.pointerEvents = 'none'
    crosshairEl.style.opacity = '0'
    crosshairEl.style.transition = 'opacity 0.12s ease'
    return crosshairEl
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

  function clearCrosshairDots(): void {
    for (const d of crosshairDots) d.remove()
    crosshairDots = []
  }

  function showCrosshair(pointIndex: number, mouseX: number, mouseY: number): void {
    if (!targetEl || !container) return
    const overlay = getOverlay()
    if (!overlay) return

    if (isCanvas) syncOverlay()

    const ctx = getContext()
    const data = getData()
    const { area, xScale } = ctx

    const label = data.labels[pointIndex]!
    const xPos = xScale.map(label)

    // Vertical line
    const line = ensureCrosshairLine()
    line.setAttribute('x1', String(xPos))
    line.setAttribute('y1', String(area.y))
    line.setAttribute('x2', String(xPos))
    line.setAttribute('y2', String(area.y + area.height))
    line.style.opacity = '0.6'
    if (!line.parentElement) overlay.appendChild(line)

    // Dots on each series at this x
    clearCrosshairDots()
    for (const series of data.series) {
      const val = series.values[pointIndex]
      if (val == null) continue
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

    // Multi-series tooltip
    const tip = ensureCrosshairTip()
    let html = `<div style="font-weight:600;margin-bottom:6px;letter-spacing:-0.01em;">${formatLabel(label)}</div>`
    for (const series of data.series) {
      const val = series.values[pointIndex]
      if (val == null) continue
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
    if (crosshairEl) crosshairEl.style.opacity = '0'
    if (crosshairTipEl) {
      crosshairTipEl.style.opacity = '0'
      crosshairTipEl.style.transform = 'translateY(4px)'
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

    const { x, y, svgX, svgY } = toChartCoords(targetEl, e.clientX, e.clientY)

    const ctx = getContext()

    // Crosshair mode — snap to nearest label
    if (isCrosshairEnabled()) {
      const { area } = ctx
      if (svgX >= area.x && svgX <= area.x + area.width && svgY >= area.y && svgY <= area.y + area.height) {
        const idx = nearestLabelIndex(svgX)
        if (idx !== activeCrosshairIndex) {
          showCrosshair(idx, x, y)
        } else if (crosshairTipEl) {
          // Just reposition tooltip as mouse moves
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
        highlightPoint(hit.seriesIndex, hit.pointIndex, svgX, svgY)
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
  // Highlight / dim
  // -----------------------------------------------------------------------

  function highlightPoint(seriesIndex: number, pointIndex: number, hitX?: number, hitY?: number): void {
    const overlay = getOverlay()
    if (!overlay) return

    if (isCanvas) {
      // Canvas mode: draw highlight marker at the mouse hit position on the overlay SVG.
      // We use the actual hit coordinates (from hitTest) rather than trying to
      // recompute from scales, which only works for cartesian chart types.
      if (hitX == null || hitY == null) return
      syncOverlay()
      const data = getData()
      const series = data.series[seriesIndex]
      if (!series) return

      // Glow ring
      const glow = document.createElementNS(SVG_NS, 'circle')
      glow.setAttribute('cx', String(hitX))
      glow.setAttribute('cy', String(hitY))
      glow.setAttribute('r', '12')
      glow.setAttribute('fill', 'none')
      glow.setAttribute('stroke', series.color)
      glow.setAttribute('stroke-width', '2')
      glow.setAttribute('opacity', '0.3')
      glow.setAttribute('class', 'chartts-canvas-highlight')
      glow.style.pointerEvents = 'none'
      overlay.appendChild(glow)

      // Solid dot
      const dot = document.createElementNS(SVG_NS, 'circle')
      dot.setAttribute('cx', String(hitX))
      dot.setAttribute('cy', String(hitY))
      dot.setAttribute('r', '5')
      dot.setAttribute('fill', series.color)
      dot.setAttribute('stroke', '#fff')
      dot.setAttribute('stroke-width', '2')
      dot.setAttribute('class', 'chartts-canvas-highlight')
      dot.style.pointerEvents = 'none'
      overlay.appendChild(dot)

      return
    }

    // SVG mode: manipulate DOM elements directly
    const svg = targetEl as SVGElement

    // Find the target interactive element
    const target = svg.querySelector(
      `[data-series="${seriesIndex}"][data-index="${pointIndex}"]`,
    ) as SVGElement | null

    // Enlarge if it's a point
    if (target?.classList.contains('chartts-point')) {
      target.style.transition = 'r 0.15s ease, stroke-width 0.15s ease'
      target.setAttribute('r', '6')
      target.setAttribute('stroke-width', '3')
    }

    // Find the parent .chartts-series group that contains our target
    const targetGroup = target?.closest('.chartts-series')

    // Dim all series groups except the one containing our target
    svg.querySelectorAll('.chartts-series').forEach((el) => {
      if (el !== targetGroup) {
        ;(el as SVGElement).style.opacity = '0.3'
        ;(el as SVGElement).style.transition = 'opacity 0.15s ease'
      }
    })
  }

  function clearHighlights(): void {
    if (isCanvas) {
      // Canvas mode: remove overlay markers
      overlayEl?.querySelectorAll('.chartts-canvas-highlight').forEach(el => el.remove())
      return
    }

    const svg = targetEl as SVGElement | null
    if (!svg) return

    // Reset all points
    svg.querySelectorAll('.chartts-point').forEach((p) => {
      const el = p as SVGElement
      el.setAttribute('r', el.getAttribute('data-original-r') || '3.5')
      el.setAttribute('stroke-width', '2')
    })

    // Reset series opacity
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
        // Create transparent SVG overlay for interaction visuals
        containerEl.style.position = 'relative'
        overlayEl = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement
        const w = svgEl.clientWidth || parseInt((svgEl as HTMLCanvasElement).style.width) || 400
        const h = svgEl.clientHeight || parseInt((svgEl as HTMLCanvasElement).style.height) || 300
        overlayEl.setAttribute('viewBox', `0 0 ${w} ${h}`)
        overlayEl.setAttribute('width', String(w))
        overlayEl.setAttribute('height', String(h))
        overlayEl.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;overflow:visible;'
        containerEl.appendChild(overlayEl)
      }

      svgEl.style.cursor = 'crosshair'
      const el = svgEl as unknown as HTMLElement
      el.addEventListener('mousemove', onMouseMove as EventListener)
      el.addEventListener('mouseleave', onMouseLeave as EventListener)
      el.addEventListener('click', onClickHandler as EventListener)
    },

    detach(): void {
      if (!targetEl) return
      const el = targetEl as unknown as HTMLElement
      el.removeEventListener('mousemove', onMouseMove as EventListener)
      el.removeEventListener('mouseleave', onMouseLeave as EventListener)
      el.removeEventListener('click', onClickHandler as EventListener)
    },

    destroy(): void {
      this.detach()
      tooltip?.destroy()
      crosshairEl?.remove()
      crosshairTipEl?.remove()
      clearCrosshairDots()
      overlayEl?.remove()
      overlayEl = null
      targetEl = null
      container = null
    },
  }
}
