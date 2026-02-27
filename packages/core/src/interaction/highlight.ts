import type { RenderContext, RenderNode, HitResult, ThemeConfig } from '../types'
import { circle } from '../render/tree'

/**
 * Default highlight nodes: glow ring + solid dot at hit.x, hit.y.
 * Used when the chart type doesn't implement getHighlightNodes.
 */
export function defaultHighlightNodes(hit: HitResult, ctx: RenderContext): RenderNode[] {
  const color = resolveHighlightColor(ctx.data.series[hit.seriesIndex]?.color, ctx.theme)
  const r = ctx.theme.pointRadius

  return [
    // Outer glow
    circle(hit.x, hit.y, r * 3, {
      class: 'chartts-highlight-glow',
      fill: color,
      fillOpacity: 0.2,
    }),
    // Solid dot
    circle(hit.x, hit.y, r + 1, {
      class: 'chartts-highlight-dot',
      fill: color,
      stroke: ctx.theme.background === 'transparent' ? '#fff' : ctx.theme.background,
      strokeWidth: 2,
    }),
  ]
}

/**
 * Walk a RenderNode tree and dim all series groups except the active one.
 * Returns a new tree (immutable).
 */
export function applyDimming(nodes: RenderNode[], hit: HitResult): RenderNode[] {
  return nodes.map(node => dimNode(node, hit.seriesIndex))
}

function dimNode(node: RenderNode, activeSeriesIndex: number): RenderNode {
  if (node.type === 'group') {
    const cls = node.attrs?.class ?? ''
    // Match chartts-series-N pattern
    const seriesMatch = cls.match(/chartts-series-(\d+)/)
    if (seriesMatch) {
      const idx = parseInt(seriesMatch[1]!, 10)
      if (idx !== activeSeriesIndex) {
        return {
          ...node,
          attrs: { ...node.attrs, opacity: 0.3 },
          children: node.children,
        }
      }
    }
    // Recurse into children
    return {
      ...node,
      children: node.children.map(c => dimNode(c, activeSeriesIndex)),
    }
  }
  return node
}

/**
 * Extract a usable hex/rgb color from a CSS var string like 'var(--color-blue-500, #3b82f6)'.
 */
export function resolveHighlightColor(cssVarString: string | undefined, theme: ThemeConfig): string {
  if (!cssVarString) return theme.colors[0] ?? '#3b82f6'
  // Try to extract fallback from var(--token, #hex)
  const m = cssVarString.match(/,\s*([^)]+)\)/)
  if (m) return m[1]!.trim()
  // If it's already a plain color
  if (cssVarString.startsWith('#') || cssVarString.startsWith('rgb')) return cssVarString
  // Fallback
  return theme.colors[0] ?? '#3b82f6'
}
