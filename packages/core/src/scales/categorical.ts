import type { Scale, Tick } from '../types'

export interface CategoricalScaleOpts {
  categories?: (string | number | Date)[]
  range?: [number, number]
  format?: (value: string | number | Date) => string
  /**
   * When true, distributes categories into equal-width bands with
   * each category centered in its band. This prevents items at
   * the edges from overflowing the chart area (critical for bar charts).
   * When false (default), positions are edge-to-edge.
   */
  band?: boolean
}

export function createCategoricalScale(opts?: CategoricalScaleOpts): Scale & {
  setCategories(cats: (string | number | Date)[]): void
  /** Get the width of one band (only meaningful in band mode) */
  bandwidth(): number
} {
  let cats: (string | number | Date)[] = opts?.categories ?? []
  let rMin = opts?.range?.[0] ?? 0
  let rMax = opts?.range?.[1] ?? 1
  const fmt = opts?.format ?? String
  const useBand = opts?.band ?? false

  function round2(n: number): number {
    return Math.round(n * 100) / 100
  }

  function pos(index: number): number {
    const n = cats.length
    if (n === 0) return round2((rMin + rMax) / 2)
    if (useBand) {
      const slotWidth = (rMax - rMin) / n
      return round2(rMin + (index + 0.5) * slotWidth)
    }
    if (n <= 1) return round2((rMin + rMax) / 2)
    return round2(rMin + (index / (n - 1)) * (rMax - rMin))
  }

  function bandwidth(): number {
    const n = cats.length
    if (n === 0) return 0
    if (useBand) return (rMax - rMin) / n
    // For point mode, approximate bandwidth from spacing
    if (n <= 1) return rMax - rMin
    return (rMax - rMin) / (n - 1)
  }

  function map(value: number | string | Date): number {
    if (typeof value === 'number' && Number.isFinite(value)) return pos(value)

    const idx = cats.findIndex((c) =>
      c instanceof Date && value instanceof Date
        ? c.getTime() === value.getTime()
        : String(c) === String(value),
    )
    return idx === -1 ? (rMin + rMax) / 2 : pos(idx)
  }

  function invert(px: number): number {
    const n = cats.length
    if (n === 0) return 0
    if (useBand) {
      const slotWidth = (rMax - rMin) / n
      return Math.floor((px - rMin) / slotWidth)
    }
    if (n <= 1) return 0
    const t = (px - rMin) / (rMax - rMin)
    return Math.round(t * (n - 1))
  }

  function ticks(): Tick[] {
    return cats.map((c, i) => ({ value: c, position: pos(i), label: fmt(c) }))
  }

  return {
    map,
    invert,
    ticks,
    setDomain() {},
    setRange(min, max) { rMin = min; rMax = max },
    getDomain() { return [cats[0] ?? '', cats[cats.length - 1] ?? ''] },
    getRange() { return [rMin, rMax] },
    setCategories(c) { cats = c },
    bandwidth,
  }
}
