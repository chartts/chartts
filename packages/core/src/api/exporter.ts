import type { RendererRoot } from '../types'

/**
 * Chart export subsystem — toSVG, toPNG, toClipboard.
 * Extracted from createChart to keep the orchestrator lean.
 */

export interface ExporterDeps {
  getRoot: () => RendererRoot
  getWidth: () => number
  getHeight: () => number
  isCanvas: boolean
}

export interface Exporter {
  toSVG(): string
  toPNG(opts?: { scale?: number }): Promise<Blob>
  toClipboard(): Promise<void>
}

export function createExporter(deps: ExporterDeps): Exporter {
  const { getRoot, getWidth, getHeight, isCanvas } = deps

  function toSVG(): string {
    if (isCanvas) throw new Error('[chartts] toSVG() is not available with canvas renderer')
    return getRoot().element.outerHTML
  }

  async function toPNG(opts?: { scale?: number }): Promise<Blob> {
    // Canvas renderer: export directly from the canvas
    if (isCanvas) {
      const canvas = getRoot().element as HTMLCanvasElement
      return new Promise((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error('PNG export failed')), 'image/png')
      })
    }

    // SVG renderer: rasterize via Image
    const scale = opts?.scale ?? 2
    const w = getWidth()
    const h = getHeight()
    const canvas = document.createElement('canvas')
    canvas.width = w * scale
    canvas.height = h * scale
    const canvasCtx = canvas.getContext('2d')!
    const svgStr = toSVG()
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.width = w * scale
    img.height = h * scale

    return new Promise((resolve, reject) => {
      img.onload = () => {
        canvasCtx.drawImage(img, 0, 0, w * scale, h * scale)
        URL.revokeObjectURL(url)
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error('PNG export failed')), 'image/png')
      }
      img.onerror = reject
      img.src = url
    })
  }

  async function toClipboard(): Promise<void> {
    const blob = await toPNG()
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ])
  }

  return { toSVG, toPNG, toClipboard }
}
