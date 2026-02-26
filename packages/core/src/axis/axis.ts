import type { RenderNode, Scale, ChartArea, ResolvedOptions, ThemeConfig } from '../types'
import { CSS_PREFIX } from '../constants'
import { group, line, text } from '../render/tree'

/**
 * Render x-axis: axis line, tick marks, tick labels.
 * All colors reference CSS custom properties for Tailwind compatibility.
 */
export function renderXAxis(
  scale: Scale,
  area: ChartArea,
  options: ResolvedOptions,
  theme: ThemeConfig,
): RenderNode {
  const nodes: RenderNode[] = []
  const y = area.y + area.height

  // Axis line
  if (options.xAxis) {
    nodes.push(line(area.x, y, area.x + area.width, y, {
      class: 'chartts-x-axis',
      stroke: `var(${CSS_PREFIX}-axis)`,
      strokeWidth: theme.axisWidth,
    }))
  }

  // Ticks + labels
  const ticks = scale.ticks(options.xTicks || undefined)
  for (const tick of ticks) {
    const x = tick.position

    // Skip ticks outside chart area
    if (x < area.x - 1 || x > area.x + area.width + 1) continue

    // Tick mark
    nodes.push(line(x, y, x, y + 4, {
      class: 'chartts-x-tick',
      stroke: `var(${CSS_PREFIX}-axis)`,
      strokeWidth: theme.axisWidth,
    }))

    // Tick label
    nodes.push(text(x, y + 14, tick.label, {
      class: 'chartts-x-label',
      fill: `var(${CSS_PREFIX}-text-muted)`,
      textAnchor: 'middle',
      fontSize: theme.fontSizeSmall,
      fontFamily: `var(${CSS_PREFIX}-font-family)`,
    }))
  }

  // Axis label
  if (options.xLabel) {
    nodes.push(text(
      area.x + area.width / 2,
      y + 30,
      options.xLabel,
      {
        class: 'chartts-x-axis-label',
        fill: `var(${CSS_PREFIX}-text)`,
        textAnchor: 'middle',
        fontSize: theme.fontSize,
        fontFamily: `var(${CSS_PREFIX}-font-family)`,
        fontWeight: 500,
      },
    ))
  }

  return group(nodes, { class: 'chartts-x-axis-group' })
}

/**
 * Render y-axis: axis line, tick marks, tick labels.
 */
export function renderYAxis(
  scale: Scale,
  area: ChartArea,
  options: ResolvedOptions,
  theme: ThemeConfig,
): RenderNode {
  const nodes: RenderNode[] = []

  // Axis line
  if (options.yAxis) {
    nodes.push(line(area.x, area.y, area.x, area.y + area.height, {
      class: 'chartts-y-axis',
      stroke: `var(${CSS_PREFIX}-axis)`,
      strokeWidth: theme.axisWidth,
    }))
  }

  // Ticks + labels
  const ticks = scale.ticks(options.yTicks)
  for (const tick of ticks) {
    const y = tick.position

    // Skip ticks outside chart area (with small tolerance)
    if (y < area.y - 1 || y > area.y + area.height + 1) continue

    // Tick mark
    nodes.push(line(area.x - 4, y, area.x, y, {
      class: 'chartts-y-tick',
      stroke: `var(${CSS_PREFIX}-axis)`,
      strokeWidth: theme.axisWidth,
    }))

    // Tick label
    nodes.push(text(area.x - 7, y, tick.label, {
      class: 'chartts-y-label',
      fill: `var(${CSS_PREFIX}-text-muted)`,
      textAnchor: 'end',
      dominantBaseline: 'middle',
      fontSize: theme.fontSizeSmall,
      fontFamily: `var(${CSS_PREFIX}-font-family)`,
    }))
  }

  // Axis label (rotated)
  if (options.yLabel) {
    nodes.push(text(
      12,
      area.y + area.height / 2,
      options.yLabel,
      {
        class: 'chartts-y-axis-label',
        fill: `var(${CSS_PREFIX}-text)`,
        textAnchor: 'middle',
        fontSize: theme.fontSize,
        fontFamily: `var(${CSS_PREFIX}-font-family)`,
        fontWeight: 500,
        transform: `rotate(-90, 12, ${area.y + area.height / 2})`,
      },
    ))
  }

  return group(nodes, { class: 'chartts-y-axis-group' })
}

/**
 * Render grid lines.
 */
export function renderGrid(
  xScale: Scale,
  yScale: Scale,
  area: ChartArea,
  options: ResolvedOptions,
  theme: ThemeConfig,
): RenderNode {
  const nodes: RenderNode[] = []

  const dasharray = theme.gridStyle === 'dashed' ? '4,4'
    : theme.gridStyle === 'dotted' ? '2,2' : undefined

  // Horizontal grid lines (from y-axis ticks)
  if (options.yGrid) {
    const ticks = yScale.ticks(options.yTicks)
    for (const tick of ticks) {
      // Skip ticks outside chart area or on axis boundaries
      if (tick.position < area.y - 1 || tick.position > area.y + area.height + 1) continue
      if (Math.abs(tick.position - area.y) < 1 || Math.abs(tick.position - (area.y + area.height)) < 1) continue

      nodes.push(line(area.x, tick.position, area.x + area.width, tick.position, {
        class: 'chartts-grid-h',
        stroke: `var(${CSS_PREFIX}-grid)`,
        strokeWidth: theme.gridWidth,
        strokeDasharray: dasharray,
      }))
    }
  }

  // Vertical grid lines (from x-axis ticks)
  if (options.xGrid) {
    const ticks = xScale.ticks(options.xTicks || undefined)
    for (const tick of ticks) {
      // Skip ticks outside chart area or on axis boundaries
      if (tick.position < area.x - 1 || tick.position > area.x + area.width + 1) continue
      if (Math.abs(tick.position - area.x) < 1 || Math.abs(tick.position - (area.x + area.width)) < 1) continue

      nodes.push(line(tick.position, area.y, tick.position, area.y + area.height, {
        class: 'chartts-grid-v',
        stroke: `var(${CSS_PREFIX}-grid)`,
        strokeWidth: theme.gridWidth,
        strokeDasharray: dasharray,
      }))
    }
  }

  return group(nodes, { class: 'chartts-grid-group' })
}
