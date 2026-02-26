import type { RenderNode, ThemeConfig } from '../types'
import { group, rect, text } from './tree'

/**
 * Render an "empty data" placeholder inside the chart area.
 */
export function renderEmptyState(
  width: number,
  height: number,
  theme: ThemeConfig,
  message = 'No data to display',
): RenderNode[] {
  const cx = width / 2
  const cy = height / 2

  return [group([
    // Empty chart icon — simple bar chart outline
    ...emptyBars(cx, cy - 16, theme),
    // Message
    text(cx, cy + 28, message, {
      class: 'chartts-state-text',
      fill: theme.textMuted,
      textAnchor: 'middle',
      dominantBaseline: 'middle',
      fontSize: theme.fontSize,
      fontFamily: theme.fontFamily,
    }),
  ], { class: 'chartts-state chartts-state-empty' })]
}

/**
 * Render a loading skeleton with animated shimmer bars.
 */
export function renderLoadingState(
  width: number,
  height: number,
  theme: ThemeConfig,
): RenderNode[] {
  const barCount = 5
  const padding = width * 0.15
  const barAreaW = width - padding * 2
  const barW = barAreaW / barCount * 0.6
  const gap = barAreaW / barCount * 0.4
  const maxH = height * 0.6
  const baseY = height * 0.8

  const bars: RenderNode[] = []
  const heights = [0.6, 0.85, 0.45, 0.95, 0.7]

  for (let i = 0; i < barCount; i++) {
    const x = padding + i * (barW + gap)
    const h = maxH * heights[i]!
    const y = baseY - h

    bars.push(rect(x, y, barW, h, {
      class: 'chartts-skeleton-bar',
      fill: theme.gridColor,
      rx: 3,
      ry: 3,
      opacity: 0.6,
    }))
  }

  // Baseline
  bars.push(rect(padding, baseY, barAreaW, 1, {
    fill: theme.axisColor,
    opacity: 0.4,
  }))

  return [group(bars, { class: 'chartts-state chartts-state-loading' })]
}

/**
 * Render an error state with message.
 */
export function renderErrorState(
  width: number,
  height: number,
  theme: ThemeConfig,
  message = 'Failed to render chart',
): RenderNode[] {
  const cx = width / 2
  const cy = height / 2

  return [group([
    // Error icon — circle with exclamation
    ...errorIcon(cx, cy - 18, theme),
    // Message
    text(cx, cy + 24, message, {
      class: 'chartts-state-text',
      fill: theme.textMuted,
      textAnchor: 'middle',
      dominantBaseline: 'middle',
      fontSize: theme.fontSize,
      fontFamily: theme.fontFamily,
    }),
  ], { class: 'chartts-state chartts-state-error' })]
}

/** Small bar chart icon for empty state */
function emptyBars(cx: number, cy: number, theme: ThemeConfig): RenderNode[] {
  const barW = 6
  const gap = 4
  const heights = [14, 22, 10, 18]
  const totalW = heights.length * barW + (heights.length - 1) * gap
  const startX = cx - totalW / 2

  return heights.map((h, i) =>
    rect(startX + i * (barW + gap), cy - h / 2, barW, h, {
      fill: theme.gridColor,
      rx: 1,
      ry: 1,
    }),
  )
}

/** Circle with "!" for error state */
function errorIcon(cx: number, cy: number, theme: ThemeConfig): RenderNode[] {
  return [
    // Circle outline
    rect(cx - 14, cy - 14, 28, 28, {
      fill: 'none',
      stroke: theme.textMuted,
      strokeWidth: 1.5,
      rx: 14,
      ry: 14,
      opacity: 0.6,
    }),
    // Exclamation line
    rect(cx - 1, cy - 7, 2, 10, {
      fill: theme.textMuted,
      opacity: 0.6,
    }),
    // Exclamation dot
    rect(cx - 1, cy + 5, 2, 2, {
      fill: theme.textMuted,
      opacity: 0.6,
    }),
  ]
}
