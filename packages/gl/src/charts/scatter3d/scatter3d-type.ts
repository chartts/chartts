/**
 * Scatter3D — GL_POINTS in 3D space with SDF circles.
 */

import type { GLChartTypePlugin, GLRenderContext, GLDataPoint, GLSeries3D } from '../../types'
import { hexToRGB } from '../../types'
import { createVertexBuffer, createVertexLayout, applyVertexLayout, disableVertexLayout, type GLBuffer } from '../../engine/buffer'
import { POINT_VERT, POINT_VERT_UNIFORMS, POINT_VERT_ATTRIBUTES } from '../../shaders/point.vert'
import { POINT_FRAG, POINT_FRAG_UNIFORMS } from '../../shaders/point.frag'
import { mat4, mat4Identity } from '../../engine/math'
import { projectToScreen } from '../../engine/camera'

interface PointData { seriesIndex: number; dataIndex: number; x: number; y: number; z: number; value: number; name: string }

export function createScatter3DPlugin(): GLChartTypePlugin {
  let vbo: GLBuffer | null = null
  let pointCount = 0
  let seriesData: PointData[] = []
  const modelMatrix = mat4()

  return {
    type: 'scatter3d',

    prepare(ctx: GLRenderContext) {
      const { renderer, data, options, theme } = ctx
      const gl = renderer.gl
      const series = data.series as GLSeries3D[]

      renderer.registerProgram('point3d',
        POINT_VERT, POINT_FRAG,
        [...POINT_VERT_UNIFORMS, ...POINT_FRAG_UNIFORMS],
        POINT_VERT_ATTRIBUTES,
      )

      const floatsPerVertex = 7
      seriesData = []
      let totalPoints = 0
      for (const s of series) totalPoints += s.values.length

      const vertices = new Float32Array(totalPoints * floatsPerVertex)
      let offset = 0
      const defaultSize = options.pointSize ?? 8

      for (let si = 0; si < series.length; si++) {
        const s = series[si]!
        const color = hexToRGB(s.color ?? theme.colors[si % theme.colors.length]!)
        const size = s.size ?? defaultSize

        for (let di = 0; di < s.values.length; di++) {
          const x = s.x?.[di] ?? di
          const y = s.values[di]!
          const z = s.z?.[di] ?? 0

          vertices[offset++] = x
          vertices[offset++] = y
          vertices[offset++] = z
          vertices[offset++] = color[0]
          vertices[offset++] = color[1]
          vertices[offset++] = color[2]
          vertices[offset++] = size

          seriesData.push({ seriesIndex: si, dataIndex: di, x, y, z, value: y, name: s.name })
        }
      }

      if (vbo) vbo.update(vertices)
      else vbo = createVertexBuffer(gl, vertices, gl.DYNAMIC_DRAW)

      pointCount = totalPoints
      mat4Identity(modelMatrix)
    },

    render(ctx: GLRenderContext) {
      const { renderer, camera } = ctx
      const gl = renderer.gl
      const prog = renderer.getProgram('point3d')!

      prog.use()
      prog.setMat4('u_projView', camera.projViewMatrix)
      prog.setMat4('u_model', modelMatrix)
      prog.setFloat('u_pixelRatio', renderer.pixelRatio)
      prog.setFloat('u_sizeAttenuation', 50.0)
      prog.setFloat('u_opacity', ctx.animationProgress)

      if (!vbo || pointCount === 0) return
      vbo.bind()

      const layout = createVertexLayout([
        { location: prog.attributes['a_position']!, size: 3 },
        { location: prog.attributes['a_color']!, size: 3 },
        { location: prog.attributes['a_size']!, size: 1 },
      ])
      applyVertexLayout(gl, layout)
      gl.drawArrays(gl.POINTS, 0, pointCount)
      disableVertexLayout(gl, layout)
    },

    hitTest(ctx: GLRenderContext, x: number, y: number): GLDataPoint | null {
      const { camera, width, height } = ctx
      let closest: GLDataPoint | null = null
      let closestDist = 20

      for (const d of seriesData) {
        const screen = projectToScreen(
          new Float32Array([d.x, d.y, d.z]),
          camera.projViewMatrix, width, height,
        )
        if (!screen || screen.z < -1 || screen.z > 1) continue
        const dx = screen.x - x
        const dy = screen.y - y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < closestDist) {
          closestDist = dist
          closest = { seriesIndex: d.seriesIndex, dataIndex: d.dataIndex, value: d.value, x: d.x, y: d.y, z: d.z, seriesName: d.name }
        }
      }
      return closest
    },

    dispose() {
      vbo?.destroy(); vbo = null
      seriesData = []
    },
  }
}
