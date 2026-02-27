import type {
  ChartData, ChartOptions, ChartTypePlugin,
  RenderNode, RenderContext, RenderAttrs,
} from '../types'
import { CHART_CSS } from '../styles/chart'
import { createEffectDefs } from './effects'
import { resolveOptions } from '../constants'
import { resolveTheme } from '../theme/engine'
import { computeLayout } from '../layout/compute'
import { renderXAxis, renderYAxis, renderGrid } from '../axis/axis'
import { renderLegend } from '../legend/legend'
import { createLinearScale } from '../scales/linear'
import { createCategoricalScale } from '../scales/categorical'
import { group, defs, clipPathDef, rect } from './tree'

/**
 * Render a chart to an SVG string. No DOM required — works in Node.js / SSR.
 *
 * @example
 * ```ts
 * import { renderToString, lineChartType } from '@chartts/core'
 *
 * const svg = renderToString(lineChartType, {
 *   labels: ['Jan', 'Feb', 'Mar'],
 *   series: [{ name: 'Sales', values: [10, 20, 15] }],
 * }, { width: 600, height: 400 })
 *
 * // svg is a full <svg>...</svg> string
 * ```
 */
export function renderToString(
  chartType: ChartTypePlugin,
  data: ChartData,
  options: ChartOptions & { width?: number; height?: number } = {},
): string {
  const width = options.width ?? 600
  const height = options.height ?? 400
  const resolved = resolveOptions({ ...options, width, height }, data.series.length)
  const theme = resolveTheme(resolved.theme)
  const prepared = chartType.prepareData(data, resolved)

  // Chart types that suppress axes don't need axis margins
  const suppressAxes = !!chartType.suppressAxes
  const layoutOpts = suppressAxes
    ? { ...resolved, xAxis: false, yAxis: false, xLabel: '', yLabel: '', legend: false as const, padding: [4, 4, 4, 4] as [number, number, number, number] }
    : resolved
  const { area } = computeLayout(width, height, layoutOpts, prepared)

  const useBand = !!chartType.useBandScale
  const xScale = createCategoricalScale({
    categories: prepared.labels,
    range: [area.x, area.x + area.width],
    format: resolved.xFormat,
    band: useBand,
  })

  const yScale = createLinearScale({
    domain: [prepared.bounds.yMin, prepared.bounds.yMax],
    range: [area.y + area.height, area.y],
    nice: true,
    format: resolved.yFormat,
  })

  const ctx: RenderContext = { data: prepared, options: resolved, area, xScale, yScale, theme }

  const clipId = 'chartts-clip'
  const nodes: RenderNode[] = []

  nodes.push(defs([
    clipPathDef(clipId, [rect(area.x, area.y, area.width, area.height)]),
  ]))
  if (!suppressAxes) {
    nodes.push(renderGrid(xScale, yScale, area, resolved, theme))
    nodes.push(renderXAxis(xScale, area, resolved, theme))
    nodes.push(renderYAxis(yScale, area, resolved, theme))
  }

  const chartNodes = chartType.render(ctx)
  nodes.push(group(chartNodes, { class: 'chartts-content', clipPath: clipId }))

  if (!suppressAxes) {
    const legend = renderLegend(prepared, area, resolved, theme)
    if (legend) nodes.push(legend)
  }

  const childrenStr = nodes.map(nodeToString).join('')
  const styleStr = `<style>${CHART_CSS}</style>`
  const fxDefsStr = `<defs class="chartts-fx">${createEffectDefs(resolved.colors)}</defs>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escapeAttr(resolved.ariaLabel)}" class="chartts">${styleStr}${fxDefsStr}${childrenStr}</svg>`
}

// ---------------------------------------------------------------------------
// Node serialization
// ---------------------------------------------------------------------------

function nodeToString(node: RenderNode): string {
  switch (node.type) {
    case 'group': {
      const attrs = renderAttrs(node.attrs)
      const children = node.children.map(nodeToString).join('')
      return `<g${attrs}>${children}</g>`
    }

    case 'path': {
      const attrs = renderAttrs(node.attrs)
      const fill = node.attrs?.fill ? '' : ' fill="none"'
      return `<path d="${escapeAttr(node.d)}"${fill}${attrs}/>`
    }

    case 'rect': {
      const attrs = renderAttrs(node.attrs)
      const rx = node.rx != null ? ` rx="${node.rx}"` : ''
      const ry = node.ry != null ? ` ry="${node.ry}"` : ''
      return `<rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}"${rx}${ry}${attrs}/>`
    }

    case 'circle': {
      const attrs = renderAttrs(node.attrs)
      return `<circle cx="${node.cx}" cy="${node.cy}" r="${node.r}"${attrs}/>`
    }

    case 'line': {
      const attrs = renderAttrs(node.attrs)
      return `<line x1="${node.x1}" y1="${node.y1}" x2="${node.x2}" y2="${node.y2}"${attrs}/>`
    }

    case 'text': {
      const a = node.attrs
      let attrs = renderAttrs(a)
      if (a) {
        if ('textAnchor' in a && a.textAnchor) attrs += ` text-anchor="${a.textAnchor}"`
        if ('dominantBaseline' in a && a.dominantBaseline) attrs += ` dominant-baseline="${a.dominantBaseline}"`
        if ('fontSize' in a && a.fontSize) attrs += ` font-size="${a.fontSize}"`
        if ('fontFamily' in a && a.fontFamily) attrs += ` font-family="${escapeAttr(a.fontFamily as string)}"`
        if ('fontWeight' in a && a.fontWeight) attrs += ` font-weight="${a.fontWeight}"`
      }
      return `<text x="${node.x}" y="${node.y}"${attrs}>${escapeXml(node.content)}</text>`
    }

    case 'clipPath': {
      const children = node.children.map(nodeToString).join('')
      return `<clipPath id="${escapeAttr(node.id)}">${children}</clipPath>`
    }

    case 'defs': {
      const children = node.children.map(nodeToString).join('')
      return `<defs>${children}</defs>`
    }
  }
}

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

const SKIP_KEYS = new Set([
  'textAnchor', 'dominantBaseline', 'fontSize', 'fontFamily', 'fontWeight', 'rx', 'ry',
])

function renderAttrs(attrs?: RenderAttrs): string {
  if (!attrs) return ''
  let result = ''

  for (const [key, value] of Object.entries(attrs)) {
    if (value == null) continue
    if (SKIP_KEYS.has(key)) continue

    if (key === 'clipPath') {
      result += ` clip-path="url(#${escapeAttr(String(value))})"`
    } else if (key.startsWith('data-')) {
      result += ` ${key}="${escapeAttr(String(value))}"`
    } else if (ATTR_MAP[key]) {
      result += ` ${ATTR_MAP[key]}="${escapeAttr(String(value))}"`
    }
  }

  return result
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
