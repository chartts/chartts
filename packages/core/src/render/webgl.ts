/**
 * WebGL Renderer.
 *
 * GPU-accelerated rendering for 100k–1M+ data points.
 * Uses a dual-layer approach:
 *   - WebGL canvas: lines, points, bars (data-heavy elements)
 *   - 2D canvas overlay: axes, text, grid, legends (needs Canvas2D text API)
 *
 * Falls back to the Canvas 2D renderer if WebGL is not available.
 */

import type { Renderer, RenderNode, RenderAttrs, RendererRoot, ThemeConfig } from '../types'

// ---------------------------------------------------------------------------
// Shader sources
// ---------------------------------------------------------------------------

const LINE_VERT = `
attribute vec2 a_position;
attribute vec4 a_color;
uniform vec2 u_resolution;
varying vec4 v_color;
void main() {
  vec2 clip = (a_position / u_resolution) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  v_color = a_color;
}
`

const LINE_FRAG = `
precision mediump float;
varying vec4 v_color;
void main() {
  gl_FragColor = v_color;
}
`

const POINT_VERT = `
attribute vec2 a_position;
attribute float a_radius;
attribute vec4 a_color;
uniform vec2 u_resolution;
varying vec4 v_color;
void main() {
  vec2 clip = (a_position / u_resolution) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = a_radius * 2.0;
  v_color = a_color;
}
`

const POINT_FRAG = `
precision mediump float;
varying vec4 v_color;
void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;
  float alpha = 1.0 - smoothstep(0.4, 0.5, dist);
  gl_FragColor = vec4(v_color.rgb, v_color.a * alpha);
}
`

const RECT_VERT = `
attribute vec2 a_position;
attribute vec4 a_color;
uniform vec2 u_resolution;
varying vec4 v_color;
void main() {
  vec2 clip = (a_position / u_resolution) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  v_color = a_color;
}
`

const RECT_FRAG = `
precision mediump float;
varying vec4 v_color;
void main() {
  gl_FragColor = v_color;
}
`

// ---------------------------------------------------------------------------
// Color utilities
// ---------------------------------------------------------------------------

function resolveColor(value: string | undefined, fallback = '#000'): string {
  if (!value) return fallback
  if (value === 'none' || value === 'transparent') return 'transparent'
  if (value.startsWith('url(')) return fallback
  const match = value.match(/var\([^,]+,\s*([^)]+)\)/)
  return match ? match[1]!.trim() : value
}

function hexToRGBA(hex: string, alpha = 1): [number, number, number, number] {
  const h = hex.replace('#', '')
  const full = h.length === 3
    ? h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]!
    : h
  return [
    parseInt(full.substring(0, 2), 16) / 255,
    parseInt(full.substring(2, 4), 16) / 255,
    parseInt(full.substring(4, 6), 16) / 255,
    alpha,
  ]
}

function colorToRGBA(color: string, alpha = 1): [number, number, number, number] {
  const resolved = resolveColor(color)
  if (resolved === 'transparent') return [0, 0, 0, 0]
  if (resolved.startsWith('#')) return hexToRGBA(resolved, alpha)
  // rgba() parse
  const rgbaMatch = resolved.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/)
  if (rgbaMatch) {
    return [
      parseInt(rgbaMatch[1]!) / 255,
      parseInt(rgbaMatch[2]!) / 255,
      parseInt(rgbaMatch[3]!) / 255,
      rgbaMatch[4] ? parseFloat(rgbaMatch[4]) * alpha : alpha,
    ]
  }
  return [0, 0, 0, alpha]
}

// ---------------------------------------------------------------------------
// WebGL helpers
// ---------------------------------------------------------------------------

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function createProgram(gl: WebGLRenderingContext, vertSrc: string, fragSrc: string): WebGLProgram | null {
  const vert = createShader(gl, gl.VERTEX_SHADER, vertSrc)
  const frag = createShader(gl, gl.FRAGMENT_SHADER, fragSrc)
  if (!vert || !frag) return null

  const program = gl.createProgram()
  if (!program) return null
  gl.attachShader(program, vert)
  gl.attachShader(program, frag)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    return null
  }
  return program
}

// ---------------------------------------------------------------------------
// WebGL Renderer Root
// ---------------------------------------------------------------------------

interface WebGLRendererRoot {
  container: HTMLDivElement
  glCanvas: HTMLCanvasElement
  gl: WebGLRenderingContext
  overlay: HTMLCanvasElement
  ctx2d: CanvasRenderingContext2D
  width: number
  height: number
  dpr: number
  programs: {
    line: WebGLProgram
    point: WebGLProgram
    rect: WebGLProgram
  }
}

// ---------------------------------------------------------------------------
// Text alignment helpers (reused from canvas.ts)
// ---------------------------------------------------------------------------

function mapTextAlign(anchor?: string): CanvasTextAlign {
  switch (anchor) {
    case 'middle': return 'center'
    case 'end': return 'right'
    default: return 'left'
  }
}

function mapTextBaseline(baseline?: string): CanvasTextBaseline {
  switch (baseline) {
    case 'middle':
    case 'central': return 'middle'
    case 'hanging': return 'hanging'
    default: return 'alphabetic'
  }
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

export function createWebGLRenderer(theme: ThemeConfig): Renderer {
  return {
    createRoot(target, width, height, attrs) {
      // Container div holds both canvases
      const container = document.createElement('div')
      container.style.cssText = `position:relative;width:${width}px;height:${height}px;`
      if (attrs?.class) container.className = attrs.class
      if (attrs?.role) container.setAttribute('role', attrs.role)
      if (attrs?.ariaLabel) container.setAttribute('aria-label', attrs.ariaLabel)

      const dpr = window.devicePixelRatio || 1

      // WebGL canvas (bottom layer — data rendering)
      const glCanvas = document.createElement('canvas')
      glCanvas.width = width * dpr
      glCanvas.height = height * dpr
      glCanvas.style.cssText = `position:absolute;top:0;left:0;width:${width}px;height:${height}px;`
      container.appendChild(glCanvas)

      const gl = glCanvas.getContext('webgl', {
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
      })!

      // 2D overlay canvas (top layer — text, axes, legends)
      const overlay = document.createElement('canvas')
      overlay.width = width * dpr
      overlay.height = height * dpr
      overlay.style.cssText = `position:absolute;top:0;left:0;width:${width}px;height:${height}px;`
      container.appendChild(overlay)

      const ctx2d = overlay.getContext('2d')!
      ctx2d.scale(dpr, dpr)

      // Compile shader programs
      const lineProgram = createProgram(gl, LINE_VERT, LINE_FRAG)!
      const pointProgram = createProgram(gl, POINT_VERT, POINT_FRAG)!
      const rectProgram = createProgram(gl, RECT_VERT, RECT_FRAG)!

      // WebGL setup
      gl.viewport(0, 0, width * dpr, height * dpr)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

      target.appendChild(container)

      const root: WebGLRendererRoot = {
        container,
        glCanvas,
        gl,
        overlay,
        ctx2d,
        width,
        height,
        dpr,
        programs: {
          line: lineProgram,
          point: pointProgram,
          rect: rectProgram,
        },
      }

      return { element: container } as unknown as RendererRoot & { _webgl: WebGLRendererRoot }
    },

    render(root, nodes) {
      const wr = getWebGLRoot(root)
      if (!wr) return

      // Clear both canvases
      const { gl, ctx2d, width, height, dpr } = wr
      gl.viewport(0, 0, width * dpr, height * dpr)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)

      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx2d.clearRect(0, 0, width, height)

      // Collect draw commands from the node tree
      const lines: GLLine[] = []
      const points: GLPoint[] = []
      const rects: GLRect[] = []

      collectGLNodes(nodes, lines, points, rects)

      // Batch draw with WebGL
      drawGLLines(wr, lines)
      drawGLPoints(wr, points)
      drawGLRects(wr, rects)

      // Draw text/axes/grid with 2D canvas
      draw2DNodes(ctx2d, nodes, width, height, theme)
    },

    update(root, nodes) {
      this.render(root, nodes)
    },

    clear(root) {
      const wr = getWebGLRoot(root)
      if (!wr) return
      wr.gl.clear(wr.gl.COLOR_BUFFER_BIT)
      wr.ctx2d.clearRect(0, 0, wr.width, wr.height)
    },

    destroy(root) {
      const el = root.element as HTMLElement
      el.remove()
    },
  }
}

// ---------------------------------------------------------------------------
// Internal types for batched GL draw commands
// ---------------------------------------------------------------------------

interface GLLine {
  x1: number; y1: number; x2: number; y2: number
  color: [number, number, number, number]
  width: number
}

interface GLPoint {
  x: number; y: number
  radius: number
  color: [number, number, number, number]
}

interface GLRect {
  x: number; y: number; w: number; h: number
  color: [number, number, number, number]
}

// ---------------------------------------------------------------------------
// Extract WebGLRendererRoot from RendererRoot
// ---------------------------------------------------------------------------

function getWebGLRoot(root: RendererRoot): WebGLRendererRoot | null {
  // We store the WebGL root data on the container's dataset
  const container = root.element as HTMLDivElement
  const glCanvas = container.querySelector('canvas:first-child') as HTMLCanvasElement | null
  const overlay = container.querySelector('canvas:last-child') as HTMLCanvasElement | null
  if (!glCanvas || !overlay) return null

  const gl = glCanvas.getContext('webgl')
  const ctx2d = overlay.getContext('2d')
  if (!gl || !ctx2d) return null

  const dpr = window.devicePixelRatio || 1
  const width = parseInt(container.style.width) || 400
  const height = parseInt(container.style.height) || 300

  // Re-compile programs (cached in WebGL context)
  const lineProgram = createProgram(gl, LINE_VERT, LINE_FRAG)!
  const pointProgram = createProgram(gl, POINT_VERT, POINT_FRAG)!
  const rectProgram = createProgram(gl, RECT_VERT, RECT_FRAG)!

  return {
    container,
    glCanvas,
    gl,
    overlay,
    ctx2d,
    width,
    height,
    dpr,
    programs: {
      line: lineProgram,
      point: pointProgram,
      rect: rectProgram,
    },
  }
}

// ---------------------------------------------------------------------------
// Collect GL-renderable nodes from the render tree
// ---------------------------------------------------------------------------

function collectGLNodes(
  nodes: RenderNode[],
  lines: GLLine[],
  points: GLPoint[],
  rects: GLRect[],
  parentAttrs?: RenderAttrs,
): void {
  for (const node of nodes) {
    switch (node.type) {
      case 'group':
        collectGLNodes(node.children, lines, points, rects, node.attrs)
        break

      case 'line': {
        const stroke = resolveColor(node.attrs?.stroke, '#000')
        if (stroke === 'transparent' || stroke === 'none') break
        const opacity = node.attrs?.opacity ?? 1
        lines.push({
          x1: node.x1, y1: node.y1,
          x2: node.x2, y2: node.y2,
          color: colorToRGBA(stroke, opacity),
          width: node.attrs?.strokeWidth ?? 1,
        })
        break
      }

      case 'circle': {
        const fill = resolveColor(node.attrs?.fill)
        if (fill === 'transparent' || fill === 'none') break
        const opacity = (node.attrs?.opacity ?? 1) * (node.attrs?.fillOpacity ?? 1)
        points.push({
          x: node.cx, y: node.cy,
          radius: node.r,
          color: colorToRGBA(fill, opacity),
        })
        break
      }

      case 'rect': {
        const fill = resolveColor(node.attrs?.fill)
        if (fill === 'transparent' || fill === 'none') break
        const opacity = (node.attrs?.opacity ?? 1) * (node.attrs?.fillOpacity ?? 1)
        rects.push({
          x: node.x, y: node.y,
          w: node.width, h: node.height,
          color: colorToRGBA(fill, opacity),
        })
        break
      }

      case 'path': {
        // Paths with stroke → approximate as line segments for WebGL
        // Complex paths fall through to 2D overlay
        const stroke = resolveColor(node.attrs?.stroke)
        if (stroke && stroke !== 'transparent' && stroke !== 'none') {
          const segs = pathToSegments(node.d)
          const opacity = node.attrs?.opacity ?? 1
          const color = colorToRGBA(stroke, opacity)
          const width = node.attrs?.strokeWidth ?? 2
          for (const seg of segs) {
            lines.push({ ...seg, color, width })
          }
        }
        // Filled paths → handled by 2D overlay for accuracy
        break
      }

      // text, defs, clipPath → handled by 2D overlay
      default:
        break
    }
  }
}

// ---------------------------------------------------------------------------
// Parse SVG path d-string into line segments (for GL rendering)
// ---------------------------------------------------------------------------

function pathToSegments(d: string): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  const segments: Array<{ x1: number; y1: number; x2: number; y2: number }> = []
  const commands = d.match(/[MLHVCSQTAZmlhvcsqtaz][^MLHVCSQTAZmlhvcsqtaz]*/g)
  if (!commands) return segments

  let cx = 0, cy = 0
  let startX = 0, startY = 0

  for (const cmd of commands) {
    const type = cmd[0]!
    const nums = (cmd.slice(1).match(/-?[\d.]+(?:e[+-]?\d+)?/gi) ?? []).map(Number)

    switch (type) {
      case 'M':
        cx = nums[0] ?? 0
        cy = nums[1] ?? 0
        startX = cx
        startY = cy
        // M can have implicit L commands after first pair
        for (let i = 2; i < nums.length; i += 2) {
          const nx = nums[i] ?? 0
          const ny = nums[i + 1] ?? 0
          segments.push({ x1: cx, y1: cy, x2: nx, y2: ny })
          cx = nx; cy = ny
        }
        break

      case 'm':
        cx += nums[0] ?? 0
        cy += nums[1] ?? 0
        startX = cx
        startY = cy
        for (let i = 2; i < nums.length; i += 2) {
          const nx = cx + (nums[i] ?? 0)
          const ny = cy + (nums[i + 1] ?? 0)
          segments.push({ x1: cx, y1: cy, x2: nx, y2: ny })
          cx = nx; cy = ny
        }
        break

      case 'L':
        for (let i = 0; i < nums.length; i += 2) {
          const nx = nums[i] ?? 0
          const ny = nums[i + 1] ?? 0
          segments.push({ x1: cx, y1: cy, x2: nx, y2: ny })
          cx = nx; cy = ny
        }
        break

      case 'l':
        for (let i = 0; i < nums.length; i += 2) {
          const nx = cx + (nums[i] ?? 0)
          const ny = cy + (nums[i + 1] ?? 0)
          segments.push({ x1: cx, y1: cy, x2: nx, y2: ny })
          cx = nx; cy = ny
        }
        break

      case 'H':
        for (const n of nums) {
          segments.push({ x1: cx, y1: cy, x2: n, y2: cy })
          cx = n
        }
        break

      case 'h':
        for (const n of nums) {
          const nx = cx + n
          segments.push({ x1: cx, y1: cy, x2: nx, y2: cy })
          cx = nx
        }
        break

      case 'V':
        for (const n of nums) {
          segments.push({ x1: cx, y1: cy, x2: cx, y2: n })
          cy = n
        }
        break

      case 'v':
        for (const n of nums) {
          const ny = cy + n
          segments.push({ x1: cx, y1: cy, x2: cx, y2: ny })
          cy = ny
        }
        break

      case 'C': {
        // Cubic bezier — approximate with line segments
        for (let i = 0; i < nums.length; i += 6) {
          const cp1x = nums[i]!, cp1y = nums[i + 1]!
          const cp2x = nums[i + 2]!, cp2y = nums[i + 3]!
          const ex = nums[i + 4]!, ey = nums[i + 5]!
          approximateCubic(segments, cx, cy, cp1x, cp1y, cp2x, cp2y, ex, ey)
          cx = ex; cy = ey
        }
        break
      }

      case 'c': {
        for (let i = 0; i < nums.length; i += 6) {
          const cp1x = cx + nums[i]!, cp1y = cy + nums[i + 1]!
          const cp2x = cx + nums[i + 2]!, cp2y = cy + nums[i + 3]!
          const ex = cx + nums[i + 4]!, ey = cy + nums[i + 5]!
          approximateCubic(segments, cx, cy, cp1x, cp1y, cp2x, cp2y, ex, ey)
          cx = ex; cy = ey
        }
        break
      }

      case 'S': {
        for (let i = 0; i < nums.length; i += 4) {
          const cp2x = nums[i]!, cp2y = nums[i + 1]!
          const ex = nums[i + 2]!, ey = nums[i + 3]!
          approximateCubic(segments, cx, cy, cx, cy, cp2x, cp2y, ex, ey)
          cx = ex; cy = ey
        }
        break
      }

      case 'Q': {
        // Quadratic bezier
        for (let i = 0; i < nums.length; i += 4) {
          const cpx = nums[i]!, cpy = nums[i + 1]!
          const ex = nums[i + 2]!, ey = nums[i + 3]!
          approximateQuadratic(segments, cx, cy, cpx, cpy, ex, ey)
          cx = ex; cy = ey
        }
        break
      }

      case 'Z':
      case 'z':
        if (cx !== startX || cy !== startY) {
          segments.push({ x1: cx, y1: cy, x2: startX, y2: startY })
        }
        cx = startX; cy = startY
        break

      // A (arc) — simplified: just connect endpoints
      case 'A':
        if (nums.length >= 7) {
          const ex = nums[5]!, ey = nums[6]!
          segments.push({ x1: cx, y1: cy, x2: ex, y2: ey })
          cx = ex; cy = ey
        }
        break

      default:
        // Skip unrecognized
        break
    }
  }

  return segments
}

function approximateCubic(
  out: Array<{ x1: number; y1: number; x2: number; y2: number }>,
  x0: number, y0: number,
  cp1x: number, cp1y: number,
  cp2x: number, cp2y: number,
  x3: number, y3: number,
  steps = 8,
): void {
  let px = x0, py = y0
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const t2 = t * t
    const t3 = t2 * t
    const mt = 1 - t
    const mt2 = mt * mt
    const mt3 = mt2 * mt
    const nx = mt3 * x0 + 3 * mt2 * t * cp1x + 3 * mt * t2 * cp2x + t3 * x3
    const ny = mt3 * y0 + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp2y + t3 * y3
    out.push({ x1: px, y1: py, x2: nx, y2: ny })
    px = nx; py = ny
  }
}

function approximateQuadratic(
  out: Array<{ x1: number; y1: number; x2: number; y2: number }>,
  x0: number, y0: number,
  cpx: number, cpy: number,
  x2: number, y2: number,
  steps = 6,
): void {
  let px = x0, py = y0
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const mt = 1 - t
    const nx = mt * mt * x0 + 2 * mt * t * cpx + t * t * x2
    const ny = mt * mt * y0 + 2 * mt * t * cpy + t * t * y2
    out.push({ x1: px, y1: py, x2: nx, y2: ny })
    px = nx; py = ny
  }
}

// ---------------------------------------------------------------------------
// WebGL batch draw: Lines
// ---------------------------------------------------------------------------

function drawGLLines(wr: WebGLRendererRoot, lines: GLLine[]): void {
  if (lines.length === 0) return
  const { gl, programs, width, height, dpr } = wr

  gl.useProgram(programs.line)

  const posLoc = gl.getAttribLocation(programs.line, 'a_position')
  const colorLoc = gl.getAttribLocation(programs.line, 'a_color')
  const resLoc = gl.getUniformLocation(programs.line, 'u_resolution')

  gl.uniform2f(resLoc, width, height)

  // Build interleaved buffer: [x1,y1,r,g,b,a, x2,y2,r,g,b,a] per line
  const data = new Float32Array(lines.length * 12)
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]!
    const off = i * 12
    data[off] = l.x1; data[off + 1] = l.y1
    data[off + 2] = l.color[0]; data[off + 3] = l.color[1]
    data[off + 4] = l.color[2]; data[off + 5] = l.color[3]
    data[off + 6] = l.x2; data[off + 7] = l.y2
    data[off + 8] = l.color[0]; data[off + 9] = l.color[1]
    data[off + 10] = l.color[2]; data[off + 11] = l.color[3]
  }

  const buf = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)

  const stride = 24 // 6 floats * 4 bytes
  gl.enableVertexAttribArray(posLoc)
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, stride, 0)
  gl.enableVertexAttribArray(colorLoc)
  gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, stride, 8)

  // Set line width (WebGL limits this, but try)
  const maxWidth = lines.reduce((m, l) => Math.max(m, l.width), 1)
  gl.lineWidth(Math.min(maxWidth * dpr, gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE)[1]))

  gl.drawArrays(gl.LINES, 0, lines.length * 2)

  gl.disableVertexAttribArray(posLoc)
  gl.disableVertexAttribArray(colorLoc)
  gl.deleteBuffer(buf)
}

// ---------------------------------------------------------------------------
// WebGL batch draw: Points
// ---------------------------------------------------------------------------

function drawGLPoints(wr: WebGLRendererRoot, points: GLPoint[]): void {
  if (points.length === 0) return
  const { gl, programs, width, height, dpr } = wr

  gl.useProgram(programs.point)

  const posLoc = gl.getAttribLocation(programs.point, 'a_position')
  const radiusLoc = gl.getAttribLocation(programs.point, 'a_radius')
  const colorLoc = gl.getAttribLocation(programs.point, 'a_color')
  const resLoc = gl.getUniformLocation(programs.point, 'u_resolution')

  gl.uniform2f(resLoc, width, height)

  // Interleaved: [x, y, radius, r, g, b, a] per point
  const data = new Float32Array(points.length * 7)
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!
    const off = i * 7
    data[off] = p.x; data[off + 1] = p.y
    data[off + 2] = p.radius * dpr
    data[off + 3] = p.color[0]; data[off + 4] = p.color[1]
    data[off + 5] = p.color[2]; data[off + 6] = p.color[3]
  }

  const buf = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)

  const stride = 28 // 7 floats * 4 bytes
  gl.enableVertexAttribArray(posLoc)
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, stride, 0)
  gl.enableVertexAttribArray(radiusLoc)
  gl.vertexAttribPointer(radiusLoc, 1, gl.FLOAT, false, stride, 8)
  gl.enableVertexAttribArray(colorLoc)
  gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, stride, 12)

  gl.drawArrays(gl.POINTS, 0, points.length)

  gl.disableVertexAttribArray(posLoc)
  gl.disableVertexAttribArray(radiusLoc)
  gl.disableVertexAttribArray(colorLoc)
  gl.deleteBuffer(buf)
}

// ---------------------------------------------------------------------------
// WebGL batch draw: Rects (as triangle pairs)
// ---------------------------------------------------------------------------

function drawGLRects(wr: WebGLRendererRoot, rects: GLRect[]): void {
  if (rects.length === 0) return
  const { gl, programs, width, height } = wr

  gl.useProgram(programs.rect)

  const posLoc = gl.getAttribLocation(programs.rect, 'a_position')
  const colorLoc = gl.getAttribLocation(programs.rect, 'a_color')
  const resLoc = gl.getUniformLocation(programs.rect, 'u_resolution')

  gl.uniform2f(resLoc, width, height)

  // 6 vertices per rect (2 triangles), 6 floats per vertex (x,y,r,g,b,a)
  const data = new Float32Array(rects.length * 36)
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i]!
    const off = i * 36
    const x0 = r.x, y0 = r.y, x1 = r.x + r.w, y1 = r.y + r.h
    const c = r.color

    // Triangle 1: top-left, top-right, bottom-left
    data[off] = x0; data[off + 1] = y0; data[off + 2] = c[0]; data[off + 3] = c[1]; data[off + 4] = c[2]; data[off + 5] = c[3]
    data[off + 6] = x1; data[off + 7] = y0; data[off + 8] = c[0]; data[off + 9] = c[1]; data[off + 10] = c[2]; data[off + 11] = c[3]
    data[off + 12] = x0; data[off + 13] = y1; data[off + 14] = c[0]; data[off + 15] = c[1]; data[off + 16] = c[2]; data[off + 17] = c[3]

    // Triangle 2: top-right, bottom-right, bottom-left
    data[off + 18] = x1; data[off + 19] = y0; data[off + 20] = c[0]; data[off + 21] = c[1]; data[off + 22] = c[2]; data[off + 23] = c[3]
    data[off + 24] = x1; data[off + 25] = y1; data[off + 26] = c[0]; data[off + 27] = c[1]; data[off + 28] = c[2]; data[off + 29] = c[3]
    data[off + 30] = x0; data[off + 31] = y1; data[off + 32] = c[0]; data[off + 33] = c[1]; data[off + 34] = c[2]; data[off + 35] = c[3]
  }

  const buf = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)

  const stride = 24
  gl.enableVertexAttribArray(posLoc)
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, stride, 0)
  gl.enableVertexAttribArray(colorLoc)
  gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, stride, 8)

  gl.drawArrays(gl.TRIANGLES, 0, rects.length * 6)

  gl.disableVertexAttribArray(posLoc)
  gl.disableVertexAttribArray(colorLoc)
  gl.deleteBuffer(buf)
}

// ---------------------------------------------------------------------------
// 2D canvas overlay: text, axes, complex shapes
// ---------------------------------------------------------------------------

function draw2DNodes(
  ctx: CanvasRenderingContext2D,
  nodes: RenderNode[],
  _cw: number, _ch: number,
  theme: ThemeConfig,
): void {
  for (const node of nodes) {
    draw2DNode(ctx, node, theme)
  }
}

function draw2DNode(
  ctx: CanvasRenderingContext2D,
  node: RenderNode,
  theme: ThemeConfig,
): void {
  switch (node.type) {
    case 'group':
      ctx.save()
      if (node.attrs?.transform) apply2DTransform(ctx, node.attrs.transform)
      if (node.attrs?.opacity != null) ctx.globalAlpha *= node.attrs.opacity
      for (const child of node.children) draw2DNode(ctx, child, theme)
      ctx.restore()
      break

    case 'text': {
      const fill = resolveColor(node.attrs?.fill, resolveColor(theme.textColor))
      const opacity = node.attrs?.opacity ?? 1
      const fontSize = (node.attrs as Record<string, unknown>)?.fontSize as number ?? theme.fontSize
      const fontFamily = (node.attrs as Record<string, unknown>)?.fontFamily as string ?? theme.fontFamily
      const fontWeight = (node.attrs as Record<string, unknown>)?.fontWeight as string ?? 'normal'
      const textAnchor = (node.attrs as Record<string, unknown>)?.textAnchor as string | undefined
      const baseline = (node.attrs as Record<string, unknown>)?.dominantBaseline as string | undefined

      ctx.save()
      ctx.globalAlpha = opacity
      ctx.fillStyle = resolveColor(fill)
      ctx.font = `${fontWeight} ${fontSize}px ${resolveColor(fontFamily)}`
      ctx.textAlign = mapTextAlign(textAnchor)
      ctx.textBaseline = mapTextBaseline(baseline)

      if (node.attrs?.transform) apply2DTransform(ctx, node.attrs.transform)
      ctx.fillText(node.content, node.x, node.y)
      ctx.restore()
      break
    }

    case 'path': {
      // Only draw filled paths on 2D overlay (stroked paths handled by WebGL)
      const fill = resolveColor(node.attrs?.fill)
      if (fill && fill !== 'transparent' && fill !== 'none' && node.attrs?.fill) {
        const opacity = (node.attrs?.opacity ?? 1) * (node.attrs?.fillOpacity ?? 1)
        ctx.save()
        ctx.globalAlpha = opacity
        ctx.fillStyle = fill
        const p = new Path2D(node.d)
        ctx.fill(p)
        ctx.restore()
      }
      break
    }

    // line, rect, circle — already handled by WebGL, skip
    default:
      break
  }
}

function apply2DTransform(ctx: CanvasRenderingContext2D, t: string): void {
  const translateMatch = t.match(/translate\(\s*([^,)]+)[,\s]+([^)]+)\)/)
  if (translateMatch) {
    ctx.translate(parseFloat(translateMatch[1]!), parseFloat(translateMatch[2]!))
  }

  const rotateMatch = t.match(/rotate\(\s*([^,)]+)(?:[,\s]+([^,)]+)[,\s]+([^)]+))?\)/)
  if (rotateMatch) {
    const angle = parseFloat(rotateMatch[1]!) * Math.PI / 180
    if (rotateMatch[2] && rotateMatch[3]) {
      const cx = parseFloat(rotateMatch[2])
      const cy = parseFloat(rotateMatch[3])
      ctx.translate(cx, cy)
      ctx.rotate(angle)
      ctx.translate(-cx, -cy)
    } else {
      ctx.rotate(angle)
    }
  }
}
