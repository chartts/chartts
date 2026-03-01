/**
 * LinesGL — 2D thick line triangles for per-series polylines.
 */

import type { GLChartTypePlugin, GLRenderContext, GLDataPoint, GLSeries2D } from '../../types'
import { hexToRGB } from '../../types'
import { createVertexBuffer, createIndexBuffer, createVertexLayout, applyVertexLayout, disableVertexLayout, type GLBuffer } from '../../engine/buffer'

const FLAT_LINE_VERT = `precision highp float; attribute vec2 a_position; attribute vec2 a_next; attribute vec3 a_color; attribute float a_side; uniform vec2 u_resolution; uniform float u_lineWidth; varying vec3 v_color; void main() { vec2 dir = a_next - a_position; float len = length(dir); dir = len > 0.001 ? dir / len : vec2(1.0, 0.0); vec2 normal = vec2(-dir.y, dir.x); vec2 pos = a_position + normal * u_lineWidth * 0.5 * a_side; vec2 c = (pos / u_resolution) * 2.0 - 1.0; c.y = -c.y; gl_Position = vec4(c, 0.0, 1.0); v_color = a_color; }`
const FLAT_LINE_FRAG = `precision highp float; uniform float u_opacity; varying vec3 v_color; void main() { gl_FragColor = vec4(v_color, u_opacity); }`

interface LPoint { si: number; di: number; sx: number; sy: number; value: number; name: string }

export function createLinesGLPlugin(): GLChartTypePlugin {
  let vbo: GLBuffer | null = null
  let ibo: GLBuffer | null = null
  let indexCount = 0
  let indexType: number = 0
  let linePoints: LPoint[] = []

  return {
    type: 'lines-gl',

    prepare(ctx: GLRenderContext) {
      const { renderer, data, theme, width, height } = ctx
      const gl = renderer.gl
      const series = data.series as GLSeries2D[]

      renderer.registerProgram('flat-line', FLAT_LINE_VERT, FLAT_LINE_FRAG,
        ['u_resolution', 'u_lineWidth', 'u_opacity'], ['a_position', 'a_next', 'a_color', 'a_side'])

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      for (const s of series) for (let i = 0; i < s.x.length; i++) {
        const x = s.x[i]!, y = s.y[i]!
        if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y
      }
      const rangeX = maxX - minX || 1, rangeY = maxY - minY || 1, margin = 40
      const toScreen = (dx: number, dy: number): [number, number] => [
        margin + ((dx - minX) / rangeX) * (width - margin * 2),
        margin + (1 - (dy - minY) / rangeY) * (height - margin * 2),
      ]

      const verts: number[] = [], indices: number[] = []
      linePoints = []
      let baseVertex = 0

      for (let si = 0; si < series.length; si++) {
        const s = series[si]!
        const color = hexToRGB(s.color ?? theme.colors[si % theme.colors.length]!)
        for (let di = 0; di < s.x.length; di++) {
          const [sx, sy] = toScreen(s.x[di]!, s.y[di]!)
          linePoints.push({ si, di, sx, sy, value: s.y[di]!, name: s.name })
        }
        for (let di = 0; di < s.x.length - 1; di++) {
          const [sx0, sy0] = toScreen(s.x[di]!, s.y[di]!)
          const [sx1, sy1] = toScreen(s.x[di + 1]!, s.y[di + 1]!)
          for (const side of [-1, 1]) verts.push(sx0, sy0, sx1, sy1, color[0], color[1], color[2], side)
          for (const side of [-1, 1]) verts.push(sx1, sy1, sx1, sy1, color[0], color[1], color[2], side)
          indices.push(baseVertex, baseVertex + 2, baseVertex + 1, baseVertex + 1, baseVertex + 2, baseVertex + 3)
          baseVertex += 4
        }
      }

      const vertArr = new Float32Array(verts)
      const use32 = baseVertex > 65535
      const idxArr = use32 ? new Uint32Array(indices) : new Uint16Array(indices)
      if (vbo) vbo.update(vertArr); else vbo = createVertexBuffer(gl, vertArr, gl.DYNAMIC_DRAW)
      if (ibo) ibo.update(idxArr); else ibo = createIndexBuffer(gl, idxArr, gl.DYNAMIC_DRAW)
      indexCount = indices.length
      indexType = use32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT
    },

    render(ctx: GLRenderContext) {
      const { renderer } = ctx
      const gl = renderer.gl
      const prog = renderer.getProgram('flat-line')!
      prog.use()
      prog.setVec2('u_resolution', ctx.width, ctx.height)
      prog.setFloat('u_lineWidth', ctx.options.lineWidth ?? 2)
      prog.setFloat('u_opacity', ctx.animationProgress)

      if (!vbo || !ibo || indexCount === 0) return
      vbo.bind()
      const layout = createVertexLayout([
        { location: prog.attributes['a_position']!, size: 2 },
        { location: prog.attributes['a_next']!, size: 2 },
        { location: prog.attributes['a_color']!, size: 3 },
        { location: prog.attributes['a_side']!, size: 1 },
      ])
      applyVertexLayout(gl, layout)
      gl.disable(gl.DEPTH_TEST)
      gl.disable(gl.CULL_FACE)
      ibo.bind()
      gl.drawElements(gl.TRIANGLES, indexCount, indexType, 0)
      gl.enable(gl.CULL_FACE)
      gl.enable(gl.DEPTH_TEST)
      disableVertexLayout(gl, layout)
    },

    hitTest(_ctx: GLRenderContext, x: number, y: number): GLDataPoint | null {
      let closest: GLDataPoint | null = null
      let closestDist = 10
      for (const p of linePoints) {
        const d = Math.sqrt((p.sx - x) ** 2 + (p.sy - y) ** 2)
        if (d < closestDist) { closestDist = d; closest = { seriesIndex: p.si, dataIndex: p.di, value: p.value, x: p.sx, y: p.sy, seriesName: p.name } }
      }
      return closest
    },

    dispose() { vbo?.destroy(); vbo = null; ibo?.destroy(); ibo = null; linePoints = [] },
  }
}
