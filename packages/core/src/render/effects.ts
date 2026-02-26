/**
 * SVG gradient and filter definitions for premium visual effects.
 *
 * Generated per-chart based on the resolved color palette.
 * Injected into <defs> by both the DOM and string renderers.
 */

/**
 * Extract a hex color from a CSS var() expression.
 * 'var(--color-blue-500, #3b82f6)' → '#3b82f6'
 * '#3b82f6' → '#3b82f6'
 */
function extractHex(css: string): string {
  const match = css.match(/#[0-9a-fA-F]{3,8}/)
  return match ? match[0] : css
}

/**
 * Parse hex color to {r, g, b}
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  const full = h.length === 3
    ? h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]!
    : h
  return {
    r: parseInt(full.substring(0, 2), 16),
    g: parseInt(full.substring(2, 4), 16),
    b: parseInt(full.substring(4, 6), 16),
  }
}

/**
 * Generate SVG defs string with gradients and filters for chart effects.
 */
export function createEffectDefs(colors: string[]): string {
  let svg = ''

  for (let i = 0; i < colors.length; i++) {
    const hex = extractHex(colors[i]!)
    const { r, g, b } = hexToRgb(hex)
    const rgba = (a: number) => `rgba(${r},${g},${b},${a})`

    // Area fill gradient (vertical: color at top → transparent at bottom)
    svg += `<linearGradient id="chartts-area-${i}" x1="0" y1="0" x2="0" y2="1">`
    svg += `<stop offset="0%" stop-color="${hex}" stop-opacity="0.35"/>`
    svg += `<stop offset="100%" stop-color="${hex}" stop-opacity="0.02"/>`
    svg += `</linearGradient>`

    // Bar gradient (vertical: lighter at top → color at bottom)
    svg += `<linearGradient id="chartts-bar-${i}" x1="0" y1="0" x2="0" y2="1">`
    svg += `<stop offset="0%" stop-color="${hex}" stop-opacity="1"/>`
    svg += `<stop offset="100%" stop-color="${hex}" stop-opacity="0.75"/>`
    svg += `</linearGradient>`

    // Radial glow for points/bubbles
    svg += `<radialGradient id="chartts-pglow-${i}">`
    svg += `<stop offset="0%" stop-color="${hex}" stop-opacity="0.4"/>`
    svg += `<stop offset="100%" stop-color="${hex}" stop-opacity="0"/>`
    svg += `</radialGradient>`

    // Pie slice radial gradient (center lighter → edge)
    svg += `<radialGradient id="chartts-pie-${i}" cx="30%" cy="30%" r="70%">`
    svg += `<stop offset="0%" stop-color="${hex}" stop-opacity="1"/>`
    svg += `<stop offset="100%" stop-color="${rgba(0.85)}"/>`
    svg += `</radialGradient>`
  }

  // Line glow filter
  svg += `<filter id="chartts-glow" filterUnits="userSpaceOnUse">`
  svg += `<feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur"/>`
  svg += `<feColorMatrix in="blur" type="saturate" values="2" result="saturated"/>`
  svg += `<feMerge><feMergeNode in="saturated"/><feMergeNode in="SourceGraphic"/></feMerge>`
  svg += `</filter>`

  // Drop shadow filter (for tooltips, floating elements)
  svg += `<filter id="chartts-shadow">`
  svg += `<feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.12"/>`
  svg += `</filter>`

  return svg
}
