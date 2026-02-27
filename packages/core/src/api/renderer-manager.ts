import type { ChartData, Renderer, RendererRoot, ThemeConfig } from '../types'
import { createSVGRenderer } from '../render/svg'
import { createCanvasRenderer } from '../render/canvas'
import { createWebGLRenderer } from '../render/webgl'
import { applyTheme } from '../theme/engine'
import { createEffectDefs } from '../render/effects'

/**
 * Renderer subsystem — selection, root creation, theme application.
 * Extracted from createChart to keep the orchestrator lean.
 */

export type RendererType = 'svg' | 'canvas' | 'webgl'

export interface RendererManager {
  readonly renderer: Renderer
  readonly root: RendererRoot
  readonly useCanvas: boolean
  applyTheme(theme: ThemeConfig): void
  updateViewport(width: number, height: number): void
  injectEffectDefs(colors: string[]): void
  destroy(): void
}

/**
 * Resolve renderer type from option string, auto-detecting based on data volume.
 */
export function resolveRendererType(renderer: string, data: ChartData): RendererType {
  if (renderer === 'canvas' || renderer === 'webgl' || renderer === 'svg') return renderer
  // 'auto' — choose based on data volume
  const totalPoints = data.series.reduce((sum, s) => sum + s.values.length, 0)
  return totalPoints > 100_000 ? 'webgl' : totalPoints > 5_000 ? 'canvas' : 'svg'
}

export function createRendererManager(config: {
  container: HTMLElement
  rendererType: RendererType
  theme: ThemeConfig
  width: number
  height: number
  className: string
  ariaLabel: string
}): RendererManager {
  const { container, rendererType, className, ariaLabel } = config
  const useCanvas = rendererType === 'canvas' || rendererType === 'webgl'

  const renderer: Renderer = rendererType === 'webgl'
    ? createWebGLRenderer(config.theme)
    : rendererType === 'canvas'
      ? createCanvasRenderer(() => config.theme)
      : createSVGRenderer()

  const root: RendererRoot = renderer.createRoot(container, config.width, config.height, {
    class: `chartts ${className}`.trim(),
    role: 'img',
    ariaLabel,
  })

  if (!useCanvas) {
    applyTheme(root.element, config.theme)
  } else {
    container.style.position = 'relative'
    container.style.background = config.theme.background
  }

  return {
    renderer,
    root,
    useCanvas,

    applyTheme(theme: ThemeConfig) {
      if (useCanvas) {
        container.style.background = theme.background
      } else {
        applyTheme(root.element, theme)
      }
    },

    updateViewport(width: number, height: number) {
      if (useCanvas) {
        const canvas = root.element as HTMLCanvasElement
        const dpr = window.devicePixelRatio || 1
        canvas.width = Math.round(width * dpr)
        canvas.height = Math.round(height * dpr)
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        const ctx2d = canvas.getContext('2d')!
        ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0)
      } else {
        root.element.setAttribute('viewBox', `0 0 ${width} ${height}`)
      }
    },

    injectEffectDefs(colors: string[]) {
      if (useCanvas) return
      const NS = 'http://www.w3.org/2000/svg'
      let fxDefs = root.element.querySelector('defs.chartts-fx') as SVGElement
      if (!fxDefs) {
        fxDefs = document.createElementNS(NS, 'defs')
        fxDefs.classList.add('chartts-fx')
        root.element.insertBefore(fxDefs, root.element.firstChild)
      }
      fxDefs.innerHTML = createEffectDefs(colors)
    },

    destroy() {
      renderer.destroy(root)
    },
  }
}
