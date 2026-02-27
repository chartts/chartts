/**
 * Surface3D — grid heightmap mesh with computed normals, wireframe option.
 */

import type { GLChartTypePlugin, GLRenderContext, GLDataPoint } from '../../types'
import { createVertexBuffer, createIndexBuffer, createVertexLayout, applyVertexLayout, disableVertexLayout, type GLBuffer } from '../../engine/buffer'
import { MESH_VERT, MESH_VERT_UNIFORMS, MESH_VERT_ATTRIBUTES } from '../../shaders/mesh.vert'
import { MESH_FRAG, MESH_FRAG_UNIFORMS } from '../../shaders/mesh.frag'
import { mat4, mat4Identity, mat3NormalFromMat4 } from '../../engine/math'
import { setLightUniforms, defaultLightConfig } from '../../engine/lighting'
import { projectToScreen } from '../../engine/camera'

function heightToColor(v: number, min: number, range: number): [number, number, number] {
  const t = range > 0 ? (v - min) / range : 0.5
  // Deep blue -> teal -> emerald -> gold -> coral
  if (t < 0.2) { const s = t / 0.2; return [0.1 + s * 0.05, 0.15 + s * 0.35, 0.6 + s * 0.2] }
  if (t < 0.4) { const s = (t - 0.2) / 0.2; return [0.15 - s * 0.05, 0.5 + s * 0.3, 0.8 - s * 0.25] }
  if (t < 0.6) { const s = (t - 0.4) / 0.2; return [0.1 + s * 0.6, 0.8 - s * 0.1, 0.55 - s * 0.35] }
  if (t < 0.8) { const s = (t - 0.6) / 0.2; return [0.7 + s * 0.28, 0.7 - s * 0.2, 0.2 - s * 0.05] }
  const s = (t - 0.8) / 0.2; return [0.98, 0.5 - s * 0.15, 0.15 + s * 0.2]
}

export function createSurface3DPlugin(): GLChartTypePlugin {
  let vbo: GLBuffer | null = null
  let ibo: GLBuffer | null = null
  let indexCount = 0
  let indexType: number = 0
  let drawMode: number = 0
  const modelMatrix = mat4()
  const normalMatrix = new Float32Array(9)
  let gridPoints: { x: number; y: number; z: number; row: number; col: number }[] = []

  return {
    type: 'surface3d',

    prepare(ctx: GLRenderContext) {
      const { renderer, data, options } = ctx
      const gl = renderer.gl
      const grid = data.grid
      if (!grid || grid.length === 0) return

      renderer.registerProgram('mesh', MESH_VERT, MESH_FRAG,
        [...MESH_VERT_UNIFORMS, ...MESH_FRAG_UNIFORMS], MESH_VERT_ATTRIBUTES)

      const rows = grid.length
      const cols = grid[0]!.length

      let min = Infinity, max = -Infinity
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const v = grid[r]![c]!; if (v < min) min = v; if (v > max) max = v
      }
      const range = max - min

      const verts = new Float32Array(rows * cols * 9)
      gridPoints = []
      let vi = 0

      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const y = grid[r]![c]!
        const x = c / (cols - 1 || 1) * 10 - 5
        const z = r / (rows - 1 || 1) * 10 - 5
        const yl = c > 0 ? grid[r]![c - 1]! : y
        const yr = c < cols - 1 ? grid[r]![c + 1]! : y
        const yd = r > 0 ? grid[r - 1]![c]! : y
        const yu = r < rows - 1 ? grid[r + 1]![c]! : y
        const dx = 10 / (cols - 1 || 1), dz = 10 / (rows - 1 || 1)
        const nx = (yl - yr) / (2 * dx), nz = (yd - yu) / (2 * dz)
        const len = Math.sqrt(nx * nx + 1 + nz * nz)
        const color = heightToColor(y, min, range)
        verts[vi++] = x; verts[vi++] = y; verts[vi++] = z
        verts[vi++] = nx / len; verts[vi++] = 1 / len; verts[vi++] = nz / len
        verts[vi++] = color[0]; verts[vi++] = color[1]; verts[vi++] = color[2]
        gridPoints.push({ x, y, z, row: r, col: c })
      }

      const isWireframe = options.wireframe === true
      const indices: number[] = []
      if (isWireframe) {
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const idx = r * cols + c
          if (c < cols - 1) indices.push(idx, idx + 1)
          if (r < rows - 1) indices.push(idx, idx + cols)
        }
        drawMode = gl.LINES
      } else {
        for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) {
          const tl = r * cols + c
          indices.push(tl, tl + cols, tl + 1, tl + 1, tl + cols, tl + cols + 1)
        }
        drawMode = gl.TRIANGLES
      }

      const maxIdx = rows * cols
      const use32 = maxIdx > 65535
      const idxArr = use32 ? new Uint32Array(indices) : new Uint16Array(indices)
      if (vbo) vbo.update(verts); else vbo = createVertexBuffer(gl, verts, gl.DYNAMIC_DRAW)
      if (ibo) ibo.update(idxArr); else ibo = createIndexBuffer(gl, idxArr, gl.DYNAMIC_DRAW)
      indexCount = indices.length
      indexType = use32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT
      mat4Identity(modelMatrix)
    },

    render(ctx: GLRenderContext) {
      const { renderer, camera } = ctx
      const gl = renderer.gl
      const prog = renderer.getProgram('mesh')!

      prog.use()
      prog.setMat4('u_projView', camera.projViewMatrix)
      prog.setMat4('u_model', modelMatrix)
      mat3NormalFromMat4(normalMatrix, modelMatrix)
      prog.setMat3('u_normalMatrix', normalMatrix)
      setLightUniforms(prog, defaultLightConfig(), camera.position)
      prog.setFloat('u_opacity', ctx.animationProgress)

      if (!vbo || !ibo || indexCount === 0) return
      vbo.bind()
      const layout = createVertexLayout([
        { location: prog.attributes['a_position']!, size: 3 },
        { location: prog.attributes['a_normal']!, size: 3 },
        { location: prog.attributes['a_color']!, size: 3 },
      ])
      applyVertexLayout(gl, layout)
      ibo.bind()
      gl.disable(gl.CULL_FACE)
      gl.drawElements(drawMode, indexCount, indexType, 0)
      gl.enable(gl.CULL_FACE)
      disableVertexLayout(gl, layout)
    },

    hitTest(ctx: GLRenderContext, x: number, y: number): GLDataPoint | null {
      const { camera, width, height, data } = ctx
      let closest: GLDataPoint | null = null
      let closestDist = 20
      for (const gp of gridPoints) {
        const screen = projectToScreen(new Float32Array([gp.x, gp.y, gp.z]), camera.projViewMatrix, width, height)
        if (!screen || screen.z < -1 || screen.z > 1) continue
        const dist = Math.sqrt((screen.x - x) ** 2 + (screen.y - y) ** 2)
        if (dist < closestDist) {
          closestDist = dist
          closest = { seriesIndex: 0, dataIndex: gp.row * (data.grid?.[0]?.length ?? 0) + gp.col, value: gp.y, x: gp.x, y: gp.y, z: gp.z, seriesName: `[${gp.row},${gp.col}]` }
        }
      }
      return closest
    },

    dispose() { vbo?.destroy(); vbo = null; ibo?.destroy(); ibo = null; gridPoints = [] },
  }
}
