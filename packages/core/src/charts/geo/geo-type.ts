import type {
  ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult,
} from '../../types'
import { defineChartType } from '../../api/define'
import { prepareNoAxes } from '../../utils/prepare'
import { path, rect, circle, text, group } from '../../render/tree'
import { WORLD_REGIONS } from './world-regions'

export interface GeoRegion {
  name: string
  path: string
}

export interface GeoOptions extends ResolvedOptions {
  regions?: GeoRegion[]
  viewBox?: { x: number; y: number; width: number; height: number }
  showLabels?: boolean | 'data'
  scatterSeries?: number
  legendPosition?: 'bottom' | 'none'
}

/** Built-in world map with SVG paths. */
export const WORLD_SIMPLE: GeoRegion[] = WORLD_REGIONS

interface BBox { minX: number; minY: number; maxX: number; maxY: number }

// Caches to avoid recomputing every frame
const centroidCache = new WeakMap<GeoRegion[], Map<string, { x: number; y: number }>>()
const bboxCache = new WeakMap<GeoRegion[], Map<string, BBox>>()

function getCentroids(regions: GeoRegion[]): Map<string, { x: number; y: number }> {
  let cached = centroidCache.get(regions)
  if (cached) return cached
  cached = new Map()
  for (const r of regions) {
    const c = getPathCentroid(r.path)
    if (c) cached.set(r.name, c)
  }
  centroidCache.set(regions, cached)
  return cached
}

function getBBoxes(regions: GeoRegion[]): Map<string, BBox> {
  let cached = bboxCache.get(regions)
  if (cached) return cached
  cached = new Map()
  for (const r of regions) {
    const bb = getPathBBox(r.path)
    if (bb) cached.set(r.name, bb)
  }
  bboxCache.set(regions, cached)
  return cached
}

/** Default viewBox matching Guardian world-map coordinate space. */
const DEFAULT_VB = { x: 0, y: 0, width: 1000, height: 430 }

/** Compute transform params for fitting map into chart area, with optional zoom/pan. */
function computeMapTransform(
  area: { x: number; y: number; width: number; height: number },
  vb: typeof DEFAULT_VB,
  legendHeight: number,
  zp?: { zoomX: number; zoomY: number; panX: number; panY: number },
) {
  const fitHeight = area.height - legendHeight
  const baseScale = Math.min(area.width / vb.width, fitHeight / vb.height) * 0.88

  // Base offsets center the map at zoom=1
  const baseOX = area.x + area.width / 2 - (vb.x + vb.width / 2) * baseScale
  const baseOY = area.y + fitHeight / 2 - (vb.y + vb.height / 2) * baseScale

  const zoom = zp ? Math.max(zp.zoomX, zp.zoomY) : 1
  const scale = baseScale * zoom

  if (!zp || (zoom === 1 && zp.panX === 0 && zp.panY === 0)) {
    return { scale, offsetX: baseOX, offsetY: baseOY }
  }

  // Cursor-relative zoom: keeps the viewBox point under the cursor fixed.
  // Derived from invariant: cursorPx = offset + cursorVx * scale
  // The zoom-pan system encodes cursor position into panX/panY via:
  //   panX = relX - (relX - oldPanX) * zoomRatio
  // This formula correctly resolves both zoom anchoring and drag panning.
  const offsetX = baseOX * zoom + area.x * (1 - zoom) + zp.panX * area.width
  const offsetY = baseOY * zoom + area.y * (1 - zoom) + zp.panY * area.height

  return { scale, offsetX, offsetY }
}

function formatValue(v: number): string {
  if (Math.abs(v) >= 1e12) return (v / 1e12).toFixed(1) + 'T'
  if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(1) + 'B'
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + 'M'
  if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(1) + 'K'
  return v % 1 === 0 ? String(v) : v.toFixed(1)
}

export const geoChartType = defineChartType({
  type: 'geo',
  suppressAxes: true,


  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme, options } = ctx
    const nodes: RenderNode[] = []

    const gOpts = options as GeoOptions
    const regions = gOpts.regions ?? WORLD_SIMPLE
    const showLabels = gOpts.showLabels
    const showLegend = gOpts.legendPosition !== 'none'

    if (regions.length === 0) return nodes

    // Map region names to data values
    const valueMap = new Map<string, number>()
    const series = data.series[0]
    if (series) {
      for (let i = 0; i < data.labels.length; i++) {
        valueMap.set(String(data.labels[i]), series.values[i] ?? 0)
      }
    }

    // Color range
    const values = [...valueMap.values()]
    const minVal = values.length > 0 ? Math.min(...values) : 0
    const maxVal = values.length > 0 ? Math.max(...values) : 1
    const range = maxVal - minVal || 1

    const baseColor = options.colors[0] ?? '#3b82f6'
    const legendH = showLegend && values.length > 0 ? 28 : 0

    // Coordinate system
    const vb = gOpts.viewBox ?? DEFAULT_VB
    const { scale, offsetX, offsetY } = computeMapTransform(area, vb, legendH, ctx.zoomPan)
    const transform = `translate(${offsetX},${offsetY}) scale(${scale})`

    const centroids = getCentroids(regions)

    // Render regions
    for (let i = 0; i < regions.length; i++) {
      const region = regions[i]!
      const val = valueMap.get(region.name)
      const hasData = val !== undefined
      const t = hasData ? (val - minVal) / range : 0
      const fillOpacity = hasData ? 0.2 + t * 0.75 : 0.06

      nodes.push(path(region.path, {
        class: 'chartts-geo-region',
        fill: hasData ? baseColor : theme.gridColor,
        fillOpacity,
        stroke: theme.textMuted,
        strokeWidth: 0.4 / scale,
        transform,
        'data-series': 0,
        'data-index': i,
        'data-name': region.name,
      }))
    }

    // Region labels — only for countries with data by default
    const shouldLabel = showLabels === true ? 'all' : showLabels === 'data' || showLabels === undefined ? 'data' : 'none'
    if (shouldLabel !== 'none' && values.length > 0) {
      const labelNodes: RenderNode[] = []
      const fontSize = Math.max(6, Math.min(9, area.width / 80))

      for (const [name] of valueMap) {
        const centroid = centroids.get(name)
        if (!centroid) continue

        const lx = offsetX + centroid.x * scale
        const ly = offsetY + centroid.y * scale

        labelNodes.push(text(lx, ly, name, {
          class: 'chartts-geo-label',
          fill: theme.textColor,
          textAnchor: 'middle',
          dominantBaseline: 'central',
          fontSize,
          fontFamily: theme.fontFamily,
          fontWeight: 600,
          pointerEvents: 'none',
        }))
      }
      if (shouldLabel === 'all') {
        for (const region of regions) {
          if (valueMap.has(region.name)) continue
          const centroid = centroids.get(region.name)
          if (!centroid) continue
          const lx = offsetX + centroid.x * scale
          const ly = offsetY + centroid.y * scale
          labelNodes.push(text(lx, ly, region.name, {
            class: 'chartts-geo-label',
            fill: theme.textMuted,
            textAnchor: 'middle',
            dominantBaseline: 'central',
            fontSize: fontSize * 0.85,
            fontFamily: theme.fontFamily,
            pointerEvents: 'none',
          }))
        }
      }
      nodes.push(group(labelNodes, { class: 'chartts-geo-labels', pointerEvents: 'none' }))
    }

    // Scatter overlay — only if explicitly configured
    if (gOpts.scatterSeries !== undefined) {
      const scatterSeries = data.series[gOpts.scatterSeries]
      if (scatterSeries) {
        const scatterNodes: RenderNode[] = []
        const maxScatter = Math.max(...scatterSeries.values.map(Math.abs), 1)

        for (let i = 0; i < data.labels.length; i++) {
          const name = String(data.labels[i])
          const val = scatterSeries.values[i] ?? 0
          if (val <= 0) continue

          const centroid = centroids.get(name)
          if (!centroid) continue

          const sx = offsetX + centroid.x * scale
          const sy = offsetY + centroid.y * scale
          const r = 3 + (val / maxScatter) * 12
          const color = options.colors[1 % options.colors.length]!

          scatterNodes.push(circle(sx, sy, r, {
            class: 'chartts-geo-scatter',
            fill: color,
            fillOpacity: 0.5,
            stroke: color,
            strokeWidth: 1,
            'data-series': gOpts.scatterSeries,
            'data-index': i,
          }))
        }

        if (scatterNodes.length > 0) {
          nodes.push(group(scatterNodes, { class: 'chartts-geo-scatter-layer' }))
        }
      }
    }

    // Color legend bar
    if (showLegend && values.length > 0) {
      const legendNodes: RenderNode[] = []
      const lw = Math.min(200, area.width * 0.4)
      const lh = 8
      const lx = area.x + (area.width - lw) / 2
      const ly = area.y + area.height - 20

      // Gradient steps
      const steps = 10
      const stepW = lw / steps
      for (let s = 0; s < steps; s++) {
        const t = s / (steps - 1)
        const opacity = 0.2 + t * 0.75
        legendNodes.push(rect(lx + s * stepW, ly, stepW + 0.5, lh, {
          fill: baseColor,
          fillOpacity: opacity,
          stroke: 'none',
        }))
      }

      // Border
      legendNodes.push(rect(lx, ly, lw, lh, {
        fill: 'none',
        stroke: theme.textMuted,
        strokeWidth: 0.5,
        rx: 2,
      }))

      // Min/max labels
      const labelSize = Math.max(8, theme.fontSizeSmall * 0.8)
      const seriesName = series?.name ?? ''
      legendNodes.push(text(lx, ly + lh + labelSize + 2, formatValue(minVal), {
        fill: theme.textMuted,
        fontSize: labelSize,
        fontFamily: theme.fontFamily,
        textAnchor: 'start',
      }))
      legendNodes.push(text(lx + lw, ly + lh + labelSize + 2, formatValue(maxVal), {
        fill: theme.textMuted,
        fontSize: labelSize,
        fontFamily: theme.fontFamily,
        textAnchor: 'end',
      }))
      if (seriesName) {
        legendNodes.push(text(lx + lw / 2, ly + lh + labelSize + 2, seriesName, {
          fill: theme.textColor,
          fontSize: labelSize,
          fontFamily: theme.fontFamily,
          textAnchor: 'middle',
          fontWeight: 600,
        }))
      }

      nodes.push(group(legendNodes, { class: 'chartts-geo-legend' }))
    }

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area, options } = ctx
    if (!data.series[0] || data.series[0].values.length === 0) return null

    const gOpts = options as GeoOptions
    const regions = gOpts.regions ?? WORLD_SIMPLE
    const showLegend = gOpts.legendPosition !== 'none'
    const values = [...new Map(data.labels.map((l, i) => [String(l), data.series[0]!.values[i] ?? 0])).values()]
    const legendH = showLegend && values.length > 0 ? 28 : 0

    const vb = gOpts.viewBox ?? DEFAULT_VB
    const { scale, offsetX, offsetY } = computeMapTransform(area, vb, legendH, ctx.zoomPan)

    // Convert mouse to map space
    const mapX = (mx - offsetX) / scale
    const mapY = (my - offsetY) / scale

    if (mapX < vb.x || mapX > vb.x + vb.width || mapY < vb.y || mapY > vb.y + vb.height) return null

    const bboxes = getBBoxes(regions)
    const centroids = getCentroids(regions)

    // Phase 1: find ALL regions whose bbox contains the mouse point
    const candidates: { idx: number; area: number; dist: number }[] = []

    for (let i = 0; i < data.labels.length; i++) {
      const name = String(data.labels[i])
      const bb = bboxes.get(name)
      if (!bb) continue

      // Expand bbox slightly for small regions
      const pad = 3
      if (mapX >= bb.minX - pad && mapX <= bb.maxX + pad &&
          mapY >= bb.minY - pad && mapY <= bb.maxY + pad) {
        const bboxArea = (bb.maxX - bb.minX) * (bb.maxY - bb.minY)
        const centroid = centroids.get(name)
        const dist = centroid ? Math.sqrt((mapX - centroid.x) ** 2 + (mapY - centroid.y) ** 2) : 999
        candidates.push({ idx: i, area: bboxArea, dist })
      }
    }

    if (candidates.length === 0) return null

    // Phase 2: pick the smallest bbox (most specific region) among candidates.
    // If tied, pick closest centroid.
    candidates.sort((a, b) => a.area - b.area || a.dist - b.dist)
    const best = candidates[0]!

    // Convert centroid back to chart pixel space for highlight positioning
    const centroid = centroids.get(String(data.labels[best.idx]))
    const px = centroid ? offsetX + centroid.x * scale : mx
    const py = centroid ? offsetY + centroid.y * scale : my

    return { seriesIndex: 0, pointIndex: best.idx, distance: best.dist, x: px, y: py }
  },
})

/** Extract all x,y coordinate pairs from SVG path string. */
function extractCoords(d: string): number[] {
  const nums = d.match(/-?\d+(?:\.\d+)?/g)
  return nums ? nums.map(Number) : []
}

/** Rough centroid by averaging path command coordinates. */
function getPathCentroid(d: string): { x: number; y: number } | null {
  const nums = extractCoords(d)
  if (nums.length < 2) return null

  let sx = 0, sy = 0, count = 0
  for (let i = 0; i + 1 < nums.length; i += 2) {
    sx += nums[i]!
    sy += nums[i + 1]!
    count++
  }
  return count > 0 ? { x: sx / count, y: sy / count } : null
}

/** Compute bounding box from SVG path coordinates. */
function getPathBBox(d: string): BBox | null {
  const nums = extractCoords(d)
  if (nums.length < 2) return null

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = nums[i]!, y = nums[i + 1]!
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  return { minX, minY, maxX, maxY }
}
