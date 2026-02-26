/**
 * GraphGL — force-directed graph layout with Barnes-Hut optimization, GL rendering.
 */

import type { GLChartTypePlugin, GLRenderContext, GLDataPoint, GLSeries2D } from '../../types'
import { hexToRGB } from '../../types'
import { createVertexBuffer, createVertexLayout, applyVertexLayout, disableVertexLayout, type GLBuffer } from '../../engine/buffer'
import { FLAT_VERT, FLAT_VERT_UNIFORMS, FLAT_VERT_ATTRIBUTES } from '../../shaders/flat.vert'
import { POINT_FRAG, POINT_FRAG_UNIFORMS } from '../../shaders/point.frag'

interface GNode { x: number; y: number; vx: number; vy: number; name: string; value: number; si: number; di: number }
interface GEdge { source: number; target: number }
interface QNode { cx: number; cy: number; mass: number; x0: number; y0: number; x1: number; y1: number; children: (QNode | null)[]; body: GNode | null }

function insertNode(quad: QNode, node: GNode) {
  if (quad.mass === 0 && !quad.body) { quad.body = node; quad.cx = node.x; quad.cy = node.y; quad.mass = 1; return }
  if (quad.body) { const existing = quad.body; quad.body = null; insertIntoChild(quad, existing) }
  quad.cx = (quad.cx * quad.mass + node.x) / (quad.mass + 1)
  quad.cy = (quad.cy * quad.mass + node.y) / (quad.mass + 1)
  quad.mass += 1
  insertIntoChild(quad, node)
}

function insertIntoChild(quad: QNode, node: GNode) {
  const midX = (quad.x0 + quad.x1) / 2, midY = (quad.y0 + quad.y1) / 2
  const idx = (node.x > midX ? 1 : 0) + (node.y > midY ? 2 : 0)
  if (!quad.children[idx]) {
    quad.children[idx] = { cx: 0, cy: 0, mass: 0, x0: idx & 1 ? midX : quad.x0, y0: idx & 2 ? midY : quad.y0, x1: idx & 1 ? quad.x1 : midX, y1: idx & 2 ? quad.y1 : midY, children: [null, null, null, null], body: null }
  }
  insertNode(quad.children[idx]!, node)
}

function applyBarnesHut(quad: QNode, node: GNode, theta: number, repulsion: number) {
  if (quad.mass === 0) return
  const dx = quad.cx - node.x, dy = quad.cy - node.y
  const dist = Math.sqrt(dx * dx + dy * dy) + 0.01
  if ((quad.x1 - quad.x0) / dist < theta || quad.mass === 1) {
    const force = -repulsion * quad.mass / (dist * dist)
    node.vx += force * dx / dist; node.vy += force * dy / dist; return
  }
  for (const child of quad.children) if (child) applyBarnesHut(child, node, theta, repulsion)
}

const EDGE_VERT = `precision highp float; attribute vec2 a_position; attribute vec3 a_color; uniform vec2 u_resolution; varying vec3 v_color; void main() { vec2 c = (a_position / u_resolution) * 2.0 - 1.0; c.y = -c.y; gl_Position = vec4(c, 0.0, 1.0); v_color = a_color; }`
const EDGE_FRAG = `precision highp float; uniform float u_opacity; varying vec3 v_color; void main() { gl_FragColor = vec4(v_color, u_opacity * 0.4); }`

export function createGraphGLPlugin(): GLChartTypePlugin {
  let nodeVBO: GLBuffer | null = null
  let edgeVBO: GLBuffer | null = null
  let nodeCount = 0
  let nodes: GNode[] = []
  let edges: GEdge[] = []
  let simulating = true
  let simIterations = 0
  const MAX_ITER = 300

  function stepSim(w: number, h: number) {
    if (!simulating || simIterations >= MAX_ITER) { simulating = false; return }
    const root: QNode = { cx: 0, cy: 0, mass: 0, x0: 0, y0: 0, x1: w, y1: h, children: [null, null, null, null], body: null }
    for (const n of nodes) insertNode(root, n)
    for (const n of nodes) applyBarnesHut(root, n, 0.8, 500)
    for (const e of edges) {
      const s = nodes[e.source]!, t = nodes[e.target]!
      const dx = t.x - s.x, dy = t.y - s.y, dist = Math.sqrt(dx * dx + dy * dy) + 0.01
      const f = 0.01 * (dist - 100), fx = f * dx / dist, fy = f * dy / dist
      s.vx += fx; s.vy += fy; t.vx -= fx; t.vy -= fy
    }
    const cx = w / 2, cy = h / 2
    for (const n of nodes) {
      n.vx += (cx - n.x) * 0.001; n.vy += (cy - n.y) * 0.001
      n.vx *= 0.9; n.vy *= 0.9
      n.x = Math.max(20, Math.min(w - 20, n.x + n.vx))
      n.y = Math.max(20, Math.min(h - 20, n.y + n.vy))
    }
    simIterations++
  }

  return {
    type: 'graph-gl',

    prepare(ctx: GLRenderContext) {
      const { renderer, data, options, width, height } = ctx
      const gl = renderer.gl
      const series = data.series as GLSeries2D[]

      renderer.registerProgram('flat-point', FLAT_VERT, POINT_FRAG,
        [...FLAT_VERT_UNIFORMS, ...POINT_FRAG_UNIFORMS], FLAT_VERT_ATTRIBUTES)
      renderer.registerProgram('edge', EDGE_VERT, EDGE_FRAG,
        ['u_resolution', 'u_opacity'], ['a_position', 'a_color'])

      nodes = []; edges = (options['edges'] as GEdge[] | undefined) ?? []
      const s = series[0]
      if (s) {
        for (let i = 0; i < s.x.length; i++) {
          nodes.push({ x: Math.random() * (width - 40) + 20, y: Math.random() * (height - 40) + 20, vx: 0, vy: 0, name: data.categories?.[i] ?? `N${i}`, value: s.y[i] ?? 1, si: 0, di: i })
        }
        if (edges.length === 0) for (let i = 0; i < nodes.length; i++) {
          for (let e = 0; e < Math.min(3, Math.floor(Math.random() * 4)); e++) {
            const t = Math.floor(Math.random() * nodes.length)
            if (t !== i) edges.push({ source: i, target: t })
          }
        }
      }
      simulating = true; simIterations = 0
      if (nodeVBO) nodeVBO.update(new Float32Array(nodes.length * 6)); else nodeVBO = createVertexBuffer(gl, new Float32Array(nodes.length * 6), gl.DYNAMIC_DRAW)
      if (edgeVBO) edgeVBO.update(new Float32Array(edges.length * 10)); else edgeVBO = createVertexBuffer(gl, new Float32Array(edges.length * 10), gl.DYNAMIC_DRAW)
      nodeCount = nodes.length
    },

    render(ctx: GLRenderContext) {
      const { renderer, theme } = ctx
      const gl = renderer.gl
      const progress = ctx.animationProgress

      if (simulating) for (let i = 0; i < 5; i++) stepSim(ctx.width, ctx.height)

      const edgeColor = hexToRGB(theme.gridColor)
      const defaultSize = ctx.options.pointSize ?? 6

      // Edges
      const ed = new Float32Array(edges.length * 10)
      for (let i = 0; i < edges.length; i++) {
        const s = nodes[edges[i]!.source]!, t = nodes[edges[i]!.target]!
        const o = i * 10
        ed[o] = s.x; ed[o+1] = s.y; ed[o+2] = edgeColor[0]; ed[o+3] = edgeColor[1]; ed[o+4] = edgeColor[2]
        ed[o+5] = t.x; ed[o+6] = t.y; ed[o+7] = edgeColor[0]; ed[o+8] = edgeColor[1]; ed[o+9] = edgeColor[2]
      }
      if (edgeVBO) edgeVBO.update(ed)

      const ep = renderer.getProgram('edge')!
      ep.use(); ep.setVec2('u_resolution', ctx.width, ctx.height); ep.setFloat('u_opacity', progress)
      if (edgeVBO) {
        edgeVBO.bind()
        const el = createVertexLayout([{ location: ep.attributes['a_position']!, size: 2 }, { location: ep.attributes['a_color']!, size: 3 }])
        applyVertexLayout(gl, el)
        gl.disable(gl.DEPTH_TEST)
        gl.drawArrays(gl.LINES, 0, edges.length * 2)
        disableVertexLayout(gl, el)
      }

      // Nodes
      const nd = new Float32Array(nodes.length * 6)
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]!, color = hexToRGB(theme.colors[i % theme.colors.length]!)
        const o = i * 6
        nd[o] = n.x; nd[o+1] = n.y; nd[o+2] = color[0]; nd[o+3] = color[1]; nd[o+4] = color[2]; nd[o+5] = defaultSize + n.value * 0.5
      }
      if (nodeVBO) nodeVBO.update(nd)

      const pp = renderer.getProgram('flat-point')!
      pp.use(); pp.setVec2('u_resolution', ctx.width, ctx.height); pp.setFloat('u_pixelRatio', renderer.pixelRatio); pp.setFloat('u_opacity', progress)
      if (nodeVBO) {
        nodeVBO.bind()
        const nl = createVertexLayout([{ location: pp.attributes['a_position']!, size: 2 }, { location: pp.attributes['a_color']!, size: 3 }, { location: pp.attributes['a_size']!, size: 1 }])
        applyVertexLayout(gl, nl)
        gl.drawArrays(gl.POINTS, 0, nodeCount)
        gl.enable(gl.DEPTH_TEST)
        disableVertexLayout(gl, nl)
      }
    },

    needsLoop() { return simulating },

    renderOverlay(ctx: GLRenderContext, ctx2d: CanvasRenderingContext2D) {
      ctx2d.font = `${ctx.theme.fontSize - 1}px ${ctx.theme.fontFamily}`
      ctx2d.fillStyle = ctx.theme.textColor; ctx2d.textAlign = 'center'
      for (const n of nodes) ctx2d.fillText(n.name, n.x, n.y - 8)
    },

    hitTest(_ctx: GLRenderContext, x: number, y: number): GLDataPoint | null {
      let closest: GLDataPoint | null = null
      let closestDist = 15
      for (const n of nodes) {
        const d = Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2)
        if (d < closestDist) { closestDist = d; closest = { seriesIndex: n.si, dataIndex: n.di, value: n.value, x: n.x, y: n.y, seriesName: n.name } }
      }
      return closest
    },

    dispose() { nodeVBO?.destroy(); nodeVBO = null; edgeVBO?.destroy(); edgeVBO = null; nodes = []; edges = [] },
  }
}
