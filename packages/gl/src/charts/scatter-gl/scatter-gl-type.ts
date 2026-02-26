/**
 * ScatterGL — 2D scatter, millions of SDF points via GL_POINTS.
 * Uses spatial grid for efficient hitTest.
 */

import type { GLChartTypePlugin, GLRenderContext, GLDataPoint, GLSeries2D } from '../../types'
import { hexToRGB } from '../../types'
import { createVertexBuffer, createVertexLayout, applyVertexLayout, disableVertexLayout, type GLBuffer } from '../../engine/buffer'
import { FLAT_VERT, FLAT_VERT_UNIFORMS, FLAT_VERT_ATTRIBUTES } from '../../shaders/flat.vert'
import { POINT_FRAG, POINT_FRAG_UNIFORMS } from '../../shaders/point.frag'

const GRID_SIZE = 64

interface GridPoint { si: number; di: number; sx: number; sy: number; value: number; name: string }

function toGridKey(gx: number, gy: number): number { return gy * GRID_SIZE + gx }
function screenToGrid(sx: number, sy: number, w: number, h: number): [number, number] {
  return [Math.floor((sx / w) * GRID_SIZE) | 0, Math.floor((sy / h) * GRID_SIZE) | 0]
}

export function createScatterGLPlugin(): GLChartTypePlugin {
  let vbo: GLBuffer | null = null
  let pointCount = 0
  let gridCells: Map<number, GridPoint[]> = new Map()

  return {
    type: 'scatter-gl',

    prepare(ctx: GLRenderContext) {
      const { renderer, data, options, theme, width, height } = ctx
      const gl = renderer.gl
      const series = data.series as GLSeries2D[]

      renderer.registerProgram('flat-point', FLAT_VERT, POINT_FRAG,
        [...FLAT_VERT_UNIFORMS, ...POINT_FRAG_UNIFORMS], FLAT_VERT_ATTRIBUTES)

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      for (const s of series) for (let i = 0; i < s.x.length; i++) {
        const x = s.x[i]!, y = s.y[i]!
        if (x < minX) minX = x; if (x > maxX) maxX = x
        if (y < minY) minY = y; if (y > maxY) maxY = y
      }
      const rangeX = maxX - minX || 1, rangeY = maxY - minY || 1
      const margin = 40

      let totalPoints = 0
      for (const s of series) totalPoints += s.x.length
      const verts = new Float32Array(totalPoints * 6)
      gridCells = new Map()

      let vi = 0
      const defaultSize = options.pointSize ?? 4
      for (let si = 0; si < series.length; si++) {
        const s = series[si]!
        const color = hexToRGB(s.color ?? theme.colors[si % theme.colors.length]!)
        const size = s.size ?? defaultSize
        for (let di = 0; di < s.x.length; di++) {
          const sx = margin + ((s.x[di]! - minX) / rangeX) * (width - margin * 2)
          const sy = margin + (1 - (s.y[di]! - minY) / rangeY) * (height - margin * 2)
          verts[vi++] = sx; verts[vi++] = sy
          verts[vi++] = color[0]; verts[vi++] = color[1]; verts[vi++] = color[2]
          verts[vi++] = size
          const [gx, gy] = screenToGrid(sx, sy, width, height)
          if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
            const key = toGridKey(gx, gy)
            let cell = gridCells.get(key)
            if (!cell) { cell = []; gridCells.set(key, cell) }
            cell.push({ si, di, sx, sy, value: s.y[di]!, name: s.name })
          }
        }
      }

      if (vbo) vbo.update(verts); else vbo = createVertexBuffer(gl, verts, gl.DYNAMIC_DRAW)
      pointCount = totalPoints
    },

    render(ctx: GLRenderContext) {
      const { renderer } = ctx
      const gl = renderer.gl
      const prog = renderer.getProgram('flat-point')!
      prog.use()
      prog.setVec2('u_resolution', ctx.width, ctx.height)
      prog.setFloat('u_pixelRatio', renderer.pixelRatio)
      prog.setFloat('u_opacity', ctx.animationProgress)

      if (!vbo || pointCount === 0) return
      vbo.bind()
      const layout = createVertexLayout([
        { location: prog.attributes['a_position']!, size: 2 },
        { location: prog.attributes['a_color']!, size: 3 },
        { location: prog.attributes['a_size']!, size: 1 },
      ])
      applyVertexLayout(gl, layout)
      gl.disable(gl.DEPTH_TEST)
      gl.drawArrays(gl.POINTS, 0, pointCount)
      gl.enable(gl.DEPTH_TEST)
      disableVertexLayout(gl, layout)
    },

    hitTest(ctx: GLRenderContext, x: number, y: number): GLDataPoint | null {
      const { width, height } = ctx
      const [gx, gy] = screenToGrid(x, y, width, height)
      let closest: GLDataPoint | null = null
      let closestDist = 10
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const cx = gx + dx, cy = gy + dy
        if (cx < 0 || cx >= GRID_SIZE || cy < 0 || cy >= GRID_SIZE) continue
        const cell = gridCells.get(toGridKey(cx, cy))
        if (!cell) continue
        for (const p of cell) {
          const d = Math.sqrt((p.sx - x) ** 2 + (p.sy - y) ** 2)
          if (d < closestDist) { closestDist = d; closest = { seriesIndex: p.si, dataIndex: p.di, value: p.value, x: p.sx, y: p.sy, seriesName: p.name } }
        }
      }
      return closest
    },

    dispose() { vbo?.destroy(); vbo = null; gridCells.clear() },
  }
}
