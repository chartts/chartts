/**
 * Torus3D — stacked cylindrical rings revolved around Y axis.
 * Each data value = one ring with radius proportional to value.
 * Blocky stepped profile with smooth rounded transitions between rings.
 */

import type { GLChartTypePlugin, GLRenderContext, GLDataPoint, GLSeries3D } from '../../types'
import { hexToRGB } from '../../types'
import { createVertexBuffer, createIndexBuffer, createVertexLayout, applyVertexLayout, disableVertexLayout, type GLBuffer } from '../../engine/buffer'
import { MESH_VERT, MESH_VERT_UNIFORMS, MESH_VERT_ATTRIBUTES } from '../../shaders/mesh.vert'
import { MESH_FRAG, MESH_FRAG_UNIFORMS } from '../../shaders/mesh.frag'
import { mat4, mat4Identity, mat3NormalFromMat4 } from '../../engine/math'
import { setLightUniforms, defaultLightConfig } from '../../engine/lighting'
import { projectToScreen } from '../../engine/camera'

export interface Torus3DOptions {
  /** Scale for ring radius. Default 1. */
  intensity?: number
}

const RADIAL_SEGMENTS = 64
const HEIGHT_STEPS = 200
const TOTAL_HEIGHT = 6.0
const MIN_RADIUS = 0.6
const MAX_RADIUS = 2.0
interface LabelPoint {
  si: number; di: number
  wx: number; wy: number; wz: number
  value: number; label: string; color: string
}

export function createTorus3DPlugin(): GLChartTypePlugin {
  let vbo: GLBuffer | null = null
  let ibo: GLBuffer | null = null
  let indexCount = 0
  let use32bit = false
  const modelMatrix = mat4()
  const normalMatrix = new Float32Array(9)
  let labelPoints: LabelPoint[] = []

  return {
    type: 'torus3d',

    prepare(ctx: GLRenderContext) {
      const { renderer, data, options, theme } = ctx
      const gl = renderer.gl
      const series = data.series as GLSeries3D[]

      renderer.registerProgram('mesh', MESH_VERT, MESH_FRAG,
        [...MESH_VERT_UNIFORMS, ...MESH_FRAG_UNIFORMS], MESH_VERT_ATTRIBUTES)

      const s = series[0]
      if (!s || s.values.length === 0) return

      const opts = options as unknown as Torus3DOptions
      const intensity = opts.intensity ?? 1
      const numRings = s.values.length

      let maxVal = 0
      for (const v of s.values) if (Math.abs(v) > maxVal) maxVal = Math.abs(v)
      if (maxVal === 0) maxVal = 1

      // Radius per ring
      const ringRadii: number[] = []
      for (let i = 0; i < numRings; i++) {
        const norm = Math.abs(s.values[i]!) / maxVal
        ringRadii.push((MIN_RADIUS + norm * (MAX_RADIUS - MIN_RADIUS)) * intensity)
      }

      // Colors per ring
      const ringColors: [number, number, number][] = []
      const ringHexColors: string[] = []
      for (let i = 0; i < numRings; i++) {
        const hex = theme.colors[i % theme.colors.length]!
        ringHexColors.push(hex)
        ringColors.push(hexToRGB(hex))
      }

      // Catmull-Rom spline through ring radii for fully smooth curve
      function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
        return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t)
      }

      function radiusAt(t: number): number {
        const f = t * (numRings - 1)
        const i = Math.max(0, Math.min(Math.floor(f), numRings - 2))
        const frac = f - i
        const p0 = ringRadii[Math.max(0, i - 1)]!
        const p1 = ringRadii[i]!
        const p2 = ringRadii[Math.min(numRings - 1, i + 1)]!
        const p3 = ringRadii[Math.min(numRings - 1, i + 2)]!
        return Math.max(MIN_RADIUS * 0.5, catmullRom(p0, p1, p2, p3, frac))
      }

      function colorAt(t: number): [number, number, number] {
        const f = t * (numRings - 1)
        const i = Math.max(0, Math.min(Math.floor(f), numRings - 2))
        const frac = f - i
        const c0 = ringColors[Math.max(0, i - 1)]!
        const c1 = ringColors[i]!
        const c2 = ringColors[Math.min(numRings - 1, i + 1)]!
        const c3 = ringColors[Math.min(numRings - 1, i + 2)]!
        return [
          Math.max(0, Math.min(1, catmullRom(c0[0], c1[0], c2[0], c3[0], frac))),
          Math.max(0, Math.min(1, catmullRom(c0[1], c1[1], c2[1], c3[1], frac))),
          Math.max(0, Math.min(1, catmullRom(c0[2], c1[2], c2[2], c3[2], frac))),
        ]
      }

      const verts: number[] = []
      const indices: number[] = []
      labelPoints = []

      for (let h = 0; h <= HEIGHT_STEPS; h++) {
        const t = h / HEIGHT_STEPS
        const y = (t - 0.5) * TOTAL_HEIGHT
        const radius = radiusAt(t)
        const color = colorAt(t)

        // Finite difference normal slope
        const eps = 0.002
        const rPrev = radiusAt(Math.max(0, t - eps))
        const rNext = radiusAt(Math.min(1, t + eps))
        const drdy = (rNext - rPrev) / (2 * eps * TOTAL_HEIGHT)

        for (let seg = 0; seg <= RADIAL_SEGMENTS; seg++) {
          const theta = (seg / RADIAL_SEGMENTS) * Math.PI * 2
          const cosT = Math.cos(theta)
          const sinT = Math.sin(theta)

          const nx = cosT
          const ny = -drdy
          const nz = sinT
          const nlen = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1

          verts.push(
            radius * cosT, y, radius * sinT,
            nx / nlen, ny / nlen, nz / nlen,
            color[0], color[1], color[2],
          )
        }
      }

      // Labels at each ring center
      for (let i = 0; i < numRings; i++) {
        const t = (i + 0.5) / numRings
        const y = (t - 0.5) * TOTAL_HEIGHT
        const r = ringRadii[i]!
        labelPoints.push({
          si: 0, di: i,
          wx: r + 0.4, wy: y, wz: 0,
          value: s.values[i]!,
          label: data.categories?.[i] ?? `${i + 1}`,
          color: ringHexColors[i]!,
        })
      }

      // Triangulate
      for (let h = 0; h < HEIGHT_STEPS; h++) {
        for (let seg = 0; seg < RADIAL_SEGMENTS; seg++) {
          const a = h * (RADIAL_SEGMENTS + 1) + seg
          const b = a + RADIAL_SEGMENTS + 1
          indices.push(a, a + 1, b, a + 1, b + 1, b)
        }
      }

      // End caps
      const capStart = verts.length / 9
      const bottomColor = colorAt(0)
      verts.push(0, -0.5 * TOTAL_HEIGHT, 0, 0, -1, 0, bottomColor[0], bottomColor[1], bottomColor[2])
      const topColor = colorAt(1)
      verts.push(0, 0.5 * TOTAL_HEIGHT, 0, 0, 1, 0, topColor[0], topColor[1], topColor[2])

      for (let seg = 0; seg < RADIAL_SEGMENTS; seg++) {
        indices.push(capStart, seg + 1, seg) // bottom
        const topRow = HEIGHT_STEPS * (RADIAL_SEGMENTS + 1)
        indices.push(capStart + 1, topRow + seg, topRow + seg + 1) // top
      }

      const vertArr = new Float32Array(verts)
      use32bit = verts.length / 9 > 65535
      const idxArr = use32bit ? new Uint32Array(indices) : new Uint16Array(indices)

      if (vbo) vbo.update(vertArr); else vbo = createVertexBuffer(gl, vertArr, gl.DYNAMIC_DRAW)
      if (ibo) ibo.update(idxArr); else ibo = createIndexBuffer(gl, idxArr, gl.DYNAMIC_DRAW)
      indexCount = indices.length
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

      if (vbo && ibo) {
        gl.disable(gl.CULL_FACE)
        vbo.bind()
        const layout = createVertexLayout([
          { location: prog.attributes['a_position']!, size: 3 },
          { location: prog.attributes['a_normal']!, size: 3 },
          { location: prog.attributes['a_color']!, size: 3 },
        ])
        applyVertexLayout(gl, layout)
        ibo.bind()
        gl.drawElements(gl.TRIANGLES, indexCount, use32bit ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0)
        disableVertexLayout(gl, layout)
        gl.enable(gl.CULL_FACE)
      }
    },

    renderOverlay(ctx: GLRenderContext, ctx2d: CanvasRenderingContext2D) {
      const { camera, width, height, theme, animationProgress } = ctx
      if (animationProgress < 0.3) return
      ctx2d.save()
      ctx2d.font = `bold ${theme.fontSize}px ${theme.fontFamily}`
      ctx2d.textBaseline = 'middle'
      for (const lp of labelPoints) {
        const screen = projectToScreen(new Float32Array([lp.wx, lp.wy, lp.wz]), camera.projViewMatrix, width, height)
        if (!screen || screen.z < -1 || screen.z > 1) continue
        ctx2d.fillStyle = lp.color
        ctx2d.globalAlpha = 0.9
        ctx2d.beginPath()
        ctx2d.arc(screen.x, screen.y, 4, 0, Math.PI * 2)
        ctx2d.fill()
        ctx2d.fillStyle = theme.textColor
        ctx2d.globalAlpha = 0.85
        ctx2d.textAlign = 'left'
        ctx2d.fillText(`${lp.label}: ${lp.value}`, screen.x + 10, screen.y)
      }
      ctx2d.restore()
    },

    needsLoop() { return false },

    hitTest(ctx: GLRenderContext, x: number, y: number): GLDataPoint | null {
      const { camera, width, height } = ctx
      let closest: GLDataPoint | null = null
      let closestDist = 30
      for (const lp of labelPoints) {
        const screen = projectToScreen(new Float32Array([lp.wx, lp.wy, lp.wz]), camera.projViewMatrix, width, height)
        if (!screen || screen.z < -1 || screen.z > 1) continue
        const dist = Math.sqrt((screen.x - x) ** 2 + (screen.y - y) ** 2)
        if (dist < closestDist) {
          closestDist = dist
          closest = { seriesIndex: lp.si, dataIndex: lp.di, value: lp.value, x: screen.x, y: screen.y, seriesName: lp.label }
        }
      }
      return closest
    },

    dispose() {
      vbo?.destroy(); vbo = null
      ibo?.destroy(); ibo = null
      labelPoints = []
    },
  }
}
