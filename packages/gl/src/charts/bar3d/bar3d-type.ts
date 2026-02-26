/**
 * Bar3D — cuboid mesh per bar, Phong lit.
 */

import type { GLChartTypePlugin, GLRenderContext, GLDataPoint, GLSeries3D } from '../../types'
import { hexToRGB } from '../../types'
import { createVertexBuffer, createIndexBuffer, createVertexLayout, applyVertexLayout, disableVertexLayout, type GLBuffer } from '../../engine/buffer'
import { MESH_VERT, MESH_VERT_UNIFORMS, MESH_VERT_ATTRIBUTES } from '../../shaders/mesh.vert'
import { MESH_FRAG, MESH_FRAG_UNIFORMS } from '../../shaders/mesh.frag'
import { mat4, mat4Identity, mat3NormalFromMat4 } from '../../engine/math'
import { setLightUniforms, defaultLightConfig } from '../../engine/lighting'
import { projectToScreen } from '../../engine/camera'

function buildCuboid(
  cx: number, cy: number, cz: number,
  sx: number, sy: number, sz: number,
  r: number, g: number, b: number,
  verts: number[], indices: number[], baseVertex: number,
) {
  const hx = sx * 0.5, hy = sy * 0.5, hz = sz * 0.5
  const faces = [
    { p: [[1,1,1],[1,-1,1],[1,-1,-1],[1,1,-1]], n: [1,0,0] },
    { p: [[-1,1,-1],[-1,-1,-1],[-1,-1,1],[-1,1,1]], n: [-1,0,0] },
    { p: [[-1,1,-1],[-1,1,1],[1,1,1],[1,1,-1]], n: [0,1,0] },
    { p: [[-1,-1,1],[-1,-1,-1],[1,-1,-1],[1,-1,1]], n: [0,-1,0] },
    { p: [[-1,1,1],[-1,-1,1],[1,-1,1],[1,1,1]], n: [0,0,1] },
    { p: [[1,1,-1],[1,-1,-1],[-1,-1,-1],[-1,1,-1]], n: [0,0,-1] },
  ]
  let vi = baseVertex
  for (const face of faces) {
    for (const p of face.p) {
      verts.push(cx + p[0]! * hx, cy + p[1]! * hy, cz + p[2]! * hz, face.n[0]!, face.n[1]!, face.n[2]!, r, g, b)
    }
    indices.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3)
    vi += 4
  }
}

interface BarInfo { si: number; di: number; cx: number; cy: number; cz: number; height: number; name: string; value: number }

export function createBar3DPlugin(): GLChartTypePlugin {
  let vbo: GLBuffer | null = null
  let ibo: GLBuffer | null = null
  let indexCount = 0
  let indexType: number = 0
  const modelMatrix = mat4()
  const normalMatrix = new Float32Array(9)
  let barData: BarInfo[] = []

  return {
    type: 'bar3d',

    prepare(ctx: GLRenderContext) {
      const { renderer, data, options, theme } = ctx
      const gl = renderer.gl
      const series = data.series as GLSeries3D[]

      renderer.registerProgram('mesh', MESH_VERT, MESH_FRAG,
        [...MESH_VERT_UNIFORMS, ...MESH_FRAG_UNIFORMS], MESH_VERT_ATTRIBUTES)

      const verts: number[] = []
      const indices: number[] = []
      barData = []
      let baseVertex = 0
      const barWidth = (options['barWidth'] as number | undefined) ?? 0.6
      const barDepth = (options['barDepth'] as number | undefined) ?? 0.6

      for (let si = 0; si < series.length; si++) {
        const s = series[si]!
        const color = hexToRGB(s.color ?? theme.colors[si % theme.colors.length]!)
        for (let di = 0; di < s.values.length; di++) {
          const x = s.x?.[di] ?? di
          const z = s.z?.[di] ?? si
          const height = s.values[di]!
          const cy = height * 0.5
          buildCuboid(x, cy, z, barWidth, Math.max(0.01, height), barDepth, color[0], color[1], color[2], verts, indices, baseVertex)
          baseVertex += 24
          barData.push({ si, di, cx: x, cy, cz: z, height, name: s.name, value: height })
        }
      }

      const vertArr = new Float32Array(verts)
      const use32 = baseVertex > 65535
      const idxArr = use32 ? new Uint32Array(indices) : new Uint16Array(indices)

      if (vbo) vbo.update(vertArr); else vbo = createVertexBuffer(gl, vertArr, gl.DYNAMIC_DRAW)
      if (ibo) ibo.update(idxArr); else ibo = createIndexBuffer(gl, idxArr, gl.DYNAMIC_DRAW)
      indexCount = indices.length
      indexType = use32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT
      mat4Identity(modelMatrix)
    },

    render(ctx: GLRenderContext) {
      const { renderer, camera } = ctx
      const gl = renderer.gl
      const prog = renderer.getProgram('mesh')!
      const progress = ctx.animationProgress

      prog.use()
      prog.setMat4('u_projView', camera.projViewMatrix)
      const animModel = mat4(); mat4Identity(animModel)
      animModel[5] = progress
      prog.setMat4('u_model', animModel)
      mat3NormalFromMat4(normalMatrix, animModel)
      prog.setMat3('u_normalMatrix', normalMatrix)
      setLightUniforms(prog, defaultLightConfig(), camera.position)
      prog.setFloat('u_opacity', 1.0)

      if (!vbo || !ibo || indexCount === 0) return
      vbo.bind()
      const layout = createVertexLayout([
        { location: prog.attributes['a_position']!, size: 3 },
        { location: prog.attributes['a_normal']!, size: 3 },
        { location: prog.attributes['a_color']!, size: 3 },
      ])
      applyVertexLayout(gl, layout)
      ibo.bind()
      gl.drawElements(gl.TRIANGLES, indexCount, indexType, 0)
      disableVertexLayout(gl, layout)
    },

    hitTest(ctx: GLRenderContext, x: number, y: number): GLDataPoint | null {
      const { camera, width, height } = ctx
      let closest: GLDataPoint | null = null
      let closestDist = 30
      for (const d of barData) {
        const screen = projectToScreen(new Float32Array([d.cx, d.cy, d.cz]), camera.projViewMatrix, width, height)
        if (!screen || screen.z < -1 || screen.z > 1) continue
        const dist = Math.sqrt((screen.x - x) ** 2 + (screen.y - y) ** 2)
        if (dist < closestDist) {
          closestDist = dist
          closest = { seriesIndex: d.si, dataIndex: d.di, value: d.value, x: d.cx, y: d.cy, z: d.cz, seriesName: d.name }
        }
      }
      return closest
    },

    dispose() {
      vbo?.destroy(); vbo = null
      ibo?.destroy(); ibo = null
      barData = []
    },
  }
}
