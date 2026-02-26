/**
 * Line3D — single line as tube/ribbon via Frenet frames.
 */

import type { GLChartTypePlugin, GLRenderContext, GLDataPoint, GLSeries3D } from '../../types'
import { hexToRGB } from '../../types'
import { createVertexBuffer, createIndexBuffer, createVertexLayout, applyVertexLayout, disableVertexLayout, type GLBuffer } from '../../engine/buffer'
import { MESH_VERT, MESH_VERT_UNIFORMS, MESH_VERT_ATTRIBUTES } from '../../shaders/mesh.vert'
import { MESH_FRAG, MESH_FRAG_UNIFORMS } from '../../shaders/mesh.frag'
import { mat4, mat4Identity, mat3NormalFromMat4, vec3, vec3Cross, vec3Normalize } from '../../engine/math'
import { setLightUniforms, defaultLightConfig } from '../../engine/lighting'
import { projectToScreen } from '../../engine/camera'

export function createLine3DPlugin(): GLChartTypePlugin {
  let vbo: GLBuffer | null = null
  let ibo: GLBuffer | null = null
  let indexCount = 0
  let indexType: number = 0
  const modelMatrix = mat4()
  const normalMatrix = new Float32Array(9)
  let tubePoints: { di: number; x: number; y: number; z: number; value: number; name: string }[] = []

  return {
    type: 'line3d',

    prepare(ctx: GLRenderContext) {
      const { renderer, data, options, theme } = ctx
      const gl = renderer.gl
      const series = data.series as GLSeries3D[]
      const s = series[0]
      if (!s || s.values.length < 2) return

      renderer.registerProgram('mesh', MESH_VERT, MESH_FRAG,
        [...MESH_VERT_UNIFORMS, ...MESH_FRAG_UNIFORMS], MESH_VERT_ATTRIBUTES)

      const tubeRadius = (options['tubeRadius'] as number | undefined) ?? 0.15
      const tubeSides = (options['tubeSides'] as number | undefined) ?? 8
      const color = hexToRGB(s.color ?? theme.colors[0]!)
      const n = s.values.length

      const points: [number, number, number][] = []
      for (let i = 0; i < n; i++) points.push([s.x?.[i] ?? i, s.values[i]!, s.z?.[i] ?? 0])

      // Tangents
      const tangents: [number, number, number][] = []
      for (let i = 0; i < n; i++) {
        const prev = points[Math.max(0, i - 1)]!, next = points[Math.min(n - 1, i + 1)]!
        const t = vec3(next[0] - prev[0], next[1] - prev[1], next[2] - prev[2])
        vec3Normalize(t, t)
        tangents.push([t[0]!, t[1]!, t[2]!])
      }

      // Frenet frames
      const t0 = tangents[0]!
      const initNormal: [number, number, number] = Math.abs(t0[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]
      const normals: [number, number, number][] = []
      const binormals: [number, number, number][] = []

      const N = vec3(0, 0, 0), B = vec3(0, 0, 0)
      const T = vec3(t0[0], t0[1], t0[2])
      vec3Cross(B, T, vec3(initNormal[0], initNormal[1], initNormal[2]))
      vec3Normalize(B, B)
      vec3Cross(N, B, T); vec3Normalize(N, N)
      normals.push([N[0]!, N[1]!, N[2]!])
      binormals.push([B[0]!, B[1]!, B[2]!])

      for (let i = 1; i < n; i++) {
        const t = tangents[i]!
        const T2 = vec3(t[0], t[1], t[2])
        vec3Cross(B, T2, N); vec3Normalize(B, B)
        vec3Cross(N, B, T2); vec3Normalize(N, N)
        normals.push([N[0]!, N[1]!, N[2]!])
        binormals.push([B[0]!, B[1]!, B[2]!])
      }

      const verts: number[] = []
      const indices: number[] = []
      tubePoints = []

      for (let i = 0; i < n; i++) {
        const p = points[i]!, nm = normals[i]!, bi = binormals[i]!
        for (let j = 0; j < tubeSides; j++) {
          const angle = (j / tubeSides) * Math.PI * 2
          const cos = Math.cos(angle), sin = Math.sin(angle)
          const nx = nm[0] * cos + bi[0] * sin, ny = nm[1] * cos + bi[1] * sin, nz = nm[2] * cos + bi[2] * sin
          verts.push(p[0] + nx * tubeRadius, p[1] + ny * tubeRadius, p[2] + nz * tubeRadius, nx, ny, nz, color[0], color[1], color[2])
        }
        tubePoints.push({ di: i, x: p[0], y: p[1], z: p[2], value: s.values[i]!, name: s.name })
      }

      for (let i = 0; i < n - 1; i++) for (let j = 0; j < tubeSides; j++) {
        const j2 = (j + 1) % tubeSides
        const a = i * tubeSides + j, b = i * tubeSides + j2, c = (i + 1) * tubeSides + j, d = (i + 1) * tubeSides + j2
        indices.push(a, c, b, b, c, d)
      }

      const vertArr = new Float32Array(verts)
      const use32 = verts.length / 9 > 65535
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
      gl.drawElements(gl.TRIANGLES, indexCount, indexType, 0)
      disableVertexLayout(gl, layout)
    },

    hitTest(ctx: GLRenderContext, x: number, y: number): GLDataPoint | null {
      const { camera, width, height } = ctx
      let closest: GLDataPoint | null = null
      let closestDist = 15
      for (const d of tubePoints) {
        const screen = projectToScreen(new Float32Array([d.x, d.y, d.z]), camera.projViewMatrix, width, height)
        if (!screen || screen.z < -1 || screen.z > 1) continue
        const dist = Math.sqrt((screen.x - x) ** 2 + (screen.y - y) ** 2)
        if (dist < closestDist) { closestDist = dist; closest = { seriesIndex: 0, dataIndex: d.di, value: d.value, x: d.x, y: d.y, z: d.z, seriesName: d.name } }
      }
      return closest
    },

    dispose() { vbo?.destroy(); vbo = null; ibo?.destroy(); ibo = null; tubePoints = [] },
  }
}
