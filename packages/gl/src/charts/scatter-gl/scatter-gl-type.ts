/**
 * ScatterGL — GPU-accelerated 2D scatter with axes, grid, legend, and density glow.
 * Uses spatial grid for efficient hitTest on millions of points.
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

/** Compute nice tick values for an axis range */
function niceScale(min: number, max: number, maxTicks: number): number[] {
  const range = max - min || 1
  const rawStep = range / maxTicks
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const norm = rawStep / mag
  const step = norm < 1.5 ? mag : norm < 3 ? 2 * mag : norm < 7 ? 5 * mag : 10 * mag
  const start = Math.ceil(min / step) * step
  const ticks: number[] = []
  for (let v = start; v <= max + step * 0.001; v += step) ticks.push(v)
  return ticks
}

function formatTick(v: number): string {
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + 'M'
  if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(1) + 'K'
  if (Number.isInteger(v)) return String(v)
  return v.toFixed(Math.abs(v) < 1 ? 2 : 1)
}

// Margins for axes
const MARGIN = { top: 20, right: 20, bottom: 40, left: 55 }

export function createScatterGLPlugin(): GLChartTypePlugin {
  let vbo: GLBuffer | null = null
  let pointCount = 0
  let gridCells: Map<number, GridPoint[]> = new Map()
  let dataBounds = { minX: 0, maxX: 1, minY: 0, maxY: 1 }
  let seriesInfo: { name: string; color: string; count: number }[] = []

  return {
    type: 'scatter-gl',

    prepare(ctx: GLRenderContext) {
      const { renderer, data, options, theme, width, height } = ctx
      const gl = renderer.gl
      const series = data.series as GLSeries2D[]

      renderer.registerProgram('flat-point', FLAT_VERT, POINT_FRAG,
        [...FLAT_VERT_UNIFORMS, ...POINT_FRAG_UNIFORMS], FLAT_VERT_ATTRIBUTES)

      // Compute data bounds
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      for (const s of series) for (let i = 0; i < s.x.length; i++) {
        const x = s.x[i]!, y = s.y[i]!
        if (x < minX) minX = x; if (x > maxX) maxX = x
        if (y < minY) minY = y; if (y > maxY) maxY = y
      }
      if (minX === Infinity) { minX = 0; maxX = 100; minY = 0; maxY = 100 }
      // Add 5% padding
      const padX = (maxX - minX) * 0.05 || 0.5
      const padY = (maxY - minY) * 0.05 || 0.5
      minX -= padX; maxX += padX; minY -= padY; maxY += padY
      dataBounds = { minX, maxX, minY, maxY }

      const rangeX = maxX - minX || 1, rangeY = maxY - minY || 1
      const plotLeft = MARGIN.left, plotRight = width - MARGIN.right
      const plotTop = MARGIN.top, plotBottom = height - MARGIN.bottom
      const plotW = plotRight - plotLeft, plotH = plotBottom - plotTop

      let totalPoints = 0
      for (const s of series) totalPoints += s.x.length
      const verts = new Float32Array(totalPoints * 6)
      gridCells = new Map()
      seriesInfo = []

      let vi = 0
      const defaultSize = options.pointSize ?? 4
      for (let si = 0; si < series.length; si++) {
        const s = series[si]!
        const colorHex = s.color ?? theme.colors[si % theme.colors.length]!
        const color = hexToRGB(colorHex)
        const size = s.size ?? defaultSize
        seriesInfo.push({ name: s.name, color: colorHex, count: s.x.length })
        for (let di = 0; di < s.x.length; di++) {
          const sx = plotLeft + ((s.x[di]! - minX) / rangeX) * plotW
          const sy = plotTop + (1 - (s.y[di]! - minY) / rangeY) * plotH
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

      // Additive blending for density glow where points overlap
      gl.disable(gl.DEPTH_TEST)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
      gl.drawArrays(gl.POINTS, 0, pointCount)
      // Restore normal blending
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.enable(gl.DEPTH_TEST)
      disableVertexLayout(gl, layout)
    },

    renderOverlay(ctx: GLRenderContext, ctx2d: CanvasRenderingContext2D) {
      const { width, height, theme } = ctx
      const { minX, maxX, minY, maxY } = dataBounds
      const plotLeft = MARGIN.left, plotRight = width - MARGIN.right
      const plotTop = MARGIN.top, plotBottom = height - MARGIN.bottom
      const plotW = plotRight - plotLeft, plotH = plotBottom - plotTop
      const rangeX = maxX - minX || 1, rangeY = maxY - minY || 1

      ctx2d.save()

      // -- Grid lines --
      const xTicks = niceScale(minX, maxX, 6)
      const yTicks = niceScale(minY, maxY, 5)

      ctx2d.strokeStyle = theme.gridColor
      ctx2d.lineWidth = 1
      ctx2d.globalAlpha = 0.4
      ctx2d.beginPath()
      for (const v of xTicks) {
        const sx = plotLeft + ((v - minX) / rangeX) * plotW
        ctx2d.moveTo(sx, plotTop)
        ctx2d.lineTo(sx, plotBottom)
      }
      for (const v of yTicks) {
        const sy = plotTop + (1 - (v - minY) / rangeY) * plotH
        ctx2d.moveTo(plotLeft, sy)
        ctx2d.lineTo(plotRight, sy)
      }
      ctx2d.stroke()
      ctx2d.globalAlpha = 1

      // -- Axes lines --
      ctx2d.strokeStyle = theme.textColor
      ctx2d.globalAlpha = 0.5
      ctx2d.lineWidth = 1
      ctx2d.beginPath()
      ctx2d.moveTo(plotLeft, plotTop)
      ctx2d.lineTo(plotLeft, plotBottom)
      ctx2d.lineTo(plotRight, plotBottom)
      ctx2d.stroke()
      ctx2d.globalAlpha = 1

      // -- Tick labels --
      ctx2d.font = `${theme.fontSize - 1}px ${theme.fontFamily}`
      ctx2d.fillStyle = theme.textColor
      ctx2d.globalAlpha = 0.7

      // X axis ticks
      ctx2d.textAlign = 'center'
      ctx2d.textBaseline = 'top'
      for (const v of xTicks) {
        const sx = plotLeft + ((v - minX) / rangeX) * plotW
        ctx2d.fillText(formatTick(v), sx, plotBottom + 6)
      }

      // Y axis ticks
      ctx2d.textAlign = 'right'
      ctx2d.textBaseline = 'middle'
      for (const v of yTicks) {
        const sy = plotTop + (1 - (v - minY) / rangeY) * plotH
        ctx2d.fillText(formatTick(v), plotLeft - 8, sy)
      }
      ctx2d.globalAlpha = 1

      // -- Legend --
      if (seriesInfo.length > 1) {
        const legendX = plotRight - 10
        let legendY = plotTop + 8
        ctx2d.textAlign = 'right'
        ctx2d.textBaseline = 'top'
        ctx2d.font = `${theme.fontSize - 1}px ${theme.fontFamily}`

        for (const s of seriesInfo) {
          // Color dot
          ctx2d.fillStyle = s.color
          ctx2d.globalAlpha = 0.9
          ctx2d.beginPath()
          ctx2d.arc(legendX - ctx2d.measureText(s.name).width - 10, legendY + 6, 4, 0, Math.PI * 2)
          ctx2d.fill()
          // Label
          ctx2d.fillStyle = theme.textColor
          ctx2d.globalAlpha = 0.8
          ctx2d.fillText(s.name, legendX, legendY)
          legendY += 18
        }
      }

      // -- Point count badge --
      ctx2d.textAlign = 'left'
      ctx2d.textBaseline = 'top'
      ctx2d.font = `${theme.fontSize - 2}px ${theme.fontFamily}`
      ctx2d.fillStyle = theme.textColor
      ctx2d.globalAlpha = 0.4
      const totalPts = seriesInfo.reduce((sum, s) => sum + s.count, 0)
      const label = totalPts >= 1000 ? `${(totalPts / 1000).toFixed(totalPts >= 10000 ? 0 : 1)}K points` : `${totalPts} points`
      ctx2d.fillText(label, plotLeft + 4, plotTop + 4)

      ctx2d.restore()
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
