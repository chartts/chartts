/**
 * Lines3D — multiple 3D polylines with thick line shader.
 */

import type { GLChartTypePlugin, GLRenderContext, GLDataPoint, GLSeries3D } from '../../types'
import { hexToRGB } from '../../types'
import { createVertexBuffer, createIndexBuffer, createVertexLayout, applyVertexLayout, disableVertexLayout, type GLBuffer } from '../../engine/buffer'
import { LINE_VERT, LINE_VERT_UNIFORMS, LINE_VERT_ATTRIBUTES } from '../../shaders/line.vert'
import { LINE_FRAG, LINE_FRAG_UNIFORMS } from '../../shaders/line.frag'
import { mat4, mat4Identity } from '../../engine/math'
import { projectToScreen } from '../../engine/camera'

interface LPoint { si: number; di: number; x: number; y: number; z: number; value: number; name: string }

export function createLines3DPlugin(): GLChartTypePlugin {
  let vbo: GLBuffer | null = null
  let ibo: GLBuffer | null = null
  let indexCount = 0
  let indexType: number = 0
  const modelMatrix = mat4()
  let linePoints: LPoint[] = []

  return {
    type: 'lines3d',

    prepare(ctx: GLRenderContext) {
      const { renderer, data, theme } = ctx
      const gl = renderer.gl
      const series = data.series as GLSeries3D[]

      renderer.registerProgram('line3d', LINE_VERT, LINE_FRAG,
        [...LINE_VERT_UNIFORMS, ...LINE_FRAG_UNIFORMS], LINE_VERT_ATTRIBUTES)

      const verts: number[] = []
      const indices: number[] = []
      linePoints = []
      let baseVertex = 0

      for (let si = 0; si < series.length; si++) {
        const s = series[si]!
        const color = hexToRGB(s.color ?? theme.colors[si % theme.colors.length]!)
        for (let di = 0; di < s.values.length - 1; di++) {
          const x0 = s.x?.[di] ?? di, y0 = s.values[di]!, z0 = s.z?.[di] ?? 0
          const x1 = s.x?.[di + 1] ?? (di + 1), y1 = s.values[di + 1]!, z1 = s.z?.[di + 1] ?? 0
          for (const side of [-1, 1]) verts.push(x0, y0, z0, x1, y1, z1, color[0], color[1], color[2], side)
          for (const side of [-1, 1]) verts.push(x1, y1, z1, x1, y1, z1, color[0], color[1], color[2], side)
          indices.push(baseVertex, baseVertex + 2, baseVertex + 1, baseVertex + 1, baseVertex + 2, baseVertex + 3)
          baseVertex += 4
          if (di === 0) linePoints.push({ si, di, x: x0, y: y0, z: z0, value: y0, name: s.name })
          linePoints.push({ si, di: di + 1, x: x1, y: y1, z: z1, value: y1, name: s.name })
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
      const prog = renderer.getProgram('line3d')!

      prog.use()
      prog.setMat4('u_projView', camera.projViewMatrix)
      prog.setMat4('u_model', modelMatrix)
      prog.setVec2('u_resolution', ctx.width * renderer.pixelRatio, ctx.height * renderer.pixelRatio)
      prog.setFloat('u_lineWidth', (ctx.options.lineWidth ?? 2) * renderer.pixelRatio)
      prog.setFloat('u_opacity', ctx.animationProgress)

      if (!vbo || !ibo || indexCount === 0) return
      vbo.bind()
      const layout = createVertexLayout([
        { location: prog.attributes['a_position']!, size: 3 },
        { location: prog.attributes['a_next']!, size: 3 },
        { location: prog.attributes['a_color']!, size: 3 },
        { location: prog.attributes['a_side']!, size: 1 },
      ])
      applyVertexLayout(gl, layout)
      gl.disable(gl.CULL_FACE)
      ibo.bind()
      gl.drawElements(gl.TRIANGLES, indexCount, indexType, 0)
      gl.enable(gl.CULL_FACE)
      disableVertexLayout(gl, layout)
    },

    hitTest(ctx: GLRenderContext, x: number, y: number): GLDataPoint | null {
      const { camera, width, height } = ctx
      let closest: GLDataPoint | null = null
      let closestDist = 15
      for (const d of linePoints) {
        const screen = projectToScreen(new Float32Array([d.x, d.y, d.z]), camera.projViewMatrix, width, height)
        if (!screen || screen.z < -1 || screen.z > 1) continue
        const dist = Math.sqrt((screen.x - x) ** 2 + (screen.y - y) ** 2)
        if (dist < closestDist) { closestDist = dist; closest = { seriesIndex: d.si, dataIndex: d.di, value: d.value, x: d.x, y: d.y, z: d.z, seriesName: d.name } }
      }
      return closest
    },

    dispose() { vbo?.destroy(); vbo = null; ibo?.destroy(); ibo = null; linePoints = [] },
  }
}
