/**
 * Globe3D — single high-res sphere with data projected as glowing surface
 * patches, subtle baked graticule, labels, and legend.
 */

import type { GLChartTypePlugin, GLRenderContext, GLDataPoint, GLSeries3D } from '../../types'
import { hexToRGB } from '../../types'
import { createVertexBuffer, createIndexBuffer, createVertexLayout, applyVertexLayout, disableVertexLayout, type GLBuffer } from '../../engine/buffer'
import { MESH_VERT, MESH_VERT_UNIFORMS, MESH_VERT_ATTRIBUTES } from '../../shaders/mesh.vert'
import { MESH_FRAG, MESH_FRAG_UNIFORMS } from '../../shaders/mesh.frag'
import { mat4, mat4Identity, mat3NormalFromMat4 } from '../../engine/math'
import { setLightUniforms, defaultLightConfig } from '../../engine/lighting'
import { projectToScreen } from '../../engine/camera'

const GLOBE_RADIUS = 3
const SEGMENTS = 128
const RINGS = 64

function latLngToXYZ(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * Math.PI / 180
  const theta = (lng + 180) * Math.PI / 180
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ]
}

/** Great-circle angular distance between two lat/lng points (radians) */
function angularDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const p1 = lat1 * Math.PI / 180, p2 = lat2 * Math.PI / 180
  const dl = (lng2 - lng1) * Math.PI / 180
  return Math.acos(
    Math.min(1, Math.max(-1,
      Math.sin(p1) * Math.sin(p2) + Math.cos(p1) * Math.cos(p2) * Math.cos(dl)
    ))
  )
}

interface DataPatch {
  lat: number; lng: number; value: number; normValue: number
  color: [number, number, number]
  si: number; di: number; name: string; label: string
}

interface ScreenPoint {
  si: number; di: number; lat: number; lng: number
  wx: number; wy: number; wz: number
  value: number; name: string; label: string
}

export function createGlobe3DPlugin(): GLChartTypePlugin {
  let sphereVBO: GLBuffer | null = null
  let sphereIBO: GLBuffer | null = null
  let sphereIndexCount = 0
  const modelMatrix = mat4()
  const normalMatrix = new Float32Array(9)
  let screenPoints: ScreenPoint[] = []
  let seriesInfo: { name: string; color: string }[] = []

  return {
    type: 'globe3d',

    prepare(ctx: GLRenderContext) {
      const { renderer, data, theme } = ctx
      const gl = renderer.gl
      const series = data.series as GLSeries3D[]

      renderer.registerProgram('mesh', MESH_VERT, MESH_FRAG,
        [...MESH_VERT_UNIFORMS, ...MESH_FRAG_UNIFORMS], MESH_VERT_ATTRIBUTES)

      // Collect all data patches
      const patches: DataPatch[] = []
      let maxVal = 0
      for (const s of series) for (const v of s.values) if (Math.abs(v) > maxVal) maxVal = Math.abs(v)
      if (maxVal === 0) maxVal = 1

      seriesInfo = []
      screenPoints = []

      for (let sIdx = 0; sIdx < series.length; sIdx++) {
        const s = series[sIdx]!
        const colorHex = s.color ?? theme.colors[sIdx % theme.colors.length]!
        const color = hexToRGB(colorHex)
        seriesInfo.push({ name: s.name, color: colorHex })
        for (let di = 0; di < s.values.length; di++) {
          const lat = s.y?.[di] ?? 0, lng = s.x?.[di] ?? 0, value = s.values[di]!
          const normValue = Math.abs(value) / maxVal
          patches.push({ lat, lng, value, normValue, color, si: sIdx, di, name: s.name, label: data.categories?.[di] ?? '' })
          const [wx, wy, wz] = latLngToXYZ(lat, lng, GLOBE_RADIUS)
          screenPoints.push({ si: sIdx, di, lat, lng, wx, wy, wz, value, name: s.name, label: data.categories?.[di] ?? '' })
        }
      }

      // Build sphere with data baked into vertex colors
      const baseColor: [number, number, number] = [0.03, 0.05, 0.12]
      // Wide patch radius in radians (~45 degrees) for visible splashes
      const patchRadius = 0.8
      // Graticule parameters
      const gratLatStep = 30, gratLngStep = 30
      const gratWidth = 0.015
      const gratColor: [number, number, number] = [0.08, 0.12, 0.22]

      console.log(`[Globe3D] Building sphere ${SEGMENTS}x${RINGS}, ${patches.length} data patches`)

      const verts: number[] = []
      const indices: number[] = []
      let patchedVerts = 0

      for (let ring = 0; ring <= RINGS; ring++) {
        const phi = (ring / RINGS) * Math.PI
        const lat = 90 - (ring / RINGS) * 180
        for (let seg = 0; seg <= SEGMENTS; seg++) {
          const theta = (seg / SEGMENTS) * Math.PI * 2
          const lng = (seg / SEGMENTS) * 360 - 180
          const nx = Math.sin(phi) * Math.cos(theta)
          const ny = Math.cos(phi)
          const nz = Math.sin(phi) * Math.sin(theta)

          // Start with base color
          let r = baseColor[0], g = baseColor[1], b = baseColor[2]

          // Bake graticule: check proximity to lat/lng grid lines
          const latMod = ((lat % gratLatStep) + gratLatStep) % gratLatStep
          const latDist = Math.min(latMod, gratLatStep - latMod) * Math.PI / 180
          const lngMod = ((lng % gratLngStep) + gratLngStep) % gratLngStep
          const lngDist = Math.min(lngMod, gratLngStep - lngMod) * Math.PI / 180
          const gratDist = Math.min(latDist, lngDist)
          if (gratDist < gratWidth) {
            const gratT = 1 - gratDist / gratWidth
            r = r + (gratColor[0] - r) * gratT
            g = g + (gratColor[1] - g) * gratT
            b = b + (gratColor[2] - b) * gratT
          }

          // Accumulate data patch influence (additive)
          let ar = 0, ag = 0, ab = 0
          for (const patch of patches) {
            const dist = angularDistance(lat, lng, patch.lat, patch.lng)
            if (dist < patchRadius) {
              const t = 1 - dist / patchRadius
              // Linear core + soft outer glow
              const influence = t * (0.4 + t * 0.6) * patch.normValue
              ar += patch.color[0] * influence
              ag += patch.color[1] * influence
              ab += patch.color[2] * influence
            }
          }

          if (ar > 0.01 || ag > 0.01 || ab > 0.01) {
            patchedVerts++
            r = Math.min(1, r + ar)
            g = Math.min(1, g + ag)
            b = Math.min(1, b + ab)
          }

          verts.push(
            nx * GLOBE_RADIUS, ny * GLOBE_RADIUS, nz * GLOBE_RADIUS,
            nx, ny, nz,
            r, g, b,
          )
        }
      }

      console.log(`[Globe3D] ${patchedVerts} / ${(RINGS + 1) * (SEGMENTS + 1)} vertices colored by data`)

      // Triangulate
      for (let ring = 0; ring < RINGS; ring++) {
        for (let seg = 0; seg < SEGMENTS; seg++) {
          const a = ring * (SEGMENTS + 1) + seg
          const b = a + SEGMENTS + 1
          indices.push(a, b, a + 1, a + 1, b, b + 1)
        }
      }

      const vertArr = new Float32Array(verts)
      const use32 = (RINGS + 1) * (SEGMENTS + 1) > 65535
      const idxArr = use32 ? new Uint32Array(indices) : new Uint16Array(indices)

      if (sphereVBO) sphereVBO.update(vertArr); else sphereVBO = createVertexBuffer(gl, vertArr, gl.DYNAMIC_DRAW)
      if (sphereIBO) sphereIBO.update(idxArr); else sphereIBO = createIndexBuffer(gl, idxArr, gl.DYNAMIC_DRAW)
      sphereIndexCount = indices.length
      mat4Identity(modelMatrix)
    },

    render(ctx: GLRenderContext) {
      const { renderer, camera } = ctx
      const gl = renderer.gl
      const progress = ctx.animationProgress

      const prog = renderer.getProgram('mesh')!
      prog.use()
      prog.setMat4('u_projView', camera.projViewMatrix)
      prog.setMat4('u_model', modelMatrix)
      mat3NormalFromMat4(normalMatrix, modelMatrix)
      prog.setMat3('u_normalMatrix', normalMatrix)
      setLightUniforms(prog, defaultLightConfig(), camera.position)
      prog.setFloat('u_opacity', progress)

      if (sphereVBO && sphereIBO) {
        sphereVBO.bind()
        const layout = createVertexLayout([
          { location: prog.attributes['a_position']!, size: 3 },
          { location: prog.attributes['a_normal']!, size: 3 },
          { location: prog.attributes['a_color']!, size: 3 },
        ])
        applyVertexLayout(gl, layout)
        sphereIBO.bind()
        const indexType = (RINGS + 1) * (SEGMENTS + 1) > 65535 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT
        gl.drawElements(gl.TRIANGLES, sphereIndexCount, indexType, 0)
        disableVertexLayout(gl, layout)
      }
    },

    renderOverlay(ctx: GLRenderContext, ctx2d: CanvasRenderingContext2D) {
      const { camera, width, height, theme, animationProgress } = ctx
      if (animationProgress < 0.5) return

      ctx2d.save()

      // -- Point labels --
      // Deduplicate labels (multiple series share same locations)
      const seenLabels = new Set<string>()
      ctx2d.font = `${theme.fontSize - 1}px ${theme.fontFamily}`
      ctx2d.textBaseline = 'middle'

      for (const sp of screenPoints) {
        if (!sp.label || seenLabels.has(sp.label)) continue
        const screen = projectToScreen(
          new Float32Array([sp.wx, sp.wy, sp.wz]),
          camera.projViewMatrix, width, height,
        )
        if (!screen || screen.z < -1 || screen.z > 1 || screen.z > 0.97) continue
        seenLabels.add(sp.label)

        // Small dot at location
        ctx2d.fillStyle = theme.textColor
        ctx2d.globalAlpha = 0.7
        ctx2d.beginPath()
        ctx2d.arc(screen.x, screen.y, 2.5, 0, Math.PI * 2)
        ctx2d.fill()

        // Label
        ctx2d.fillStyle = theme.textColor
        ctx2d.globalAlpha = 0.85
        ctx2d.textAlign = 'left'
        ctx2d.fillText(sp.label, screen.x + 8, screen.y)
      }

      // -- Legend --
      if (seriesInfo.length > 1) {
        const lx = 12, ly = height - 14 - seriesInfo.length * 18

        ctx2d.fillStyle = 'rgba(0,0,0,0.45)'
        ctx2d.globalAlpha = 1
        ctx2d.beginPath()
        ctx2d.roundRect(lx - 6, ly - 8, 120, seriesInfo.length * 18 + 12, 6)
        ctx2d.fill()

        ctx2d.textAlign = 'left'
        ctx2d.textBaseline = 'top'
        ctx2d.font = `${theme.fontSize - 1}px ${theme.fontFamily}`
        for (let i = 0; i < seriesInfo.length; i++) {
          const s = seriesInfo[i]!
          const y = ly + i * 18
          ctx2d.fillStyle = s.color
          ctx2d.globalAlpha = 0.9
          ctx2d.beginPath()
          ctx2d.arc(lx + 4, y + 6, 4, 0, Math.PI * 2)
          ctx2d.fill()
          ctx2d.fillStyle = 'rgba(255,255,255,0.8)'
          ctx2d.fillText(s.name, lx + 14, y)
        }
      }

      ctx2d.restore()
    },

    needsLoop() { return false },

    hitTest(ctx: GLRenderContext, x: number, y: number): GLDataPoint | null {
      const { camera, width, height } = ctx
      let closest: GLDataPoint | null = null
      let closestDist = 25
      for (const sp of screenPoints) {
        const screen = projectToScreen(
          new Float32Array([sp.wx, sp.wy, sp.wz]),
          camera.projViewMatrix, width, height,
        )
        if (!screen || screen.z < -1 || screen.z > 1) continue
        const dist = Math.sqrt((screen.x - x) ** 2 + (screen.y - y) ** 2)
        if (dist < closestDist) {
          closestDist = dist
          closest = {
            seriesIndex: sp.si, dataIndex: sp.di, value: sp.value,
            x: sp.lng, y: sp.lat, seriesName: sp.label || sp.name,
          }
        }
      }
      return closest
    },

    dispose() {
      sphereVBO?.destroy(); sphereVBO = null
      sphereIBO?.destroy(); sphereIBO = null
      screenPoints = []
    },
  }
}
