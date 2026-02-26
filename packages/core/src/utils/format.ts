/**
 * Shared number formatting for SVG path data strings.
 * Outputs integers as-is, decimals with 2 decimal places.
 */
export function formatNum(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(2)
}

/**
 * Human-readable value formatter with SI suffixes.
 * 1500 → "1.5K", 2000000 → "2M", 3000000000 → "3B"
 */
export function formatValue(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1e12) return trimSuffix(value / 1e12, 'T')
  if (abs >= 1e9) return trimSuffix(value / 1e9, 'B')
  if (abs >= 1e6) return trimSuffix(value / 1e6, 'M')
  if (abs >= 1e3) return trimSuffix(value / 1e3, 'K')
  if (Number.isInteger(value)) return String(value)
  return value.toFixed(1)
}

/**
 * Percentage formatter: 0.75 → "75%", 42 → "42%"
 * Values <= 1 are treated as ratios and multiplied by 100.
 */
export function formatPercent(value: number): string {
  const v = Math.abs(value) <= 1 ? value * 100 : value
  const s = v.toFixed(1)
  return (s.endsWith('.0') ? s.slice(0, -2) : s) + '%'
}

function trimSuffix(v: number, suffix: string): string {
  const s = v.toFixed(1)
  return (s.endsWith('.0') ? s.slice(0, -2) : s) + suffix
}
