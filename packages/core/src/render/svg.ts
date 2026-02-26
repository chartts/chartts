import type { Renderer, RenderNode, RenderAttrs } from '../types'
import { CHART_CSS } from '../styles/chart'

const NS = 'http://www.w3.org/2000/svg'

/**
 * SVG DOM Renderer.
 *
 * Converts render tree nodes into real SVG elements.
 * All color attributes reference CSS custom properties (var(--chartts-*))
 * so they're overridable via CSS, Tailwind, or theme config.
 */
export function createSVGRenderer(): Renderer {
  return {
    createRoot(target, width, height, attrs) {
      const svg = document.createElementNS(NS, 'svg')
      svg.setAttribute('xmlns', NS)
      svg.setAttribute('width', '100%')
      svg.setAttribute('height', '100%')
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
      svg.classList.add('chartts')
      if (attrs) applyAttrs(svg, attrs)

      // Inject chart CSS once
      const styleEl = document.createElementNS(NS, 'style')
      styleEl.textContent = CHART_CSS
      svg.appendChild(styleEl)

      target.appendChild(svg)
      return { element: svg }
    },

    render(root, nodes) {
      // Keep the <style> element, clear everything else
      const styleEl = root.element.querySelector('style')
      clear(root.element)
      if (styleEl) root.element.appendChild(styleEl)
      appendNodes(root.element, nodes)
      applyEntryAnimations(root.element)
    },

    update(root, nodes) {
      const styleEl = root.element.querySelector('style')
      clear(root.element)
      if (styleEl) root.element.appendChild(styleEl)
      appendNodes(root.element, nodes)
      applyEntryAnimations(root.element)
    },

    clear(root) {
      clear(root.element)
    },

    destroy(root) {
      root.element.remove()
    },
  }
}

function clear(el: Element): void {
  while (el.firstChild) el.removeChild(el.firstChild)
}

function appendNodes(parent: Element, nodes: RenderNode[]): void {
  for (const node of nodes) {
    const el = createNode(node)
    if (el) parent.appendChild(el)
  }
}

function createNode(node: RenderNode): SVGElement | null {
  switch (node.type) {
    case 'group': {
      const g = el('g')
      if (node.attrs) applyAttrs(g, node.attrs)
      for (const child of node.children) {
        const c = createNode(child)
        if (c) g.appendChild(c)
      }
      return g
    }

    case 'path': {
      const p = el('path')
      p.setAttribute('d', node.d)
      if (!node.attrs?.fill) p.setAttribute('fill', 'none')
      if (node.attrs) applyAttrs(p, node.attrs)
      return p
    }

    case 'rect': {
      const r = el('rect')
      setNum(r, 'x', node.x)
      setNum(r, 'y', node.y)
      setNum(r, 'width', node.width)
      setNum(r, 'height', node.height)
      if (node.rx != null) setNum(r, 'rx', node.rx)
      if (node.ry != null) setNum(r, 'ry', node.ry)
      if (node.attrs) applyAttrs(r, node.attrs)
      return r
    }

    case 'circle': {
      const c = el('circle')
      setNum(c, 'cx', node.cx)
      setNum(c, 'cy', node.cy)
      setNum(c, 'r', node.r)
      if (node.attrs) applyAttrs(c, node.attrs)
      return c
    }

    case 'line': {
      const l = el('line')
      setNum(l, 'x1', node.x1)
      setNum(l, 'y1', node.y1)
      setNum(l, 'x2', node.x2)
      setNum(l, 'y2', node.y2)
      if (node.attrs) applyAttrs(l, node.attrs)
      return l
    }

    case 'text': {
      const t = el('text')
      setNum(t, 'x', node.x)
      setNum(t, 'y', node.y)
      t.textContent = node.content
      if (node.attrs) {
        const a = node.attrs
        if ('textAnchor' in a && a.textAnchor) t.setAttribute('text-anchor', a.textAnchor)
        if ('dominantBaseline' in a && a.dominantBaseline) t.setAttribute('dominant-baseline', a.dominantBaseline)
        if ('fontSize' in a && a.fontSize) t.setAttribute('font-size', String(a.fontSize))
        if ('fontFamily' in a && a.fontFamily) t.setAttribute('font-family', a.fontFamily as string)
        if ('fontWeight' in a && a.fontWeight) t.setAttribute('font-weight', String(a.fontWeight))
        applyAttrs(t, a)
      }
      return t
    }

    case 'clipPath': {
      const cp = el('clipPath')
      cp.setAttribute('id', node.id)
      for (const child of node.children) {
        const c = createNode(child)
        if (c) cp.appendChild(c)
      }
      return cp
    }

    case 'defs': {
      const d = el('defs')
      for (const child of node.children) {
        const c = createNode(child)
        if (c) d.appendChild(c)
      }
      return d
    }

    default:
      return null
  }
}

function el(tag: string): SVGElement {
  return document.createElementNS(NS, tag)
}

function setNum(el: SVGElement, attr: string, val: number): void {
  el.setAttribute(attr, String(val))
}

/** Map RenderAttrs to SVG DOM attributes */
function applyAttrs(el: SVGElement, attrs: RenderAttrs): void {
  const ATTR_MAP: Record<string, string> = {
    class: 'class',
    style: 'style',
    stroke: 'stroke',
    strokeWidth: 'stroke-width',
    strokeDasharray: 'stroke-dasharray',
    fill: 'fill',
    fillOpacity: 'fill-opacity',
    opacity: 'opacity',
    transform: 'transform',
    role: 'role',
    ariaLabel: 'aria-label',
    tabindex: 'tabindex',
  }

  for (const [key, value] of Object.entries(attrs)) {
    if (value == null) continue
    // Skip non-SVG attrs handled elsewhere
    if (['textAnchor', 'dominantBaseline', 'fontSize', 'fontFamily', 'fontWeight', 'rx', 'ry'].includes(key)) continue

    if (key === 'clipPath') {
      el.setAttribute('clip-path', `url(#${value as string})`)
    } else if (key.startsWith('data-')) {
      el.setAttribute(key, String(value))
    } else if (ATTR_MAP[key]) {
      el.setAttribute(ATTR_MAP[key]!, String(value))
    }
  }
}

/**
 * Apply entry animations after rendering:
 * - Line draw animation using getTotalLength()
 * - Staggered index CSS variable for bars/points/slices
 */
function applyEntryAnimations(svg: Element): void {
  // Line draw animation — skip dashed/dotted lines (they already have a dasharray pattern)
  svg.querySelectorAll<SVGPathElement>('.chartts-line, .chartts-sparkline-line').forEach((p) => {
    try {
      const existing = p.getAttribute('stroke-dasharray')
      if (existing && existing.includes(',')) return // preserve dashed/dotted pattern
      const len = p.getTotalLength()
      p.style.setProperty('--chartts-path-len', String(len))
      p.setAttribute('stroke-dasharray', String(len))
      p.setAttribute('stroke-dashoffset', String(len))
    } catch { /* ignore for non-path elements */ }
  })

  // Stagger animations for all chart element types
  const STAGGER_SELECTORS = [
    '.chartts-point', '.chartts-bar', '.chartts-slice', '.chartts-bubble',
    '.chartts-funnel-step', '.chartts-waterfall-bar', '.chartts-candle',
    '.chartts-dot', '.chartts-radar-point',
    '.chartts-heatmap-cell', '.chartts-treemap-cell', '.chartts-polar-wedge',
    '.chartts-lollipop-stem', '.chartts-bullet-bar', '.chartts-calendar-cell',
    '.chartts-radialbar-arc', '.chartts-dumbbell-dot', '.chartts-boxplot-box',
    '.chartts-sankey-link',
    '.chartts-sunburst-sector', '.chartts-tree-node',
    '.chartts-graph-node', '.chartts-themeriver-stream',
    '.chartts-pictorialbar-symbol', '.chartts-chord-arc',
    '.chartts-chord-ribbon',
  ]
  for (const selector of STAGGER_SELECTORS) {
    svg.querySelectorAll(selector).forEach((el, i) => {
      ;(el as SVGElement).style.setProperty('--chartts-i', String(i))
    })
  }

  // Gauge fill draw animation (same technique as line draw)
  svg.querySelectorAll<SVGPathElement>('.chartts-gauge-fill').forEach((p) => {
    try {
      const len = p.getTotalLength()
      p.style.setProperty('--chartts-path-len', String(len))
      p.setAttribute('stroke-dasharray', String(len))
      p.setAttribute('stroke-dashoffset', String(len))
    } catch { /* ignore */ }
  })

  // Stagger for radar areas (per series) — uses a different CSS variable
  svg.querySelectorAll('.chartts-radar-area').forEach((el, i) => {
    ;(el as SVGElement).style.setProperty('--chartts-radar-i', String(i))
  })
}
