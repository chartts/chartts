import type { Scale, Tick } from '../types'

export interface TimeScaleOpts {
  domain?: [number | Date, number | Date]
  range?: [number, number]
  format?: (value: Date) => string
}

const S = 1000, M = 60 * S, H = 60 * M, D = 24 * H, W = 7 * D, MO = 30 * D, Y = 365 * D

const INTERVALS: { ms: number; fmt: (d: Date) => string }[] = [
  { ms: S,      fmt: fmtTime },
  { ms: 5 * S,  fmt: fmtTime },
  { ms: 15 * S, fmt: fmtTime },
  { ms: 30 * S, fmt: fmtTime },
  { ms: M,      fmt: fmtTime },
  { ms: 5 * M,  fmt: fmtTime },
  { ms: 15 * M, fmt: fmtTime },
  { ms: H,      fmt: fmtTime },
  { ms: 3 * H,  fmt: fmtTime },
  { ms: 6 * H,  fmt: fmtTime },
  { ms: 12 * H, fmt: fmtTime },
  { ms: D,      fmt: fmtDate },
  { ms: W,      fmt: fmtDate },
  { ms: MO,     fmt: fmtMonthYear },
  { ms: 3 * MO, fmt: fmtMonthYear },
  { ms: 6 * MO, fmt: fmtMonthYear },
  { ms: Y,      fmt: fmtYear },
  { ms: 5 * Y,  fmt: fmtYear },
  { ms: 10 * Y, fmt: fmtYear },
]

export function createTimeScale(opts?: TimeScaleOpts): Scale {
  let dMin = ts(opts?.domain?.[0] ?? 0)
  let dMax = ts(opts?.domain?.[1] ?? Date.now())
  let rMin = opts?.range?.[0] ?? 0
  let rMax = opts?.range?.[1] ?? 1
  const customFmt = opts?.format

  function map(value: number | string | Date): number {
    const v = ts(value)
    const span = dMax - dMin
    if (span === 0) return (rMin + rMax) / 2
    return rMin + ((v - dMin) / span) * (rMax - rMin)
  }

  function invert(px: number): number {
    const span = rMax - rMin
    if (span === 0) return (dMin + dMax) / 2
    return dMin + ((px - rMin) / span) * (dMax - dMin)
  }

  function ticks(count = 6): Tick[] {
    const span = dMax - dMin
    if (span <= 0) return []

    const target = span / count
    const interval = INTERVALS.find((i) => i.ms >= target) ?? INTERVALS[INTERVALS.length - 1]!
    const fmt = customFmt ?? interval.fmt
    const result: Tick[] = []
    const start = Math.ceil(dMin / interval.ms) * interval.ms

    for (let t = start; t <= dMax; t += interval.ms) {
      const d = new Date(t)
      result.push({ value: d, position: map(t), label: fmt(d) })
    }
    return result
  }

  return {
    map,
    invert,
    ticks,
    setDomain(min, max) { dMin = ts(min); dMax = ts(max) },
    setRange(min, max) { rMin = min; rMax = max },
    getDomain() { return [new Date(dMin), new Date(dMax)] },
    getRange() { return [rMin, rMax] },
    bandwidth() { return 0 },
  }
}

function ts(v: number | string | Date): number {
  return v instanceof Date ? v.getTime() : typeof v === 'string' ? new Date(v).getTime() : v
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] as const

function pad(n: number): string { return n < 10 ? `0${n}` : String(n) }
function fmtTime(d: Date): string { return `${pad(d.getHours())}:${pad(d.getMinutes())}` }
function fmtDate(d: Date): string { return `${MONTHS[d.getMonth()]} ${d.getDate()}` }
function fmtMonthYear(d: Date): string { return `${MONTHS[d.getMonth()]} ${d.getFullYear()}` }
function fmtYear(d: Date): string { return String(d.getFullYear()) }
