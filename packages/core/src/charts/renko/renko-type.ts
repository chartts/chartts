import type {
  ChartData, ResolvedOptions, PreparedData,
  RenderContext, RenderNode, HitResult,
} from '../../types'
import { defineChartType } from '../../api/define'
import { prepareNoAxes } from '../../utils/prepare'
import { group, rect } from '../../render/tree'

export interface RenkoOptions extends ResolvedOptions {
  /** Brick size in data units. Auto-calculated from ATR if omitted. */
  brickSize?: number
  /** Up brick color. Default green. */
  upColor?: string
  /** Down brick color. Default red. */
  downColor?: string
  /** Gap between bricks in pixels. Default 1. */
  gap?: number
  /** Corner radius for bricks. Default 2. */
  borderRadius?: number
}

interface RenkoBrick {
  open: number
  close: number
  isUp: boolean
}

/**
 * Renko chart — brick-based reversal chart.
 *
 * Uniform bricks form only when price moves by the brick size.
 * Up bricks (green) for rising prices, down bricks (red) for falling.
 * Filters out noise and shows pure price action.
 */
export const renkoChartType = defineChartType({
  type: 'renko',
  suppressAxes: true,


  prepareData(data: ChartData, options: ResolvedOptions): PreparedData {
    return prepareNoAxes(data, options)
  },

  render(ctx: RenderContext): RenderNode[] {
    const { data, area, options } = ctx
    const nodes: RenderNode[] = []

    const series = data.series[0]
    if (!series || series.values.length < 2) return nodes

    const opts = options as RenkoOptions
    const upColor = opts.upColor ?? 'var(--color-emerald-500, #10b981)'
    const downColor = opts.downColor ?? 'var(--color-red-500, #ef4444)'
    const gap = opts.gap ?? 1
    const borderRadius = opts.borderRadius ?? 2

    const values = series.values

    // Auto-calculate brick size: ATR-like approach (average absolute change)
    let brickSize = opts.brickSize
    if (!brickSize) {
      let totalChange = 0
      for (let i = 1; i < values.length; i++) {
        totalChange += Math.abs(values[i]! - values[i - 1]!)
      }
      const avgChange = totalChange / (values.length - 1)
      brickSize = Math.max(avgChange * 1.5, (Math.max(...values) - Math.min(...values)) / 20)
    }

    // Build bricks
    const bricks = computeRenkoBricks(values, brickSize)
    if (bricks.length === 0) return nodes

    // Find price range from bricks
    let minPrice = Infinity
    let maxPrice = -Infinity
    for (const b of bricks) {
      minPrice = Math.min(minPrice, b.open, b.close)
      maxPrice = Math.max(maxPrice, b.open, b.close)
    }
    const priceRange = maxPrice - minPrice || 1

    // Layout: each brick gets equal horizontal space
    const padding = 16
    const usableWidth = area.width - padding * 2
    const usableHeight = area.height - padding * 2
    const brickWidth = Math.min(
      (usableWidth - gap * (bricks.length - 1)) / bricks.length,
      30,
    )

    const totalBrickWidth = bricks.length * brickWidth + (bricks.length - 1) * gap
    const xStart = area.x + (area.width - totalBrickWidth) / 2

    const mapY = (v: number) => area.y + padding + (1 - (v - minPrice) / priceRange) * usableHeight
    const brickPixelHeight = (brickSize / priceRange) * usableHeight

    const brickNodes: RenderNode[] = []

    for (let i = 0; i < bricks.length; i++) {
      const b = bricks[i]!
      const x = xStart + i * (brickWidth + gap)
      const yTop = mapY(Math.max(b.open, b.close))
      const h = Math.max(brickPixelHeight, 3)

      brickNodes.push(rect(x, yTop, brickWidth, h, {
        rx: borderRadius, ry: borderRadius,
        class: 'chartts-renko-brick',
        fill: b.isUp ? upColor : downColor,
        fillOpacity: b.isUp ? 0.9 : 0.9,
        stroke: b.isUp ? upColor : downColor,
        strokeWidth: 1,
        'data-series': 0,
        'data-index': i,
        tabindex: 0,
        role: 'img',
        ariaLabel: `Brick ${i + 1}: ${b.isUp ? 'Up' : 'Down'} ${b.open.toFixed(1)}→${b.close.toFixed(1)}`,
      }))
    }

    nodes.push(group(brickNodes, {
      class: 'chartts-series chartts-series-0',
      'data-series-name': series.name,
    }))

    return nodes
  },

  hitTest(ctx: RenderContext, mx: number, my: number): HitResult | null {
    const { data, area } = ctx
    const series = data.series[0]
    if (!series) return null

    const frac = (mx - area.x) / area.width
    const idx = Math.round(frac * (series.values.length - 1))
    if (idx >= 0 && idx < series.values.length) {
      return { seriesIndex: 0, pointIndex: idx, distance: 10, x: mx, y: my }
    }
    return null
  },
})

/**
 * Compute renko bricks from raw price data.
 */
function computeRenkoBricks(values: number[], brickSize: number): RenkoBrick[] {
  const bricks: RenkoBrick[] = []
  if (values.length < 2 || brickSize <= 0) return bricks

  let currentPrice = Math.round(values[0]! / brickSize) * brickSize

  for (let i = 1; i < values.length; i++) {
    const v = values[i]!
    const diff = v - currentPrice

    if (Math.abs(diff) >= brickSize) {
      const numBricks = Math.floor(Math.abs(diff) / brickSize)
      const isUp = diff > 0

      for (let j = 0; j < numBricks; j++) {
        const open = currentPrice
        currentPrice += isUp ? brickSize : -brickSize
        bricks.push({ open, close: currentPrice, isUp })
      }
    }
  }

  return bricks
}
