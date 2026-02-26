import type { RenderNode, RenderAttrs } from '../types'

/**
 * Render tree node constructors.
 * Charts describe what to draw using these — they never touch the DOM.
 */

export function group(children: RenderNode[], attrs?: RenderAttrs): RenderNode {
  return { type: 'group', children, attrs }
}

export function path(d: string, attrs?: RenderAttrs): RenderNode {
  return { type: 'path', d, attrs }
}

export function rect(
  x: number, y: number, width: number, height: number,
  attrs?: RenderAttrs & { rx?: number; ry?: number },
): RenderNode {
  return { type: 'rect', x, y, width, height, rx: attrs?.rx, ry: attrs?.ry, attrs }
}

export function circle(cx: number, cy: number, r: number, attrs?: RenderAttrs): RenderNode {
  return { type: 'circle', cx, cy, r, attrs }
}

export function line(
  x1: number, y1: number, x2: number, y2: number,
  attrs?: RenderAttrs,
): RenderNode {
  return { type: 'line', x1, y1, x2, y2, attrs }
}

export function text(
  x: number, y: number, content: string,
  attrs?: RenderAttrs & {
    textAnchor?: 'start' | 'middle' | 'end'
    dominantBaseline?: 'auto' | 'middle' | 'hanging' | 'central'
    fontSize?: number
    fontFamily?: string
    fontWeight?: string | number
  },
): RenderNode {
  return { type: 'text', x, y, content, attrs }
}

export function defs(children: RenderNode[]): RenderNode {
  return { type: 'defs', children }
}

export function clipPathDef(id: string, children: RenderNode[]): RenderNode {
  return { type: 'clipPath', id, children }
}

/**
 * SVG path string builder.
 */
export class PathBuilder {
  private cmds: string[] = []

  moveTo(x: number, y: number): this {
    this.cmds.push(`M${n(x)},${n(y)}`); return this
  }
  lineTo(x: number, y: number): this {
    this.cmds.push(`L${n(x)},${n(y)}`); return this
  }
  curveTo(cx1: number, cy1: number, cx2: number, cy2: number, x: number, y: number): this {
    this.cmds.push(`C${n(cx1)},${n(cy1)},${n(cx2)},${n(cy2)},${n(x)},${n(y)}`); return this
  }
  quadTo(cx: number, cy: number, x: number, y: number): this {
    this.cmds.push(`Q${n(cx)},${n(cy)},${n(x)},${n(y)}`); return this
  }
  arc(rx: number, ry: number, rot: number, large: boolean, sweep: boolean, x: number, y: number): this {
    this.cmds.push(`A${n(rx)},${n(ry)},${rot},${large?1:0},${sweep?1:0},${n(x)},${n(y)}`); return this
  }
  hTo(x: number): this { this.cmds.push(`H${n(x)}`); return this }
  vTo(y: number): this { this.cmds.push(`V${n(y)}`); return this }
  close(): this { this.cmds.push('Z'); return this }
  build(): string { return this.cmds.join('') }
  reset(): this { this.cmds = []; return this }
}

function n(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(2)
}
