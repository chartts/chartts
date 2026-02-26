import type { DataPoint, TooltipConfig, ThemeConfig } from '../types'
import { CSS_PREFIX } from '../constants'

/**
 * DOM-based tooltip.
 * A real HTML element — style it with CSS, Tailwind, whatever you want.
 */
export interface TooltipInstance {
  show(point: DataPoint, color: string, x: number, y: number, container: HTMLElement): void
  hide(): void
  destroy(): void
}

export function createTooltip(config: TooltipConfig, theme: ThemeConfig): TooltipInstance {
  let el: HTMLDivElement | null = null

  function getOrCreate(): HTMLDivElement {
    if (el) return el

    el = document.createElement('div')
    el.className = 'chartts-tooltip'
    el.style.cssText = `
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
    return el
  }

  function show(
    point: DataPoint,
    color: string,
    x: number,
    y: number,
    container: HTMLElement,
  ): void {
    const tip = getOrCreate()

    // Content
    if (config.render) {
      const result = config.render({ ...point, color })
      if (typeof result === 'string') {
        tip.innerHTML = result
      } else {
        tip.innerHTML = ''
        tip.appendChild(result)
      }
    } else if (config.format) {
      tip.textContent = config.format(point)
    } else {
      tip.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;box-shadow:0 0 6px ${color};"></span>
          <span style="font-weight:600;letter-spacing:-0.01em;">${point.seriesName}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:16px;">
          <span style="color:var(${CSS_PREFIX}-text-muted, #6b7280);font-size:0.9em;">${point.label}</span>
          <span style="font-size:1.15em;font-weight:700;font-variant-numeric:tabular-nums;">${point.value}</span>
        </div>
      `
    }

    // Position
    if (!tip.parentElement) {
      container.style.position = 'relative'
      container.appendChild(tip)
    }

    const tipRect = tip.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    let left = x - tipRect.width / 2
    let top = y - tipRect.height - 12

    // Keep within container bounds
    if (left < 0) left = 0
    if (left + tipRect.width > containerRect.width) left = containerRect.width - tipRect.width
    if (top < 0) top = y + 16

    tip.style.left = `${left}px`
    tip.style.top = `${top}px`
    tip.style.opacity = '1'
    tip.style.transform = 'translateY(0)'
  }

  function hide(): void {
    if (el) {
      el.style.opacity = '0'
      el.style.transform = 'translateY(4px)'
    }
  }

  function destroy(): void {
    el?.remove()
    el = null
  }

  return { show, hide, destroy }
}
