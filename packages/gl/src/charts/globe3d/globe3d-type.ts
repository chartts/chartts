/**
 * Globe3D — UV sphere with lat/lng data mapping.
 */

import type { GLChartTypePlugin, GLRenderContext, GLDataPoint, GLSeries3D } from '../../types'
import { hexToRGB } from '../../types'
import { createVertexBuffer, createIndexBuffer, createVertexLayout, applyVertexLayout, disableVertexLayout, type GLBuffer } from '../../engine/buffer'
import { MESH_VERT, MESH_VERT_UNIFORMS, MESH_VERT_ATTRIBUTES } from '../../shaders/mesh.vert'
import { MESH_FRAG, MESH_FRAG_UNIFORMS } from '../../shaders/mesh.frag'
import { POINT_VERT, POINT_VERT_UNIFORMS, POINT_VERT_ATTRIBUTES } from '../../shaders/point.vert'
import { POINT_FRAG, POINT_FRAG_UNIFORMS } from '../../shaders/point.frag'
import { mat4, mat4Identity, mat3NormalFromMat4 } from '../../engine/math'
import { setLightUniforms, defaultLightConfig } from '../../engine/lighting'
import { projectToScreen } from '../../engine/camera'

function latLngToXYZ(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * Math.PI / 180
  const theta = (lng + 180) * Math.PI / 180
  return [-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta)]
}

interface GlobePoint { si: number; di: number; lat: number; lng: number; wx: number; wy: number; wz: number; value: number; name: string }

export function createGlobe3DPlugin(): GLChartTypePlugin {
  let sphereVBO: GLBuffer | null = null
  let sphereIBO: GLBuffer | null = null
  let sphereIndexCount = 0
  let pointVBO: GLBuffer | null = null
  let pointCount = 0
  const modelMatrix = mat4()
  const normalMatrix = new Float32Array(9)
  let globePoints: GlobePoint[] = []

  return {
    type: 'globe3d',

    prepare(ctx: GLRenderContext) {
      const { renderer, data, theme } = ctx
      const gl = renderer.gl
      const series = data.series as GLSeries3D[]

      renderer.registerProgram('mesh', MESH_VERT, MESH_FRAG,
        [...MESH_VERT_UNIFORMS, ...MESH_FRAG_UNIFORMS], MESH_VERT_ATTRIBUTES)
      renderer.registerProgram('point3d', POINT_VERT, POINT_FRAG,
        [...POINT_VERT_UNIFORMS, ...POINT_FRAG_UNIFORMS], POINT_VERT_ATTRIBUTES)

      const globeRadius = 3
      const segments = 64, rings = 32
      const sphereColor: [number, number, number] = [0.12, 0.22, 0.48]

      // Build UV sphere
      const sv: number[] = [], si: number[] = []
      for (let ring = 0; ring <= rings; ring++) {
        const phi = (ring / rings) * Math.PI
        for (let seg = 0; seg <= segments; seg++) {
          const theta = (seg / segments) * Math.PI * 2
          const nx = Math.sin(phi) * Math.cos(theta), ny = Math.cos(phi), nz = Math.sin(phi) * Math.sin(theta)
          sv.push(nx * globeRadius, ny * globeRadius, nz * globeRadius, nx, ny, nz, ...sphereColor)
        }
      }
      for (let ring = 0; ring < rings; ring++) for (let seg = 0; seg < segments; seg++) {
        const a = ring * (segments + 1) + seg, b = a + segments + 1
        si.push(a, b, a + 1, a + 1, b, b + 1)
      }

      if (sphereVBO) sphereVBO.update(new Float32Array(sv)); else sphereVBO = createVertexBuffer(gl, new Float32Array(sv), gl.STATIC_DRAW)
      if (sphereIBO) sphereIBO.update(new Uint16Array(si)); else sphereIBO = createIndexBuffer(gl, new Uint16Array(si), gl.STATIC_DRAW)
      sphereIndexCount = si.length

      // Data points
      globePoints = []
      const pv: number[] = []
      for (let sIdx = 0; sIdx < series.length; sIdx++) {
        const s = series[sIdx]!
        const color = hexToRGB(s.color ?? theme.colors[sIdx % theme.colors.length]!)
        for (let di = 0; di < s.values.length; di++) {
          const lat = s.y?.[di] ?? 0, lng = s.x?.[di] ?? 0, value = s.values[di]!
          const [wx, wy, wz] = latLngToXYZ(lat, lng, globeRadius * (1 + value * 0.005))
          pv.push(wx, wy, wz, color[0], color[1], color[2], Math.max(4, value * 0.3))
          globePoints.push({ si: sIdx, di, lat, lng, wx, wy, wz, value, name: s.name })
        }
      }
      if (pointVBO) pointVBO.update(new Float32Array(pv)); else pointVBO = createVertexBuffer(gl, new Float32Array(pv), gl.DYNAMIC_DRAW)
      pointCount = globePoints.length
      mat4Identity(modelMatrix)
    },

    render(ctx: GLRenderContext) {
      const { renderer, camera } = ctx
      const gl = renderer.gl
      const progress = ctx.animationProgress

      // Sphere
      const meshProg = renderer.getProgram('mesh')!
      meshProg.use()
      meshProg.setMat4('u_projView', camera.projViewMatrix)
      meshProg.setMat4('u_model', modelMatrix)
      mat3NormalFromMat4(normalMatrix, modelMatrix)
      meshProg.setMat3('u_normalMatrix', normalMatrix)
      setLightUniforms(meshProg, defaultLightConfig(), camera.position)
      meshProg.setFloat('u_opacity', progress * 0.9)

      if (sphereVBO && sphereIBO) {
        sphereVBO.bind()
        const ml = createVertexLayout([
          { location: meshProg.attributes['a_position']!, size: 3 },
          { location: meshProg.attributes['a_normal']!, size: 3 },
          { location: meshProg.attributes['a_color']!, size: 3 },
        ])
        applyVertexLayout(gl, ml)
        sphereIBO.bind()
        gl.drawElements(gl.TRIANGLES, sphereIndexCount, gl.UNSIGNED_SHORT, 0)
        disableVertexLayout(gl, ml)
      }

      // Data points
      const pointProg = renderer.getProgram('point3d')
      if (pointProg && pointVBO && pointCount > 0) {
        pointProg.use()
        pointProg.setMat4('u_projView', camera.projViewMatrix)
        pointProg.setMat4('u_model', modelMatrix)
        pointProg.setFloat('u_pixelRatio', renderer.pixelRatio)
        pointProg.setFloat('u_sizeAttenuation', 30.0)
        pointProg.setFloat('u_opacity', progress)
        pointVBO.bind()
        const pl = createVertexLayout([
          { location: pointProg.attributes['a_position']!, size: 3 },
          { location: pointProg.attributes['a_color']!, size: 3 },
          { location: pointProg.attributes['a_size']!, size: 1 },
        ])
        applyVertexLayout(gl, pl)
        gl.drawArrays(gl.POINTS, 0, pointCount)
        disableVertexLayout(gl, pl)
      }
    },

    needsLoop() { return false },

    hitTest(ctx: GLRenderContext, x: number, y: number): GLDataPoint | null {
      const { camera, width, height } = ctx
      let closest: GLDataPoint | null = null
      let closestDist = 20
      for (const gp of globePoints) {
        const screen = projectToScreen(new Float32Array([gp.wx, gp.wy, gp.wz]), camera.projViewMatrix, width, height)
        if (!screen || screen.z < -1 || screen.z > 1) continue
        const dist = Math.sqrt((screen.x - x) ** 2 + (screen.y - y) ** 2)
        if (dist < closestDist) { closestDist = dist; closest = { seriesIndex: gp.si, dataIndex: gp.di, value: gp.value, x: gp.lng, y: gp.lat, seriesName: gp.name } }
      }
      return closest
    },

    dispose() {
      sphereVBO?.destroy(); sphereVBO = null
      sphereIBO?.destroy(); sphereIBO = null
      pointVBO?.destroy(); pointVBO = null
      globePoints = []
    },
  }
}
