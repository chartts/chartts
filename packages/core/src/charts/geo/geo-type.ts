import type {
  ChartTypePlugin, ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult, ScaleType,
} from '../../types'
import { prepareNoAxes } from '../../utils/prepare'
import { path, circle, text, group } from '../../render/tree'
import { WORLD_REGIONS } from './world-regions'

/**
 * GEO/Map chart — choropleth map with SVG path regions.
 *
 * Data convention:
 * - labels: region/country names
 * - series[0].values: data values per region (for choropleth coloring)
 * - series[1] (optional): scatter overlay — values encode marker size
 *
 * Options:
 * - regions: array of {name, path} defining SVG path data per region
 * - viewBox: coordinate system {x, y, width, height} (default: equirectangular -180..180, -90..90)
 * - showLabels: show region name labels
 * - projection: 'equirectangular' (default)
 */

export interface GeoRegion {
  name: string
  path: string
}

export interface GeoOptions {
  regions?: GeoRegion[]
  viewBox?: { x: number; y: number; width: number; height: number }
  showLabels?: boolean
  scatterSeries?: number
}

/** Built-in world map — all 220 countries with full-precision SVG paths. */
export const WORLD_SIMPLE: GeoRegion[] = WORLD_REGIONS

export const geoChartType: ChartTypePlugin = {
  type: 'geo',

  getScaleTypes(): { x: ScaleType; y: ScaleType } {
    return { x: 'categorical', y: 'linear' }
  },

  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, theme, options } = ctx
    const nodes: RenderNode[] = []

    const gOpts = options as unknown as GeoOptions
    const regions = gOpts.regions ?? WORLD_SIMPLE
    const showLabels = gOpts.showLabels !== false

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

    // Coordinate system
    const vb = gOpts.viewBox ?? { x: 0, y: 0, width: 1009.6727, height: 665.96301 }
    const scaleX = area.width / vb.width
    const scaleY = area.height / vb.height
    const scale = Math.min(scaleX, scaleY) * 0.92
    const offsetX = area.x + (area.width - vb.width * scale) / 2 - vb.x * scale
    const offsetY = area.y + (area.height - vb.height * scale) / 2 - vb.y * scale

    const transform = `translate(${offsetX},${offsetY}) scale(${scale})`

    // Render regions
    for (let i = 0; i < regions.length; i++) {
      const region = regions[i]!
      const val = valueMap.get(region.name)
      const hasData = val !== undefined
      const t = hasData ? (val - minVal) / range : 0
      const baseColor = options.colors[0] ?? '#3b82f6'
      const fillOpacity = hasData ? 0.15 + t * 0.8 : 0.08

      nodes.push(path(region.path, {
        class: 'chartts-geo-region',
        fill: hasData ? baseColor : theme.gridColor,
        fillOpacity,
        stroke: theme.textMuted,
        strokeWidth: 0.5 / scale,
        transform,
        'data-series': 0,
        'data-index': i,
        tabindex: 0,
        role: 'img',
        ariaLabel: `${region.name}: ${val ?? 'no data'}`,
      }))
    }

    // Region labels
    if (showLabels) {
      for (let i = 0; i < regions.length; i++) {
        const region = regions[i]!
        const centroid = getPathCentroid(region.path)
        if (!centroid) continue

        const lx = offsetX + centroid.x * scale
        const ly = offsetY + centroid.y * scale

        nodes.push(text(lx, ly, region.name, {
          class: 'chartts-geo-label',
          fill: theme.textColor,
          textAnchor: 'middle',
          dominantBaseline: 'central',
          fontSize: Math.max(7, theme.fontSizeSmall * 0.85),
          fontFamily: theme.fontFamily,
          pointerEvents: 'none',
        }))
      }
    }

    // Scatter overlay (second series)
    const scatterIdx = gOpts.scatterSeries ?? 1
    const scatterSeries = data.series[scatterIdx]
    if (scatterSeries) {
      const scatterNodes: RenderNode[] = []
      const maxScatter = Math.max(...scatterSeries.values.map(Math.abs), 1)

      for (let i = 0; i < data.labels.length; i++) {
        const name = String(data.labels[i])
        const val = scatterSeries.values[i] ?? 0
        if (val <= 0) continue

        const region = regions.find(r => r.name === name)
        if (!region) continue

        const centroid = getPathCentroid(region.path)
        if (!centroid) continue

        const sx = offsetX + centroid.x * scale
        const sy = offsetY + centroid.y * scale
        const r = 3 + (val / maxScatter) * 12
        const color = options.colors[1 % options.colors.length]!

        scatterNodes.push(circle(sx, sy, r, {
          class: 'chartts-geo-scatter',
          fill: color,
          fillOpacity: 0.6,
          stroke: color,
          strokeWidth: 1,
          'data-series': scatterIdx,
          'data-index': i,
        }))
      }

      if (scatterNodes.length > 0) {
        nodes.push(group(scatterNodes, { class: 'chartts-geo-scatter-layer' }))
      }
    }

    return nodes
  },

  hitTest(ctx: RenderContext, _mx: number, _my: number): HitResult | null {
    const { data } = ctx
    if (!data.series[0] || data.series[0].values.length === 0) return null
    return null
  },
}

/** Rough centroid by averaging path command coordinates. */
function getPathCentroid(d: string): { x: number; y: number } | null {
  const nums = d.match(/-?\d+(?:\.\d+)?/g)
  if (!nums || nums.length < 2) return null

  let sx = 0, sy = 0, count = 0
  for (let i = 0; i + 1 < nums.length; i += 2) {
    sx += parseFloat(nums[i]!)
    sy += parseFloat(nums[i + 1]!)
    count++
  }
  return count > 0 ? { x: sx / count, y: sy / count } : null
}
