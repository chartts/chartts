import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareNoAxes } from '../../utils/prepare'
import { group, path, text } from '../../render/tree'

/**
 * Voronoi chart — weighted tessellation where cell AREA is proportional to value.
 *
 * Uses a power diagram: the bisector between two seeds shifts toward the
 * lighter seed, giving heavier seeds (higher values) larger cells.
 * Labels are the cell names, series[0] values control cell size.
 */
export const voronoiChartType: ChartTypePlugin = {
  type: 'voronoi',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme, options } = ctx
    const nodes: RenderNode[] = []

    const series = data.series[0]
    if (!series || series.values.length === 0) return nodes

    const n = series.values.length
    const values = series.values
    const minVal = Math.min(...values)
    const maxVal = Math.max(...values)
    const range = maxVal - minVal || 1

    // Compute weights from values — higher value = higher weight = larger cell
    const weights = values.map(v => ((v - minVal) / range))

    // Distribute seed points using Fibonacci for even initial spacing
    const seeds = fibonacciSeeds(n, area)

    // Compute weighted Voronoi cells (power diagram)
    const cells = computeWeightedVoronoi(seeds, weights, area)

    const padding = 3

    for (let i = 0; i < n; i++) {
      const cell = cells[i]
      if (!cell || cell.length < 3) continue

      const t = weights[i]!
      const label = String(data.labels[i] ?? `${i}`)
      const color = options.colors[i % options.colors.length] ?? '#3b82f6'
      const opacity = 0.25 + t * 0.65

      // Shrink cell toward centroid for visual padding
      const centroid = cell.reduce(
        (acc, p) => ({ x: acc.x + p.x / cell.length, y: acc.y + p.y / cell.length }),
        { x: 0, y: 0 },
      )
      const paddedCell = cell.map(p => {
        const dx = p.x - centroid.x
        const dy = p.y - centroid.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const shrink = Math.min(padding / dist, 0.3)
        return { x: p.x - dx * shrink, y: p.y - dy * shrink }
      })

      const d = paddedCell.map((p, j) => `${j === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

      const cellNodes: RenderNode[] = []

      cellNodes.push(path(d, {
        class: 'chartts-voronoi-cell',
        fill: color,
        fillOpacity: opacity,
        stroke: theme.background,
        strokeWidth: 2,
        style: `--chartts-i:${i}`,
        'data-series': 0,
        'data-index': i,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${label}: ${values[i]}`,
      }))

      // Label at centroid
      if (n <= 20) {
        const cellArea = polygonArea(paddedCell)
        const minCellDim = Math.sqrt(cellArea)
        const fontSize = Math.max(8, Math.min(theme.fontSize, minCellDim * 0.2))

        cellNodes.push(text(centroid.x, centroid.y - fontSize * 0.4, label, {
          class: 'chartts-voronoi-label',
          fill: theme.textColor,
          textAnchor: 'middle',
          dominantBaseline: 'auto',
          fontSize,
          fontFamily: theme.fontFamily,
          fontWeight: 600,
          pointerEvents: 'none',
        }))

        // Value below label
        if (minCellDim > 40) {
          cellNodes.push(text(centroid.x, centroid.y + fontSize * 0.7, String(values[i]), {
            class: 'chartts-voronoi-value',
            fill: theme.textMuted,
            textAnchor: 'middle',
            dominantBaseline: 'auto',
            fontSize: fontSize * 0.8,
            fontFamily: theme.fontFamily,
            pointerEvents: 'none',
          }))
        }
      }

      nodes.push(group(cellNodes, {
        class: `chartts-series chartts-series-${i}`,
        'data-series-name': label,
      }))
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area } = ctx
    const series = data.series[0]
    if (!series || series.values.length === 0) return null

    const values = series.values
    const minVal = Math.min(...values)
    const maxVal = Math.max(...values)
    const range = maxVal - minVal || 1
    const weights = values.map(v => ((v - minVal) / range))

    const seeds = fibonacciSeeds(values.length, area)
    const cells = computeWeightedVoronoi(seeds, weights, area)

    // Point-in-polygon test on each cell
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i]
      if (!cell || cell.length < 3) continue
      if (pointInPolygon(mx, my, cell)) {
        const centroid = cell.reduce(
          (acc, p) => ({ x: acc.x + p.x / cell.length, y: acc.y + p.y / cell.length }),
          { x: 0, y: 0 },
        )
        return { seriesIndex: 0, pointIndex: i, distance: 0, x: centroid.x, y: centroid.y }
      }
    }

    return null
  },
}

interface Pt { x: number; y: number }

/** Ray-casting point-in-polygon test. */
function pointInPolygon(px: number, py: number, poly: Pt[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!, b = poly[j]!
    if ((a.y > py) !== (b.y > py) &&
        px < (b.x - a.x) * (py - a.y) / (b.y - a.y) + a.x) {
      inside = !inside
    }
  }
  return inside
}

/** Scale factor for weights based on chart area. */
function weightScale(area: { width: number; height: number }): number {
  return (area.width * area.height) * 0.15
}

/** Fibonacci/sunflower seed distribution for even spacing. */
function fibonacciSeeds(n: number, area: { x: number; y: number; width: number; height: number }): Pt[] {
  const cx = area.x + area.width / 2
  const cy = area.y + area.height / 2
  const maxR = Math.min(area.width, area.height) * 0.45
  const golden = (1 + Math.sqrt(5)) / 2
  const pts: Pt[] = []

  for (let i = 0; i < n; i++) {
    const r = maxR * Math.sqrt((i + 0.5) / n)
    const theta = 2 * Math.PI * i / (golden * golden)
    pts.push({
      x: cx + r * Math.cos(theta) * (area.width / Math.min(area.width, area.height)),
      y: cy + r * Math.sin(theta) * (area.height / Math.min(area.width, area.height)),
    })
  }

  return pts
}

/**
 * Compute weighted Voronoi cells (power diagram).
 *
 * Instead of clipping at the perpendicular bisector (equidistant line),
 * we shift the bisector toward the lighter seed. For seeds i and j with
 * weights wi and wj, the dividing plane shifts along the i→j axis by:
 *   shift = (wi - wj) * scale / (2 * |si - sj|)
 * This gives heavier seeds proportionally larger cells.
 */
function computeWeightedVoronoi(
  seeds: Pt[],
  weights: number[],
  area: { x: number; y: number; width: number; height: number },
): Pt[][] {
  const cells: Pt[][] = []
  const { x: ax, y: ay, width: aw, height: ah } = area
  const wScale = weightScale(area)

  for (let i = 0; i < seeds.length; i++) {
    let polygon: Pt[] = [
      { x: ax, y: ay },
      { x: ax + aw, y: ay },
      { x: ax + aw, y: ay + ah },
      { x: ax, y: ay + ah },
    ]

    const si = seeds[i]!
    const wi = weights[i]!

    for (let j = 0; j < seeds.length; j++) {
      if (i === j) continue
      const sj = seeds[j]!
      const wj = weights[j]!

      // Direction from j to i
      const dx = si.x - sj.x
      const dy = si.y - sj.y
      const len2 = dx * dx + dy * dy
      if (len2 === 0) continue
      const len = Math.sqrt(len2)

      // Shift bisector toward the lighter seed
      // Positive shift = toward sj = seed i gets more area
      const shift = (wi - wj) * wScale / (2 * len2)

      // Shifted midpoint
      const mx = (si.x + sj.x) / 2 + dx * shift
      const my = (si.y + sj.y) / 2 + dy * shift

      // Normal pointing toward seed i
      const nx = dx / len
      const ny = dy / len

      polygon = clipPolygon(polygon, mx, my, nx, ny)
      if (polygon.length < 3) break
    }

    cells.push(polygon)
  }

  return cells
}

/** Approximate polygon area via shoelace formula. */
function polygonArea(pts: Pt[]): number {
  let area = 0
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!
    const b = pts[(i + 1) % pts.length]!
    area += a.x * b.y - b.x * a.y
  }
  return Math.abs(area) / 2
}

/** Sutherland-Hodgman clip: keep the side where dot(p - m, n) >= 0. */
function clipPolygon(poly: Pt[], mx: number, my: number, nx: number, ny: number): Pt[] {
  if (poly.length < 3) return poly
  const out: Pt[] = []

  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!
    const b = poly[(i + 1) % poly.length]!
    const da = (a.x - mx) * nx + (a.y - my) * ny
    const db = (b.x - mx) * nx + (b.y - my) * ny

    if (da >= 0) out.push(a)
    if ((da >= 0) !== (db >= 0)) {
      const t = da / (da - db)
      out.push({ x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) })
    }
  }

  return out
}
