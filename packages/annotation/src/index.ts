import type { RenderNode, RenderAttrs, ChartArea, Scale } from '@chartts/core'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnnotationConfig {
  type: 'line' | 'area' | 'label' | 'threshold'
}

export interface LineAnnotation extends AnnotationConfig {
  type: 'line'
  axis: 'x' | 'y'
  value: number | string
  label?: string
  color?: string
  dash?: boolean
  lineWidth?: number
}

export interface AreaAnnotation extends AnnotationConfig {
  type: 'area'
  axis: 'x' | 'y'
  from: number | string
  to: number | string
  color?: string
  opacity?: number
  label?: string
}

export interface LabelAnnotation extends AnnotationConfig {
  type: 'label'
  x: number | string
  y: number
  text: string
  color?: string
  fontSize?: number
  anchor?: 'start' | 'middle' | 'end'
}

export interface ThresholdAnnotation extends AnnotationConfig {
  type: 'threshold'
  value: number
  label?: string
  color?: string
  aboveColor?: string
  belowColor?: string
}

export type Annotation = LineAnnotation | AreaAnnotation | LabelAnnotation | ThresholdAnnotation

// ---------------------------------------------------------------------------
// Options helpers
// ---------------------------------------------------------------------------

interface LineOpts {
  label?: string
  color?: string
  dash?: boolean
  lineWidth?: number
}

interface AreaOpts {
  color?: string
  opacity?: number
  label?: string
}

interface ThresholdOpts {
  label?: string
  color?: string
  aboveColor?: string
  belowColor?: string
  lineWidth?: number
  dash?: boolean
}

interface LabelOpts {
  color?: string
  fontSize?: number
  anchor?: 'start' | 'middle' | 'end'
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildLineAttrs(color: string, lineWidth: number, dash: boolean): RenderAttrs {
  const attrs: RenderAttrs = {
    stroke: color,
    strokeWidth: lineWidth,
  }
  if (dash) {
    attrs.strokeDasharray = '6 4'
  }
  return attrs
}

function buildTextNode(
  x: number,
  y: number,
  content: string,
  color: string,
  fontSize: number,
  anchor: 'start' | 'middle' | 'end',
): RenderNode {
  return {
    type: 'text',
    x,
    y,
    content,
    attrs: {
      fill: color,
      fontSize,
      textAnchor: anchor,
      dominantBaseline: 'auto',
    },
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a horizontal or vertical reference line as RenderNode[].
 *
 * For axis='y', value is mapped through yScale (horizontal line across chart).
 * For axis='x', value is mapped through xScale (vertical line top to bottom).
 */
export function referenceLine(
  axis: 'x' | 'y',
  value: number | string,
  area: ChartArea,
  xScale: Scale,
  yScale: Scale,
  opts?: LineOpts,
): RenderNode[] {
  const color = opts?.color ?? '#888888'
  const lineWidth = opts?.lineWidth ?? 1.5
  const dash = opts?.dash ?? true
  const nodes: RenderNode[] = []

  if (axis === 'y') {
    const py = yScale.map(value)
    nodes.push({
      type: 'line',
      x1: area.x,
      y1: py,
      x2: area.x + area.width,
      y2: py,
      attrs: buildLineAttrs(color, lineWidth, dash),
    })
    if (opts?.label) {
      nodes.push(
        buildTextNode(area.x - 4, py - 6, opts.label, color, 11, 'end'),
      )
    }
  } else {
    const px = xScale.map(value)
    nodes.push({
      type: 'line',
      x1: px,
      y1: area.y,
      x2: px,
      y2: area.y + area.height,
      attrs: buildLineAttrs(color, lineWidth, dash),
    })
    if (opts?.label) {
      nodes.push(
        buildTextNode(px, area.y - 6, opts.label, color, 11, 'middle'),
      )
    }
  }

  return nodes
}

/**
 * Create a shaded rectangular band (reference area) as RenderNode[].
 *
 * For axis='y': horizontal band between two y-values.
 * For axis='x': vertical band between two x-values.
 */
export function referenceArea(
  axis: 'x' | 'y',
  from: number | string,
  to: number | string,
  area: ChartArea,
  xScale: Scale,
  yScale: Scale,
  opts?: AreaOpts,
): RenderNode[] {
  const color = opts?.color ?? '#3b82f6'
  const opacity = opts?.opacity ?? 0.12
  const nodes: RenderNode[] = []

  if (axis === 'y') {
    const y1 = yScale.map(from)
    const y2 = yScale.map(to)
    const top = Math.min(y1, y2)
    const height = Math.abs(y2 - y1)

    nodes.push({
      type: 'rect',
      x: area.x,
      y: top,
      width: area.width,
      height,
      attrs: { fill: color, fillOpacity: opacity },
    })

    if (opts?.label) {
      nodes.push(
        buildTextNode(
          area.x + area.width / 2,
          top + height / 2,
          opts.label,
          color,
          11,
          'middle',
        ),
      )
    }
  } else {
    const x1 = xScale.map(from)
    const x2 = xScale.map(to)
    const left = Math.min(x1, x2)
    const width = Math.abs(x2 - x1)

    nodes.push({
      type: 'rect',
      x: left,
      y: area.y,
      width,
      height: area.height,
      attrs: { fill: color, fillOpacity: opacity },
    })

    if (opts?.label) {
      nodes.push(
        buildTextNode(
          left + width / 2,
          area.y + 14,
          opts.label,
          color,
          11,
          'middle',
        ),
      )
    }
  }

  return nodes
}

/**
 * Create a threshold line with optional color zones above/below.
 *
 * Always renders as a horizontal line at the given y-value.
 * If aboveColor or belowColor is specified, semi-transparent rectangles
 * are drawn above and below the threshold.
 */
export function threshold(
  value: number,
  area: ChartArea,
  yScale: Scale,
  opts?: ThresholdOpts,
): RenderNode[] {
  const color = opts?.color ?? '#ef4444'
  const lineWidth = opts?.lineWidth ?? 1.5
  const dash = opts?.dash ?? true
  const py = yScale.map(value)
  const nodes: RenderNode[] = []

  // Color zone above threshold
  if (opts?.aboveColor) {
    const aboveHeight = py - area.y
    if (aboveHeight > 0) {
      nodes.push({
        type: 'rect',
        x: area.x,
        y: area.y,
        width: area.width,
        height: aboveHeight,
        attrs: { fill: opts.aboveColor, fillOpacity: 0.08 },
      })
    }
  }

  // Color zone below threshold
  if (opts?.belowColor) {
    const belowTop = py
    const belowHeight = area.y + area.height - py
    if (belowHeight > 0) {
      nodes.push({
        type: 'rect',
        x: area.x,
        y: belowTop,
        width: area.width,
        height: belowHeight,
        attrs: { fill: opts.belowColor, fillOpacity: 0.08 },
      })
    }
  }

  // Threshold line
  nodes.push({
    type: 'line',
    x1: area.x,
    y1: py,
    x2: area.x + area.width,
    y2: py,
    attrs: buildLineAttrs(color, lineWidth, dash),
  })

  // Label
  if (opts?.label) {
    nodes.push(
      buildTextNode(area.x + area.width + 4, py + 4, opts.label, color, 11, 'start'),
    )
  }

  return nodes
}

/**
 * Create a positioned text label as a single RenderNode.
 *
 * x is mapped through xScale, y through yScale.
 */
export function dataLabel(
  x: number | string,
  y: number,
  text: string,
  _area: ChartArea,
  xScale: Scale,
  yScale: Scale,
  opts?: LabelOpts,
): RenderNode {
  const px = xScale.map(x)
  const py = yScale.map(y)
  const color = opts?.color ?? '#374151'
  const fontSize = opts?.fontSize ?? 12
  const anchor = opts?.anchor ?? 'middle'

  return buildTextNode(px, py, text, color, fontSize, anchor)
}

/**
 * Batch convert an array of Annotation configs into RenderNode[].
 *
 * This is the declarative API: users describe what annotations they want
 * and this function produces the full render tree.
 */
export function createAnnotations(
  annotations: Annotation[],
  area: ChartArea,
  xScale: Scale,
  yScale: Scale,
): RenderNode[] {
  const nodes: RenderNode[] = []

  for (const ann of annotations) {
    switch (ann.type) {
      case 'line': {
        const lineNodes = referenceLine(ann.axis, ann.value, area, xScale, yScale, {
          label: ann.label,
          color: ann.color,
          dash: ann.dash,
          lineWidth: ann.lineWidth,
        })
        nodes.push(...lineNodes)
        break
      }

      case 'area': {
        const areaNodes = referenceArea(ann.axis, ann.from, ann.to, area, xScale, yScale, {
          color: ann.color,
          opacity: ann.opacity,
          label: ann.label,
        })
        nodes.push(...areaNodes)
        break
      }

      case 'label': {
        const labelNode = dataLabel(ann.x, ann.y, ann.text, area, xScale, yScale, {
          color: ann.color,
          fontSize: ann.fontSize,
          anchor: ann.anchor,
        })
        nodes.push(labelNode)
        break
      }

      case 'threshold': {
        const thresholdNodes = threshold(ann.value, area, yScale, {
          label: ann.label,
          color: ann.color,
          aboveColor: ann.aboveColor,
          belowColor: ann.belowColor,
        })
        nodes.push(...thresholdNodes)
        break
      }
    }
  }

  return [{ type: 'group', children: nodes, attrs: { class: 'chartts-annotations' } }]
}
