import type { Scale, Tick } from '../types'
import { niceRange, generateTicks } from './nice'

export interface LinearScaleOpts {
  domain?: [number, number]
  range?: [number, number]
  nice?: boolean
  clamp?: boolean
  format?: (value: number) => string
}

export function createLinearScale(opts?: LinearScaleOpts): Scale {
  let dMin = opts?.domain?.[0] ?? 0
  let dMax = opts?.domain?.[1] ?? 1
  let rMin = opts?.range?.[0] ?? 0
  let rMax = opts?.range?.[1] ?? 1
  const useNice = opts?.nice ?? true
  const clamp = opts?.clamp ?? false
  const fmt = opts?.format ?? defaultFmt

  // When nice is enabled, adjust the domain to nice values
  // so ticks always map within the chart area
  if (useNice && dMin !== dMax) {
    const { min, max } = niceRange(dMin, dMax, 5)
    dMin = min
    dMax = max
  }

  function map(value: number | string | Date): number {
    const v = Number(value)
    const span = dMax - dMin
    if (span === 0) return (rMin + rMax) / 2
    let t = (v - dMin) / span
    if (clamp) t = Math.max(0, Math.min(1, t))
    return round2(rMin + t * (rMax - rMin))
  }

  function invert(px: number): number {
    const span = rMax - rMin
    if (span === 0) return (dMin + dMax) / 2
    return dMin + ((px - rMin) / span) * (dMax - dMin)
  }

  function ticks(count = 5): Tick[] {
    const { min, max, spacing } = niceRange(dMin, dMax, count)
    const vals = generateTicks(useNice ? min : dMin, useNice ? max : dMax, spacing)
    return vals.map((v) => ({ value: v, position: map(v), label: fmt(v) }))
  }

  return {
    map,
    invert,
    ticks,
    setDomain(min, max) { dMin = Number(min); dMax = Number(max) },
    setRange(min, max) { rMin = min; rMax = max },
    getDomain() { return [dMin, dMax] },
    getRange() { return [rMin, rMax] },
    bandwidth() { return 0 },
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function defaultFmt(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1e12) return trimSuffix(v / 1e12, 'T')
  if (abs >= 1e9) return trimSuffix(v / 1e9, 'B')
  if (abs >= 1e6) return trimSuffix(v / 1e6, 'M')
  if (abs >= 1e3) return trimSuffix(v / 1e3, 'K')
  if (Number.isInteger(v)) return String(v)
  return v.toFixed(1)
}

function trimSuffix(v: number, suffix: string): string {
  const s = v.toFixed(1)
  return (s.endsWith('.0') ? s.slice(0, -2) : s) + suffix
}
