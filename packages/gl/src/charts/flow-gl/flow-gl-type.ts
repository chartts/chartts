/**
 * FlowGL — particle flow field simulation + rendering.
 */

import type { GLChartTypePlugin, GLRenderContext, GLDataPoint } from '../../types'
import { hexToRGB } from '../../types'
import { createVertexBuffer, createVertexLayout, applyVertexLayout, disableVertexLayout, type GLBuffer } from '../../engine/buffer'
import { PARTICLE_VERT, PARTICLE_VERT_UNIFORMS, PARTICLE_VERT_ATTRIBUTES } from '../../shaders/particle.vert'
import { PARTICLE_FRAG, PARTICLE_FRAG_UNIFORMS } from '../../shaders/particle.frag'

const MAX_PARTICLES = 10000
const PARTICLE_FLOATS = 6

export function createFlowGLPlugin(): GLChartTypePlugin {
  let vbo: GLBuffer | null = null
  let positions: Float32Array
  let ages: Float32Array
  let speeds: Float32Array
  let fieldFn: (x: number, y: number) => [number, number] = () => [1, 0]
  let particleCount = 0
  let fieldWidth = 0
  let fieldHeight = 0

  function resetParticle(i: number, w: number, h: number) {
    positions[i * 2] = Math.random() * w
    positions[i * 2 + 1] = Math.random() * h
    ages[i] = Math.random()
    speeds[i] = 0.5 + Math.random() * 1.5
  }

  return {
    type: 'flow-gl',

    prepare(ctx: GLRenderContext) {
      const { renderer, data, options, width, height } = ctx
      const gl = renderer.gl

      renderer.registerProgram('particle', PARTICLE_VERT, PARTICLE_FRAG,
        [...PARTICLE_VERT_UNIFORMS, ...PARTICLE_FRAG_UNIFORMS], PARTICLE_VERT_ATTRIBUTES)

      fieldWidth = width; fieldHeight = height

      if (data.grid && data.grid.length > 0) {
        const rows = data.grid.length, cols = data.grid[0]!.length / 2
        fieldFn = (x, y) => {
          const cx = Math.max(0, Math.min(cols - 1, Math.floor((x / width) * (cols - 1))))
          const cy = Math.max(0, Math.min(rows - 1, Math.floor((y / height) * (rows - 1))))
          return [data.grid![cy]![cx * 2] ?? 0, data.grid![cy]![cx * 2 + 1] ?? 0]
        }
      } else {
        fieldFn = (x, y) => {
          const nx = x / width - 0.5, ny = y / height - 0.5
          return [Math.sin(ny * 8) * 2 + Math.cos(nx * 4), Math.cos(nx * 8) * 2 - Math.sin(ny * 4)]
        }
      }

      particleCount = Math.min(MAX_PARTICLES, (options['particleCount'] as number | undefined) ?? 5000)
      positions = new Float32Array(particleCount * 2)
      ages = new Float32Array(particleCount)
      speeds = new Float32Array(particleCount)
      for (let i = 0; i < particleCount; i++) resetParticle(i, width, height)

      const vertData = new Float32Array(particleCount * PARTICLE_FLOATS)
      if (vbo) vbo.update(vertData); else vbo = createVertexBuffer(gl, vertData, gl.DYNAMIC_DRAW)
    },

    render(ctx: GLRenderContext) {
      const { renderer, theme } = ctx
      const gl = renderer.gl
      const prog = renderer.getProgram('particle')!
      const ageSpeed = (ctx.options['ageSpeed'] as number | undefined) ?? 0.005
      const color = hexToRGB(theme.colors[0]!)

      const vertData = new Float32Array(particleCount * PARTICLE_FLOATS)
      for (let i = 0; i < particleCount; i++) {
        const px = positions[i * 2]!, py = positions[i * 2 + 1]!
        const [u, v] = fieldFn(px, py)
        positions[i * 2] = px + u * speeds[i]!
        positions[i * 2 + 1] = py + v * speeds[i]!
        ages[i] = ages[i]! + ageSpeed

        if (ages[i]! > 1 || positions[i * 2]! < 0 || positions[i * 2]! > fieldWidth ||
            positions[i * 2 + 1]! < 0 || positions[i * 2 + 1]! > fieldHeight) {
          resetParticle(i, fieldWidth, fieldHeight)
        }

        const off = i * PARTICLE_FLOATS
        vertData[off] = positions[i * 2]!
        vertData[off + 1] = positions[i * 2 + 1]!
        vertData[off + 2] = ages[i]!
        vertData[off + 3] = color[0]
        vertData[off + 4] = color[1]
        vertData[off + 5] = color[2]
      }

      if (!vbo) return
      vbo.update(vertData); vbo.bind()
      prog.use()
      prog.setVec2('u_resolution', ctx.width, ctx.height)
      prog.setFloat('u_pointSize', ctx.options.pointSize ?? 3)
      prog.setFloat('u_pixelRatio', renderer.pixelRatio)

      const layout = createVertexLayout([
        { location: prog.attributes['a_position']!, size: 2 },
        { location: prog.attributes['a_age']!, size: 1 },
        { location: prog.attributes['a_color']!, size: 3 },
      ])
      applyVertexLayout(gl, layout)
      gl.disable(gl.DEPTH_TEST)
      gl.drawArrays(gl.POINTS, 0, particleCount)
      gl.enable(gl.DEPTH_TEST)
      disableVertexLayout(gl, layout)
    },

    needsLoop() { return true },
    hitTest(): GLDataPoint | null { return null },

    dispose() { vbo?.destroy(); vbo = null },
  }
}
