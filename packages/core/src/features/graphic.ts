import type { RenderNode, RenderAttrs } from '../types'
import { rect, circle, path, text, line, group } from '../render/tree'

/**
 * Graphic — create custom SVG overlay elements for charts.
 *
 * Provides a declarative API to define arbitrary shapes, text, and groups
 * that can be overlaid on any chart. Positions can be absolute (px)
 * or relative (0..1 proportion of chart area).
 */

export interface GraphicElement {
  type: 'rect' | 'circle' | 'path' | 'text' | 'line' | 'group' | 'image'
  // Position (absolute px or relative 0..1 with position: 'relative')
  x?: number
  y?: number
  // Sizing
  width?: number
  height?: number
  r?: number
  // Content
  d?: string            // path data
  content?: string      // text content
  x2?: number           // line end x
  y2?: number           // line end y
  src?: string          // image source
  // Children (for groups)
  children?: GraphicElement[]
  // Positioning mode
  position?: 'absolute' | 'relative'
  // Any SVG attributes
  attrs?: Record<string, unknown>
}

export interface GraphicArea {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Convert an array of GraphicElement definitions into RenderNode[].
 * Use `area` to resolve relative positions.
 */
export function createGraphicElements(
  elements: GraphicElement[],
  area?: GraphicArea,
): RenderNode[] {
  return elements.map(el => resolveElement(el, area)).filter(Boolean) as RenderNode[]
}

function resolveElement(el: GraphicElement, area?: GraphicArea): RenderNode | null {
  const resolve = (v: number | undefined, dim: 'x' | 'y'): number => {
    if (v === undefined) return 0
    if (el.position === 'relative' && area) {
      return dim === 'x'
        ? area.x + v * area.width
        : area.y + v * area.height
    }
    return v
  }

  const resolveSize = (v: number | undefined, dim: 'w' | 'h'): number => {
    if (v === undefined) return 0
    if (el.position === 'relative' && area) {
      return dim === 'w' ? v * area.width : v * area.height
    }
    return v
  }

  const attrs: RenderAttrs = {
    class: 'chartts-graphic',
    ...(el.attrs as RenderAttrs),
  }

  switch (el.type) {
    case 'rect':
      return rect(
        resolve(el.x, 'x'),
        resolve(el.y, 'y'),
        resolveSize(el.width, 'w'),
        resolveSize(el.height, 'h'),
        attrs,
      )

    case 'circle':
      return circle(
        resolve(el.x, 'x'),
        resolve(el.y, 'y'),
        el.r ?? 10,
        attrs,
      )

    case 'path':
      return el.d ? path(el.d, attrs) : null

    case 'text':
      return text(
        resolve(el.x, 'x'),
        resolve(el.y, 'y'),
        el.content ?? '',
        attrs,
      )

    case 'line':
      return line(
        resolve(el.x, 'x'),
        resolve(el.y, 'y'),
        resolve(el.x2, 'x'),
        resolve(el.y2, 'y'),
        attrs,
      )

    case 'group': {
      const children = (el.children ?? [])
        .map(c => resolveElement(c, area))
        .filter(Boolean) as RenderNode[]
      return group(children, attrs)
    }

    case 'image':
      return {
        type: 'image' as unknown as RenderNode['type'],
        attrs: {
          ...attrs,
          href: el.src ?? '',
          x: resolve(el.x, 'x'),
          y: resolve(el.y, 'y'),
          width: resolveSize(el.width, 'w'),
          height: resolveSize(el.height, 'h'),
        },
      } as unknown as RenderNode

    default:
      return null
  }
}

/**
 * Convenience: create a horizontal guideline.
 */
export function horizontalLine(
  y: number,
  area: GraphicArea,
  attrs?: RenderAttrs,
): RenderNode {
  return line(area.x, y, area.x + area.width, y, {
    class: 'chartts-graphic-guideline',
    stroke: '#6b7280',
    strokeWidth: 1,
    strokeDasharray: '4,3',
    ...attrs,
  })
}

/**
 * Convenience: create a vertical guideline.
 */
export function verticalLine(
  x: number,
  area: GraphicArea,
  attrs?: RenderAttrs,
): RenderNode {
  return line(x, area.y, x, area.y + area.height, {
    class: 'chartts-graphic-guideline',
    stroke: '#6b7280',
    strokeWidth: 1,
    strokeDasharray: '4,3',
    ...attrs,
  })
}

/**
 * Convenience: create a text annotation at a position.
 */
export function annotation(
  x: number, y: number,
  content: string,
  attrs?: RenderAttrs,
): RenderNode {
  return text(x, y, content, {
    class: 'chartts-graphic-annotation',
    fill: '#374151',
    fontSize: 11,
    textAnchor: 'middle',
    dominantBaseline: 'auto',
    ...attrs,
  })
}
