import type { RenderNode, PreparedData, ResolvedOptions, ChartArea, ThemeConfig } from '../types'
import { CSS_PREFIX } from '../constants'
import { group, circle, text } from '../render/tree'

/**
 * Render legend — series names with color indicators.
 * Positioned based on options.legend (top, bottom, left, right).
 */
export function renderLegend(
  data: PreparedData,
  area: ChartArea,
  options: ResolvedOptions,
  theme: ThemeConfig,
): RenderNode | null {
  if (!options.legend || data.series.length <= 1) return null

  const items: RenderNode[] = []
  const pos = options.legend

  if (pos === 'top' || pos === 'bottom') {
    // Horizontal layout — centered above or below chart area
    const totalWidth = estimateLegendWidth(data, theme)
    let x = area.x + Math.max(0, (area.width - totalWidth) / 2)
    const y = pos === 'top' ? area.y - 10 : area.y + area.height + 32

    for (const series of data.series) {
      // Color dot
      items.push(circle(x + 4, y, 3.5, {
        class: 'chartts-legend-dot',
        fill: series.color,
      }))

      // Series name
      items.push(text(x + 12, y, series.name, {
        class: 'chartts-legend-text',
        fill: `var(${CSS_PREFIX}-text-muted)`,
        dominantBaseline: 'central',
        fontSize: theme.fontSizeSmall,
        fontFamily: `var(${CSS_PREFIX}-font-family)`,
      }))

      // Advance x position (estimate width from name length)
      x += 12 + series.name.length * (theme.fontSizeSmall * 0.58) + 14
    }
  } else {
    // Vertical layout (left or right)
    const x = pos === 'left' ? 8 : area.x + area.width + 16
    let y = area.y + 4

    for (const series of data.series) {
      items.push(circle(x + 4, y + 5, 3.5, {
        class: 'chartts-legend-dot',
        fill: series.color,
      }))

      items.push(text(x + 12, y + 5, series.name, {
        class: 'chartts-legend-text',
        fill: `var(${CSS_PREFIX}-text-muted)`,
        dominantBaseline: 'central',
        fontSize: theme.fontSizeSmall,
        fontFamily: `var(${CSS_PREFIX}-font-family)`,
      }))

      y += 18
    }
  }

  return group(items, {
    class: 'chartts-legend',
    role: 'list',
    ariaLabel: 'Chart legend',
  })
}

function estimateLegendWidth(data: PreparedData, theme: ThemeConfig): number {
  let width = 0
  for (const series of data.series) {
    width += 12 + series.name.length * (theme.fontSizeSmall * 0.58) + 14
  }
  return width
}
