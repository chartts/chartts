/**
 * Chartts constants and default values.
 *
 * RULES:
 * - Imports ONLY from types.ts.
 * - Single source of truth for all default values.
 * - Colors use var(--color-*) with hex fallbacks — Tailwind-first.
 * - Every other module reads defaults from here. No duplicates.
 */

import type { ThemeConfig, ResolvedOptions, ChartOptions } from './types'

// ---------------------------------------------------------------------------
// CSS custom property prefix
// ---------------------------------------------------------------------------

export const CSS_PREFIX = '--chartts' as const

// ---------------------------------------------------------------------------
// Color palette — Tailwind CSS var() references with hex fallbacks
//
// Tailwind v4: exposes --color-blue-500 etc. automatically.
// Tailwind v3: @chartts/tailwind plugin bridges the gap.
// No Tailwind: hex fallbacks work perfectly on their own.
// ---------------------------------------------------------------------------

export const PALETTE = [
  'var(--color-blue-500, #3b82f6)',
  'var(--color-red-500, #ef4444)',
  'var(--color-emerald-500, #10b981)',
  'var(--color-amber-500, #f59e0b)',
  'var(--color-violet-500, #8b5cf6)',
  'var(--color-pink-500, #ec4899)',
  'var(--color-cyan-500, #06b6d4)',
  'var(--color-lime-500, #84cc16)',
  'var(--color-orange-500, #f97316)',
  'var(--color-indigo-500, #6366f1)',
] as const

// ---------------------------------------------------------------------------
// Font stack
// ---------------------------------------------------------------------------

export const FONT_FAMILY =
  'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif)'

// ---------------------------------------------------------------------------
// Theme presets
// ---------------------------------------------------------------------------

export const LIGHT_THEME: ThemeConfig = {
  colors: [...PALETTE],
  background: 'transparent',
  textColor: 'var(--color-gray-800, #1f2937)',
  textMuted: 'var(--color-gray-500, #6b7280)',
  axisColor: 'var(--color-gray-300, #d1d5db)',
  gridColor: 'var(--color-gray-200, #e5e7eb)',
  tooltipBackground: 'var(--color-white, #ffffff)',
  tooltipText: 'var(--color-gray-800, #1f2937)',
  tooltipBorder: 'var(--color-gray-200, #e5e7eb)',
  fontFamily: FONT_FAMILY,
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 8,
  gridStyle: 'dashed',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 4,
  lineWidth: 2.5,
}

export const DARK_THEME: ThemeConfig = {
  colors: [...PALETTE],
  background: 'transparent',
  textColor: 'var(--color-gray-100, #f3f4f6)',
  textMuted: 'var(--color-gray-500, #6b7280)',
  axisColor: 'var(--color-gray-700, #374151)',
  gridColor: 'var(--color-gray-800, #1f2937)',
  tooltipBackground: 'var(--color-gray-900, #111827)',
  tooltipText: 'var(--color-gray-100, #f3f4f6)',
  tooltipBorder: 'var(--color-gray-700, #374151)',
  fontFamily: FONT_FAMILY,
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 8,
  gridStyle: 'dashed',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 4,
  lineWidth: 2.5,
}

// ---------------------------------------------------------------------------
// Chart type classification sets
// ---------------------------------------------------------------------------

/** Chart types that suppress axes/grid and render their own layout. */
export const NO_AXES_TYPES = new Set([
  'sparkline', 'gauge', 'funnel', 'radar', 'pie', 'donut',
  'heatmap', 'horizontal-bar', 'treemap', 'polar',
  'radial-bar', 'bullet', 'dumbbell', 'calendar', 'sankey',
  'sunburst', 'tree', 'graph', 'parallel', 'themeriver',
  'pictorialbar', 'chord', 'geo', 'lines', 'matrix', 'custom',
  'kagi', 'renko', 'pack', 'voronoi', 'wordcloud',
])

/** Chart types that use band mode for the x-scale. */
export const BAND_SCALE_TYPES = new Set([
  'bar', 'stacked-bar', 'horizontal-bar', 'candlestick',
  'waterfall', 'histogram', 'boxplot', 'lollipop', 'combo',
  'ohlc', 'volume', 'violin',
])

// ---------------------------------------------------------------------------
// Default options resolver
// ---------------------------------------------------------------------------

export function resolveOptions(
  opts: ChartOptions,
  seriesCount: number,
): ResolvedOptions {
  const multi = seriesCount > 1

  // Spread original opts first so chart-type-specific properties (ohlc, sizes,
  // totals, gaugeMin, etc.) survive into RenderContext.options.
  return {
    ...opts,
    width: opts.width ?? 0,
    height: opts.height ?? 0,
    padding: opts.padding ?? [12, 16, 8, 8],
    renderer: opts.renderer ?? 'svg',
    theme: opts.theme ?? 'auto',

    xLabel: opts.xLabel ?? '',
    yLabel: opts.yLabel ?? '',
    xFormat: opts.xFormat ?? formatX,
    yFormat: opts.yFormat ?? formatY,
    xGrid: opts.xGrid ?? false,
    yGrid: opts.yGrid ?? true,
    xAxis: opts.xAxis ?? true,
    yAxis: opts.yAxis ?? true,
    xTicks: opts.xTicks ?? 0,
    yTicks: opts.yTicks ?? 5,
    yMin: opts.yMin,
    yMax: opts.yMax,

    legend: opts.legend === undefined
      ? (multi ? 'top' : false)
      : opts.legend === true ? 'top' : opts.legend,
    tooltip: opts.tooltip === undefined || opts.tooltip === true
      ? { enabled: true }
      : opts.tooltip === false ? false : opts.tooltip,

    animate: opts.animate ?? true,
    duration: opts.duration ?? 300,

    zoom: opts.zoom ?? false,
    pan: opts.pan ?? false,
    crosshair: !opts.crosshair
      ? false
      : opts.crosshair === true
        ? { enabled: true, mode: 'vertical' as const }
        : { enabled: opts.crosshair.enabled ?? true, mode: opts.crosshair.mode ?? 'vertical' as const },
    brush: opts.brush ?? false,

    colors: opts.colors ?? [...PALETTE],
    fontFamily: opts.fontFamily ?? FONT_FAMILY,
    fontSize: opts.fontSize ?? 12,
    curve: opts.curve ?? 'monotone',
    barRadius: opts.barRadius ?? 4,
    barGap: opts.barGap ?? 0.2,

    ariaLabel: opts.ariaLabel ?? 'Chart',
    ariaDescription: opts.ariaDescription ?? '',

    onClick: opts.onClick,
    onHover: opts.onHover,

    className: opts.className ?? '',
  }
}

// ---------------------------------------------------------------------------
// Default formatters
// ---------------------------------------------------------------------------

function formatX(value: string | number | Date): string {
  if (value instanceof Date) return value.toLocaleDateString()
  return String(value)
}

function formatY(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1e12) return trim(value / 1e12, 'T')
  if (abs >= 1e9) return trim(value / 1e9, 'B')
  if (abs >= 1e6) return trim(value / 1e6, 'M')
  if (abs >= 1e3) return trim(value / 1e3, 'K')
  if (Number.isInteger(value)) return String(value)
  return value.toFixed(1)
}

/** Format with suffix, dropping trailing .0 (e.g. 1.0K → 1K) */
function trim(v: number, suffix: string): string {
  const s = v.toFixed(1)
  return (s.endsWith('.0') ? s.slice(0, -2) : s) + suffix
}
