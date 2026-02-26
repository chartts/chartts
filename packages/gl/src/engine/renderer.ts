/**
 * GLRenderer — dual canvas (WebGL + 2D overlay) rendering system.
 */

import type { ShaderProgram } from './shader'
import { createShaderProgram } from './shader'

export interface GLRenderer {
  gl: WebGLRenderingContext
  ctx2d: CanvasRenderingContext2D
  glCanvas: HTMLCanvasElement
  overlayCanvas: HTMLCanvasElement
  width: number
  height: number
  pixelRatio: number
  programs: Map<string, ShaderProgram>
  registerProgram(name: string, vert: string, frag: string, uniforms: string[], attributes: string[]): ShaderProgram
  getProgram(name: string): ShaderProgram | undefined
  resize(width: number, height: number): void
  beginFrame(): void
  endFrame(): void
  clear(r: number, g: number, b: number, a: number): void
  destroy(): void
}

export function createGLRenderer(container: HTMLElement): GLRenderer {
  const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

  // Create WebGL canvas
  const glCanvas = document.createElement('canvas')
  glCanvas.style.position = 'absolute'
  glCanvas.style.top = '0'
  glCanvas.style.left = '0'
  glCanvas.style.width = '100%'
  glCanvas.style.height = '100%'

  // Create 2D overlay canvas
  const overlayCanvas = document.createElement('canvas')
  overlayCanvas.style.position = 'absolute'
  overlayCanvas.style.top = '0'
  overlayCanvas.style.left = '0'
  overlayCanvas.style.width = '100%'
  overlayCanvas.style.height = '100%'
  overlayCanvas.style.pointerEvents = 'none'

  // Ensure container is positioned
  const containerPos = getComputedStyle(container).position
  if (containerPos === 'static') container.style.position = 'relative'

  container.appendChild(glCanvas)
  container.appendChild(overlayCanvas)

  const gl = glCanvas.getContext('webgl', {
    antialias: true,
    alpha: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    depth: true,
    stencil: false,
  })

  if (!gl) throw new Error('[chartts/gl] WebGL not supported')

  const ctx2d = overlayCanvas.getContext('2d')!

  // Enable depth test and back-face culling
  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL)
  gl.enable(gl.CULL_FACE)
  gl.cullFace(gl.BACK)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  const width = container.clientWidth
  const height = container.clientHeight

  const renderer: GLRenderer = {
    gl,
    ctx2d,
    glCanvas,
    overlayCanvas,
    width,
    height,
    pixelRatio,
    programs: new Map(),

    registerProgram(name, vert, frag, uniforms, attributes) {
      const existing = this.programs.get(name)
      if (existing) return existing
      const prog = createShaderProgram(gl, vert, frag, uniforms, attributes)
      this.programs.set(name, prog)
      return prog
    },

    getProgram(name) {
      return this.programs.get(name)
    },

    resize(w, h) {
      this.width = w
      this.height = h
      const pw = Math.round(w * pixelRatio)
      const ph = Math.round(h * pixelRatio)
      glCanvas.width = pw
      glCanvas.height = ph
      overlayCanvas.width = pw
      overlayCanvas.height = ph
      gl.viewport(0, 0, pw, ph)
      ctx2d.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    },

    beginFrame() {
      // Clear 2D overlay
      ctx2d.clearRect(0, 0, this.width, this.height)
    },

    endFrame() {
      gl.flush()
    },

    clear(r, g, b, a) {
      gl.clearColor(r, g, b, a)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    },

    destroy() {
      for (const prog of this.programs.values()) {
        prog.destroy()
      }
      this.programs.clear()
      glCanvas.remove()
      overlayCanvas.remove()
    },
  }

  renderer.resize(width, height)
  return renderer
}
