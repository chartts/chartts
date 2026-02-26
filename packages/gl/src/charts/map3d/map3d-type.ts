/**
 * Map3D — extruded regions with choropleth coloring.
 */

import type { GLChartTypePlugin, GLRenderContext, GLDataPoint, GLSeries3D } from '../../types'
import { createVertexBuffer, createIndexBuffer, createVertexLayout, applyVertexLayout, disableVertexLayout, type GLBuffer } from '../../engine/buffer'
import { MESH_VERT, MESH_VERT_UNIFORMS, MESH_VERT_ATTRIBUTES } from '../../shaders/mesh.vert'
import { MESH_FRAG, MESH_FRAG_UNIFORMS } from '../../shaders/mesh.frag'
import { mat4, mat4Identity, mat3NormalFromMat4 } from '../../engine/math'
import { setLightUniforms, defaultLightConfig } from '../../engine/lighting'
import { projectToScreen } from '../../engine/camera'

function valueToColor(v: number, min: number, range: number): [number, number, number] {
  const t = range > 0 ? (v - min) / range : 0.5
  return [0.2 + t * 0.6, 0.3 + (1 - t) * 0.4, 0.8 - t * 0.5]
}

interface RegionData { name: string; cx: number; cy: number; cz: number; value: number; si: number; di: number }

export function createMap3DPlugin(): GLChartTypePlugin {
  let vbo: GLBuffer | null = null
  let ibo: GLBuffer | null = null
  let indexCount = 0
  let indexType: number = 0
  const modelMatrix = mat4()
  const normalMatrix = new Float32Array(9)
  let regionData: RegionData[] = []

  return {
    type: 'map3d',

    prepare(ctx: GLRenderContext) {
      const { renderer, data, options } = ctx
      const gl = renderer.gl
      const series = data.series as GLSeries3D[]

      renderer.registerProgram('mesh', MESH_VERT, MESH_FRAG,
        [...MESH_VERT_UNIFORMS, ...MESH_FRAG_UNIFORMS], MESH_VERT_ATTRIBUTES)

      const verts: number[] = [], indices: number[] = []
      regionData = []
      let baseVertex = 0
      let min = Infinity, max = -Infinity
      for (const s of series) for (const v of s.values) { if (v < min) min = v; if (v > max) max = v }
      const range = max - min
      const extrudeHeight = (options['extrudeHeight'] as number | undefined) ?? 1.0

      for (let si = 0; si < series.length; si++) {
        const s = series[si]!
        for (let di = 0; di < s.values.length; di++) {
          const value = s.values[di]!, height = value / (max || 1) * extrudeHeight
          const color = valueToColor(value, min, range)
          const px = s.x?.[di] ?? (di % 10) * 1.2, pz = s.z?.[di] ?? Math.floor(di / 10) * 1.2
          const w = 0.9, d = 0.9, topY = height
          const darker: [number, number, number] = [color[0] * 0.7, color[1] * 0.7, color[2] * 0.7]

          // Top face
          verts.push(px, topY, pz, 0, 1, 0, ...color, px + w, topY, pz, 0, 1, 0, ...color, px + w, topY, pz + d, 0, 1, 0, ...color, px, topY, pz + d, 0, 1, 0, ...color)
          indices.push(baseVertex, baseVertex + 1, baseVertex + 2, baseVertex, baseVertex + 2, baseVertex + 3)
          baseVertex += 4

          // 4 side faces
          const sides: [number[], number[], number[], number[], number[]][] = [
            [[px, 0, pz], [px + w, 0, pz], [px + w, topY, pz], [px, topY, pz], [0, 0, -1]],
            [[px + w, 0, pz], [px + w, 0, pz + d], [px + w, topY, pz + d], [px + w, topY, pz], [1, 0, 0]],
            [[px + w, 0, pz + d], [px, 0, pz + d], [px, topY, pz + d], [px + w, topY, pz + d], [0, 0, 1]],
            [[px, 0, pz + d], [px, 0, pz], [px, topY, pz], [px, topY, pz + d], [-1, 0, 0]],
          ]
          for (const [p0, p1, p2, p3, n] of sides) {
            verts.push(p0[0]!, p0[1]!, p0[2]!, n[0]!, n[1]!, n[2]!, ...darker)
            verts.push(p1[0]!, p1[1]!, p1[2]!, n[0]!, n[1]!, n[2]!, ...darker)
            verts.push(p2[0]!, p2[1]!, p2[2]!, n[0]!, n[1]!, n[2]!, ...darker)
            verts.push(p3[0]!, p3[1]!, p3[2]!, n[0]!, n[1]!, n[2]!, ...darker)
            indices.push(baseVertex, baseVertex + 1, baseVertex + 2, baseVertex, baseVertex + 2, baseVertex + 3)
            baseVertex += 4
          }
          regionData.push({ name: data.categories?.[di] ?? s.name, cx: px + w * 0.5, cy: topY, cz: pz + d * 0.5, value, si, di })
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

      prog.use()
      prog.setMat4('u_projView', camera.projViewMatrix)
      const animModel = mat4(); mat4Identity(animModel); animModel[5] = ctx.animationProgress
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

    renderOverlay(ctx: GLRenderContext, ctx2d: CanvasRenderingContext2D) {
      ctx2d.font = `${ctx.theme.fontSize}px ${ctx.theme.fontFamily}`
      ctx2d.fillStyle = ctx.theme.textColor; ctx2d.textAlign = 'center'
      for (const r of regionData) {
        const screen = projectToScreen(new Float32Array([r.cx, r.cy + 0.3, r.cz]), ctx.camera.projViewMatrix, ctx.width, ctx.height)
        if (screen && screen.z > -1 && screen.z < 1) ctx2d.fillText(r.name, screen.x, screen.y)
      }
    },

    hitTest(ctx: GLRenderContext, x: number, y: number): GLDataPoint | null {
      let closest: GLDataPoint | null = null
      let closestDist = 30
      for (const r of regionData) {
        const screen = projectToScreen(new Float32Array([r.cx, r.cy, r.cz]), ctx.camera.projViewMatrix, ctx.width, ctx.height)
        if (!screen || screen.z < -1 || screen.z > 1) continue
        const dist = Math.sqrt((screen.x - x) ** 2 + (screen.y - y) ** 2)
        if (dist < closestDist) { closestDist = dist; closest = { seriesIndex: r.si, dataIndex: r.di, value: r.value, x: r.cx, y: r.cy, z: r.cz, seriesName: r.name } }
      }
      return closest
    },

    dispose() { vbo?.destroy(); vbo = null; ibo?.destroy(); ibo = null; regionData = [] },
  }
}
