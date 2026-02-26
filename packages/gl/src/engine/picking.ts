/**
 * GPU color-based picking via offscreen FBO.
 * Each object rendered with unique RGB color → readPixels → O(1) hit test.
 */

export interface PickingSystem {
  begin(): void
  end(): void
  pick(x: number, y: number): number
  idToColor(id: number): [number, number, number]
  resize(width: number, height: number): void
  destroy(): void
}

export function createPickingSystem(gl: WebGLRenderingContext, width: number, height: number, pixelRatio: number): PickingSystem {
  const pw = Math.round(width * pixelRatio)
  const ph = Math.round(height * pixelRatio)

  const framebuffer = gl.createFramebuffer()!
  const texture = gl.createTexture()!
  const depthBuffer = gl.createRenderbuffer()!

  function setupFBO(w: number, h: number) {
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer)
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h)

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  setupFBO(pw, ph)

  let currentWidth = pw
  let currentHeight = ph

  const pixel = new Uint8Array(4)

  return {
    begin() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
      gl.viewport(0, 0, currentWidth, currentHeight)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      // Disable blending for pick pass — we need exact IDs
      gl.disable(gl.BLEND)
    },

    end() {
      gl.enable(gl.BLEND)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, currentWidth, currentHeight)
    },

    pick(x: number, y: number): number {
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
      const px = Math.round(x * pixelRatio)
      const py = currentHeight - Math.round(y * pixelRatio)
      gl.readPixels(px, py, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)

      if (pixel[3] === 0) return -1 // no hit
      return pixel[0]! + pixel[1]! * 256 + pixel[2]! * 65536
    },

    idToColor(id: number): [number, number, number] {
      return [
        (id & 0xFF) / 255,
        ((id >> 8) & 0xFF) / 255,
        ((id >> 16) & 0xFF) / 255,
      ]
    },

    resize(w: number, h: number) {
      currentWidth = Math.round(w * pixelRatio)
      currentHeight = Math.round(h * pixelRatio)
      setupFBO(currentWidth, currentHeight)
    },

    destroy() {
      gl.deleteFramebuffer(framebuffer)
      gl.deleteTexture(texture)
      gl.deleteRenderbuffer(depthBuffer)
    },
  }
}
