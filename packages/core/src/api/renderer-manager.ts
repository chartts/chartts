import type { ChartData, Renderer, RendererRoot, ThemeConfig } from '../types'
import { createSVGRenderer } from '../render/svg'
import { applyTheme } from '../theme/engine'
import { createEffectDefs } from '../render/effects'

/**
 * Renderer subsystem — selection, root creation, theme application.
 *
 * Only the SVG renderer is statically imported. Canvas and WebGL renderers
 * are loaded via dynamic import() when requested, keeping the core bundle small.
 */

export type RendererType = 'svg' | 'canvas' | 'webgl'

export interface RendererManager {
  renderer: Renderer
  root: RendererRoot
  readonly useCanvas: boolean
  readonly ready: Promise<void>
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
  onReady?: () => void
}): RendererManager {
  const { container, rendererType, className, ariaLabel } = config
  const useCanvas = rendererType === 'canvas' || rendererType === 'webgl'

  const rootAttrs = {
    class: `chartts ${className}`.trim(),
    role: 'img',
    ariaLabel,
  }

  // Always start with SVG (synchronous, zero-cost)
  let renderer: Renderer = createSVGRenderer()
  let root: RendererRoot = renderer.createRoot(container, config.width, config.height, rootAttrs)

  let readyResolve: () => void
  const ready = new Promise<void>(r => { readyResolve = r })

  if (!useCanvas) {
    applyTheme(root.element, config.theme)
    readyResolve!()
  } else {
    // Async-load Canvas or WebGL renderer
    const loadRenderer = rendererType === 'webgl'
      ? import('../render/webgl').then(m => m.createWebGLRenderer(config.theme))
      : import('../render/canvas').then(m => m.createCanvasRenderer(() => config.theme))

    loadRenderer.then(realRenderer => {
      renderer.destroy(root)
      renderer = realRenderer
      root = renderer.createRoot(container, config.width, config.height, rootAttrs)
      container.style.position = 'relative'
      container.style.background = config.theme.background
      mgr.renderer = renderer
      mgr.root = root
      readyResolve!()
      config.onReady?.()
    })
  }

  const mgr: RendererManager = {
    renderer,
    root,
    useCanvas,
    ready,

    applyTheme(theme: ThemeConfig) {
      if (useCanvas) {
        container.style.background = theme.background
      } else {
        applyTheme(this.root.element, theme)
      }
    },

    updateViewport(width: number, height: number) {
      if (useCanvas && this.root.element instanceof HTMLCanvasElement) {
        const canvas = this.root.element
        const dpr = window.devicePixelRatio || 1
        canvas.width = Math.round(width * dpr)
        canvas.height = Math.round(height * dpr)
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        const ctx2d = canvas.getContext('2d')!
        ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0)
      } else {
        this.root.element.setAttribute('viewBox', `0 0 ${width} ${height}`)
      }
    },

    injectEffectDefs(colors: string[]) {
      if (useCanvas) return
      const NS = 'http://www.w3.org/2000/svg'
      let fxDefs = this.root.element.querySelector('defs.chartts-fx') as SVGElement
      if (!fxDefs) {
        fxDefs = document.createElementNS(NS, 'defs')
        fxDefs.classList.add('chartts-fx')
        this.root.element.insertBefore(fxDefs, this.root.element.firstChild)
      }
      fxDefs.innerHTML = createEffectDefs(colors)
    },

    destroy() {
      this.renderer.destroy(this.root)
    },
  }

  return mgr
}
