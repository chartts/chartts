/**
 * 3D ground grid — wireframe grid plane for spatial reference in 3D charts.
 */

import { createVertexBuffer, createVertexLayout, applyVertexLayout, disableVertexLayout, type GLBuffer } from './buffer'
import type { GLRenderer } from './renderer'
import type { CameraState } from './camera'

const GRID_VERT = /* glsl */ `
precision highp float;
attribute vec3 a_position;
attribute vec3 a_color;
uniform mat4 u_projView;
varying vec3 v_color;
void main() {
  gl_Position = u_projView * vec4(a_position, 1.0);
  v_color = a_color;
}
`

const GRID_FRAG = /* glsl */ `
precision highp float;
uniform float u_opacity;
varying vec3 v_color;
void main() {
  gl_FragColor = vec4(v_color, u_opacity);
}
`

export interface Grid3D {
  update(bounds: GridBounds): void
  render(camera: CameraState, opacity: number): void
  destroy(): void
}

export interface GridBounds {
  minX: number; maxX: number
  minZ: number; maxZ: number
  y: number  // height of grid plane
}

export function createGrid3D(renderer: GLRenderer): Grid3D {
  const gl = renderer.gl

  renderer.registerProgram('grid3d', GRID_VERT, GRID_FRAG,
    ['u_projView', 'u_opacity'], ['a_position', 'a_color'])

  let vbo: GLBuffer | null = null
  let lineCount = 0

  return {
    update(bounds: GridBounds) {
      const { minX, maxX, minZ, maxZ, y } = bounds
      const rangeX = maxX - minX || 1
      const rangeZ = maxZ - minZ || 1
      const maxRange = Math.max(rangeX, rangeZ)

      // Determine grid step size (aim for ~10 lines per axis)
      const rawStep = maxRange / 10
      const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
      const normalized = rawStep / magnitude
      const step = normalized < 2 ? magnitude : normalized < 5 ? 2 * magnitude : 5 * magnitude

      const gridColor: [number, number, number] = [0.18, 0.2, 0.28]
      const axisColor: [number, number, number] = [0.3, 0.35, 0.5]
      const verts: number[] = []

      // Extend grid slightly beyond data bounds
      const pad = step
      const gMinX = Math.floor((minX - pad) / step) * step
      const gMaxX = Math.ceil((maxX + pad) / step) * step
      const gMinZ = Math.floor((minZ - pad) / step) * step
      const gMaxZ = Math.ceil((maxZ + pad) / step) * step

      // Lines parallel to Z axis
      for (let x = gMinX; x <= gMaxX + step * 0.01; x += step) {
        const isAxis = Math.abs(x) < step * 0.01
        const c = isAxis ? axisColor : gridColor
        verts.push(x, y, gMinZ, c[0], c[1], c[2])
        verts.push(x, y, gMaxZ, c[0], c[1], c[2])
      }

      // Lines parallel to X axis
      for (let z = gMinZ; z <= gMaxZ + step * 0.01; z += step) {
        const isAxis = Math.abs(z) < step * 0.01
        const c = isAxis ? axisColor : gridColor
        verts.push(gMinX, y, z, c[0], c[1], c[2])
        verts.push(gMaxX, y, z, c[0], c[1], c[2])
      }

      const data = new Float32Array(verts)
      if (vbo) vbo.update(data); else vbo = createVertexBuffer(gl, data, gl.DYNAMIC_DRAW)
      lineCount = verts.length / 6 / 2
    },

    render(camera: CameraState, opacity: number) {
      if (!vbo || lineCount === 0) return
      const prog = renderer.getProgram('grid3d')!
      prog.use()
      prog.setMat4('u_projView', camera.projViewMatrix)
      prog.setFloat('u_opacity', opacity * 0.4)

      vbo.bind()
      const layout = createVertexLayout([
        { location: prog.attributes['a_position']!, size: 3 },
        { location: prog.attributes['a_color']!, size: 3 },
      ])
      applyVertexLayout(gl, layout)
      gl.disable(gl.DEPTH_TEST)
      gl.drawArrays(gl.LINES, 0, lineCount * 2)
      gl.enable(gl.DEPTH_TEST)
      disableVertexLayout(gl, layout)
    },

    destroy() {
      vbo?.destroy()
      vbo = null
    },
  }
}
