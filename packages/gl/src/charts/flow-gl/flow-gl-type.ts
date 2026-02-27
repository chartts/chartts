/**
 * FlowGL — GPU-accelerated particle flow field visualization.
 *
 * Visualizes vector fields (wind, currents, forces) using thousands of
 * animated particles that follow the field direction. Supports:
 * - Velocity-based coloring (slow=cool, fast=hot)
 * - Speed-based particle sizing
 * - Direction-aware particle elongation
 * - Age-based trail fade with glow
 * - Grid-based or procedural vector fields
 * - Arrow overlay showing field direction
 * - Speed legend
 */

import type { GLChartTypePlugin, GLRenderContext, GLDataPoint } from '../../types'
import { hexToRGB } from '../../types'
import { createVertexBuffer, createVertexLayout, applyVertexLayout, disableVertexLayout, type GLBuffer } from '../../engine/buffer'
import { PARTICLE_VERT, PARTICLE_VERT_UNIFORMS, PARTICLE_VERT_ATTRIBUTES } from '../../shaders/particle.vert'
import { PARTICLE_FRAG, PARTICLE_FRAG_UNIFORMS } from '../../shaders/particle.frag'

const MAX_PARTICLES = 20000
// position(2) + velocity(2) + age(1) + speed(1)
const PARTICLE_FLOATS = 6

export interface FlowGLOptions {
  particleCount?: number
  pointSize?: number
  ageSpeed?: number
  /** How much speed affects particle size. 0=uniform, 1=full scaling. Default 0.7 */
  sizeBySpeed?: number
  /** Color at zero speed. Default '#1e3a5f' (deep blue) */
  colorSlow?: string
  /** Color at mid speed. Default '#22d3ee' (cyan) */
  colorMid?: string
  /** Color at max speed. Default '#fbbf24' (amber) */
  colorFast?: string
  /** Show direction arrows overlay. Default true */
  showArrows?: boolean
  /** Show speed legend. Default true */
  showLegend?: boolean
  /** Arrow grid density. Default 12 */
  arrowDensity?: number
  /** Field type for built-in fields. Default 'swirl' */
  fieldType?: 'swirl' | 'wind' | 'vortex' | 'source' | 'turbulence'
}

type FieldFn = (x: number, y: number) => [number, number]

// Built-in field functions
function createFieldFn(type: string, w: number, h: number): FieldFn {
  switch (type) {
    case 'wind':
      return (x, y) => {
        const nx = x / w, ny = y / h
        const base = 2.5 + Math.sin(ny * Math.PI * 2) * 0.8
        const gust = Math.sin(nx * 6 + ny * 3) * 0.5
        const vy = Math.cos(nx * 4) * 0.6 + Math.sin(ny * 5 + nx * 2) * 0.3
        return [base + gust, vy]
      }
    case 'vortex':
      return (x, y) => {
        const cx = w / 2, cy = h / 2
        const dx = x - cx, dy = y - cy
        const dist = Math.sqrt(dx * dx + dy * dy) + 1
        const maxR = Math.min(w, h) * 0.45
        const falloff = Math.max(0, 1 - dist / maxR)
        const strength = falloff * falloff * 4
        // Tangential + slight inward pull
        return [-dy / dist * strength - dx / dist * 0.3 * falloff,
                 dx / dist * strength - dy / dist * 0.3 * falloff]
      }
    case 'source':
      return (x, y) => {
        // Two sources, one sink
        const pts: [number, number, number][] = [
          [w * 0.25, h * 0.35, 1.5],
          [w * 0.75, h * 0.65, 1.5],
          [w * 0.5, h * 0.5, -2.5],
        ]
        let vx = 0, vy = 0
        for (const [px, py, strength] of pts) {
          const dx = x - px, dy = y - py
          const dist = Math.sqrt(dx * dx + dy * dy) + 10
          vx += (dx / dist) * strength * (50 / dist)
          vy += (dy / dist) * strength * (50 / dist)
        }
        return [vx, vy]
      }
    case 'turbulence':
      return (x, y) => {
        const nx = x / w * 6, ny = y / h * 6
        const vx = Math.sin(ny * 2.3 + nx) * 2 + Math.cos(nx * 1.7 - ny * 0.8) * 1.5
          + Math.sin(nx * 3.1 + ny * 2.7) * 0.5
        const vy = Math.cos(nx * 2.1 - ny * 1.3) * 2 + Math.sin(ny * 1.9 + nx * 0.6) * 1.5
          - Math.cos(ny * 2.8 + nx * 1.5) * 0.5
        return [vx, vy]
      }
    case 'swirl':
    default:
      return (x, y) => {
        const nx = x / w - 0.5, ny = y / h - 0.5
        const angle = Math.atan2(ny, nx)
        const dist = Math.sqrt(nx * nx + ny * ny)
        const spiral = dist * 8 + angle * 2
        const strength = Math.max(0, 1 - dist * 2.5) * 3
        return [
          Math.cos(spiral) * strength + Math.sin(ny * 6) * 0.5,
          Math.sin(spiral) * strength + Math.cos(nx * 6) * 0.5,
        ]
      }
  }
}

export function createFlowGLPlugin(): GLChartTypePlugin {
  let vbo: GLBuffer | null = null
  let positions: Float32Array
  let velocities: Float32Array
  let ages: Float32Array
  let speeds: Float32Array
  let particleSpeeds: Float32Array
  let fieldFn: FieldFn = () => [1, 0]
  let particleCount = 0
  let fieldWidth = 0
  let fieldHeight = 0
  let maxSpeed = 1
  // Cache field samples for overlay arrows
  let arrowCache: { x: number; y: number; vx: number; vy: number; speed: number }[] = []
  let opts: FlowGLOptions = {}

  function resetParticle(i: number, w: number, h: number) {
    positions[i * 2] = Math.random() * w
    positions[i * 2 + 1] = Math.random() * h
    ages[i] = Math.random() * 0.2 // start young for stagger
    particleSpeeds[i] = 0.5 + Math.random() * 1.5
    velocities[i * 2] = 0
    velocities[i * 2 + 1] = 0
    speeds[i] = 0
  }

  function sampleArrows(w: number, h: number, density: number) {
    arrowCache = []
    const stepX = w / density, stepY = h / density
    let trackMaxSpeed = 0
    for (let gy = 0; gy < density; gy++) {
      for (let gx = 0; gx < density; gx++) {
        const x = stepX * (gx + 0.5), y = stepY * (gy + 0.5)
        const [vx, vy] = fieldFn(x, y)
        const speed = Math.sqrt(vx * vx + vy * vy)
        if (speed > trackMaxSpeed) trackMaxSpeed = speed
        arrowCache.push({ x, y, vx, vy, speed })
      }
    }
    maxSpeed = Math.max(trackMaxSpeed, 0.01)
  }

  return {
    type: 'flow-gl',

    prepare(ctx: GLRenderContext) {
      const { renderer, data, options, width, height } = ctx
      const gl = renderer.gl

      renderer.registerProgram('particle', PARTICLE_VERT, PARTICLE_FRAG,
        [...PARTICLE_VERT_UNIFORMS, ...PARTICLE_FRAG_UNIFORMS], PARTICLE_VERT_ATTRIBUTES)

      fieldWidth = width; fieldHeight = height
      opts = options as unknown as FlowGLOptions

      // Set up field function: grid data or built-in type
      if (data.grid && data.grid.length > 0) {
        const rows = data.grid.length, cols = data.grid[0]!.length / 2
        fieldFn = (x, y) => {
          const cx = Math.max(0, Math.min(cols - 1, Math.floor((x / width) * (cols - 1))))
          const cy = Math.max(0, Math.min(rows - 1, Math.floor((y / height) * (rows - 1))))
          return [data.grid![cy]![cx * 2] ?? 0, data.grid![cy]![cx * 2 + 1] ?? 0]
        }
      } else {
        const fieldType = opts.fieldType ?? 'swirl'
        fieldFn = createFieldFn(fieldType, width, height)
      }

      particleCount = Math.min(MAX_PARTICLES, opts.particleCount ?? 5000)
      positions = new Float32Array(particleCount * 2)
      velocities = new Float32Array(particleCount * 2)
      ages = new Float32Array(particleCount)
      speeds = new Float32Array(particleCount)
      particleSpeeds = new Float32Array(particleCount)
      for (let i = 0; i < particleCount; i++) resetParticle(i, width, height)

      // Sample field for arrows and max speed
      sampleArrows(width, height, opts.arrowDensity ?? 12)

      const vertData = new Float32Array(particleCount * PARTICLE_FLOATS)
      if (vbo) vbo.update(vertData); else vbo = createVertexBuffer(gl, vertData, gl.DYNAMIC_DRAW)
    },

    render(ctx: GLRenderContext) {
      const { renderer } = ctx
      const gl = renderer.gl
      const prog = renderer.getProgram('particle')!
      const ageSpeed = opts.ageSpeed ?? 0.006

      // Parse speed colors
      const colorSlow = hexToRGB(opts.colorSlow ?? '#1e3a5f')
      const colorMid = hexToRGB(opts.colorMid ?? '#22d3ee')
      const colorFast = hexToRGB(opts.colorFast ?? '#fbbf24')

      // Simulate + build vertex data
      const vertData = new Float32Array(particleCount * PARTICLE_FLOATS)
      let frameMaxSpeed = 0
      for (let i = 0; i < particleCount; i++) {
        const px = positions[i * 2]!, py = positions[i * 2 + 1]!
        const [u, v] = fieldFn(px, py)
        const spd = Math.sqrt(u * u + v * v)
        if (spd > frameMaxSpeed) frameMaxSpeed = spd

        // Smoothly interpolate velocity for less jitter
        velocities[i * 2] = velocities[i * 2]! * 0.7 + u * 0.3
        velocities[i * 2 + 1] = velocities[i * 2 + 1]! * 0.7 + v * 0.3
        speeds[i] = spd

        const vx = velocities[i * 2]!, vy = velocities[i * 2 + 1]!
        positions[i * 2] = px + vx * particleSpeeds[i]!
        positions[i * 2 + 1] = py + vy * particleSpeeds[i]!
        ages[i] = ages[i]! + ageSpeed

        if (ages[i]! > 1 || positions[i * 2]! < 0 || positions[i * 2]! > fieldWidth ||
            positions[i * 2 + 1]! < 0 || positions[i * 2 + 1]! > fieldHeight) {
          resetParticle(i, fieldWidth, fieldHeight)
        }

        const off = i * PARTICLE_FLOATS
        vertData[off] = positions[i * 2]!
        vertData[off + 1] = positions[i * 2 + 1]!
        vertData[off + 2] = vx
        vertData[off + 3] = vy
        vertData[off + 4] = ages[i]!
        vertData[off + 5] = speeds[i]!
      }

      // Track max speed across frames (smooth it)
      maxSpeed = maxSpeed * 0.95 + frameMaxSpeed * 0.05

      if (!vbo) return
      vbo.update(vertData); vbo.bind()
      prog.use()
      prog.setVec2('u_resolution', ctx.width, ctx.height)
      prog.setFloat('u_pointSize', opts.pointSize ?? 4)
      prog.setFloat('u_pixelRatio', renderer.pixelRatio)
      prog.setFloat('u_speedRange', maxSpeed)
      prog.setFloat('u_sizeBySpeed', opts.sizeBySpeed ?? 0.7)
      prog.setVec3('u_colorSlow', colorSlow[0], colorSlow[1], colorSlow[2])
      prog.setVec3('u_colorMid', colorMid[0], colorMid[1], colorMid[2])
      prog.setVec3('u_colorFast', colorFast[0], colorFast[1], colorFast[2])
      prog.setFloat('u_useSpeedColor', 1.0)

      const layout = createVertexLayout([
        { location: prog.attributes['a_position']!, size: 2 },
        { location: prog.attributes['a_velocity']!, size: 2 },
        { location: prog.attributes['a_age']!, size: 1 },
        { location: prog.attributes['a_speed']!, size: 1 },
      ])
      applyVertexLayout(gl, layout)
      gl.disable(gl.DEPTH_TEST)
      gl.drawArrays(gl.POINTS, 0, particleCount)
      gl.enable(gl.DEPTH_TEST)
      disableVertexLayout(gl, layout)
    },

    renderOverlay(ctx: GLRenderContext, ctx2d: CanvasRenderingContext2D) {
      const showArrows = opts.showArrows ?? true
      const showLegend = opts.showLegend ?? true
      const { width, height, theme } = ctx

      // -- Direction arrows --
      if (showArrows && arrowCache.length > 0) {
        ctx2d.save()
        const arrowLen = Math.min(width, height) / (opts.arrowDensity ?? 12) * 0.35
        for (const a of arrowCache) {
          const speed = a.speed
          if (speed < 0.01) continue
          const nx = a.vx / speed, ny = a.vy / speed
          const norm = Math.min(speed / maxSpeed, 1)
          ctx2d.globalAlpha = 0.12 + norm * 0.18
          ctx2d.strokeStyle = theme.textColor
          ctx2d.lineWidth = 1
          ctx2d.beginPath()
          const len = arrowLen * (0.3 + norm * 0.7)
          const ex = a.x + nx * len, ey = a.y + ny * len
          ctx2d.moveTo(a.x - nx * len * 0.3, a.y - ny * len * 0.3)
          ctx2d.lineTo(ex, ey)
          // Arrowhead
          const headLen = len * 0.3
          const hx1 = ex - headLen * (nx * 0.8 + ny * 0.5)
          const hy1 = ey - headLen * (ny * 0.8 - nx * 0.5)
          const hx2 = ex - headLen * (nx * 0.8 - ny * 0.5)
          const hy2 = ey - headLen * (ny * 0.8 + nx * 0.5)
          ctx2d.moveTo(ex, ey)
          ctx2d.lineTo(hx1, hy1)
          ctx2d.moveTo(ex, ey)
          ctx2d.lineTo(hx2, hy2)
          ctx2d.stroke()
        }
        ctx2d.restore()
      }

      // -- Speed legend --
      if (showLegend) {
        ctx2d.save()
        const lx = width - 140, ly = height - 50
        const lw = 120, lh = 10

        // Gradient bar
        const colorSlow = opts.colorSlow ?? '#1e3a5f'
        const colorMid = opts.colorMid ?? '#22d3ee'
        const colorFast = opts.colorFast ?? '#fbbf24'
        const grad = ctx2d.createLinearGradient(lx, 0, lx + lw, 0)
        grad.addColorStop(0, colorSlow)
        grad.addColorStop(0.5, colorMid)
        grad.addColorStop(1, colorFast)

        // Background
        ctx2d.fillStyle = 'rgba(0,0,0,0.4)'
        ctx2d.beginPath()
        ctx2d.roundRect(lx - 10, ly - 20, lw + 20, lh + 36, 6)
        ctx2d.fill()

        ctx2d.fillStyle = grad
        ctx2d.beginPath()
        ctx2d.roundRect(lx, ly, lw, lh, 3)
        ctx2d.fill()

        // Labels
        ctx2d.font = `${theme.fontSize - 2}px ${theme.fontFamily}`
        ctx2d.fillStyle = 'rgba(255,255,255,0.7)'
        ctx2d.textAlign = 'left'
        ctx2d.fillText('Slow', lx, ly + lh + 14)
        ctx2d.textAlign = 'center'
        ctx2d.fillText('Speed', lx + lw / 2, ly - 6)
        ctx2d.textAlign = 'right'
        ctx2d.fillText('Fast', lx + lw, ly + lh + 14)
        ctx2d.restore()
      }
    },

    needsLoop() { return true },
    hitTest(): GLDataPoint | null { return null },

    dispose() { vbo?.destroy(); vbo = null; arrowCache = [] },
  }
}
