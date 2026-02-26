/**
 * Nice number algorithms for human-readable axis ticks.
 * Produces values like 0, 20, 40, 60, 80, 100 — not 0, 17, 34, 51, 68, 85.
 */

export function niceNumber(value: number, round: boolean): number {
  if (value === 0) return 0
  const exp = Math.floor(Math.log10(Math.abs(value)))
  const frac = value / Math.pow(10, exp)

  let nice: number
  if (round) {
    nice = frac < 1.5 ? 1 : frac < 3 ? 2 : frac < 7 ? 5 : 10
  } else {
    nice = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10
  }

  return nice * Math.pow(10, exp)
}

export function niceRange(
  dataMin: number,
  dataMax: number,
  tickCount: number,
): { min: number; max: number; spacing: number } {
  if (tickCount < 2) tickCount = 2

  if (dataMin === dataMax) {
    if (dataMin === 0) return { min: 0, max: 1, spacing: 0.2 }
    const pad = Math.abs(dataMin) * 0.1 || 1
    return niceRange(dataMin - pad, dataMax + pad, tickCount)
  }

  const range = niceNumber(dataMax - dataMin, false)
  const spacing = niceNumber(range / (tickCount - 1), true)
  const min = Math.floor(dataMin / spacing) * spacing
  const max = Math.ceil(dataMax / spacing) * spacing

  return { min, max, spacing }
}

export function generateTicks(min: number, max: number, spacing: number): number[] {
  if (spacing <= 0) return [min]

  const ticks: number[] = []
  const eps = spacing * 1e-10

  for (let v = min; v <= max + eps; v += spacing) {
    ticks.push(Math.round(v * 1e12) / 1e12)
  }
  return ticks
}
