import { renderToString } from '@chartts/core'
import type { ChartTypePlugin, ChartData, ChartOptions } from '@chartts/core'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RenderOptions extends ChartOptions {
  width?: number
  height?: number
}

export interface RasterOptions extends RenderOptions {
  scale?: number
  background?: string
}

// ---------------------------------------------------------------------------
// SVG rendering
// ---------------------------------------------------------------------------

/**
 * Render a chart to an SVG string.
 *
 * This is a thin wrapper around core's `renderToString` with sensible defaults.
 * Works in any JavaScript runtime (Node.js, Bun, Deno, Cloudflare Workers).
 *
 * @param type - Chart type plugin (e.g. lineChartType, barChartType)
 * @param data - Chart data with labels and series
 * @param options - Chart options including width/height
 * @returns SVG string
 *
 * @example
 * ```ts
 * import { renderChart } from '@chartts/ssr'
 * import { lineChartType } from '@chartts/core'
 *
 * const svg = renderChart(lineChartType, {
 *   labels: ['Jan', 'Feb', 'Mar'],
 *   series: [{ name: 'Sales', values: [10, 20, 15] }],
 * }, { width: 800, height: 400 })
 * ```
 */
export function renderChart(
  type: ChartTypePlugin,
  data: ChartData,
  options?: RenderOptions,
): string {
  return renderToString(type, data, {
    width: options?.width ?? 600,
    height: options?.height ?? 400,
    ...options,
  })
}

// ---------------------------------------------------------------------------
// Raster rendering (PNG)
// ---------------------------------------------------------------------------

/**
 * Render a chart to PNG as a Uint8Array.
 *
 * Uses @resvg/resvg-js (optional dependency) to rasterize the SVG.
 * The `scale` option controls the output resolution (default 2x for retina).
 *
 * @param type - Chart type plugin
 * @param data - Chart data
 * @param options - Render options including scale and background color
 * @returns PNG bytes as Uint8Array
 *
 * @example
 * ```ts
 * import { renderToPNG } from '@chartts/ssr'
 * import { barChartType } from '@chartts/core'
 *
 * const png = await renderToPNG(barChartType, data, {
 *   width: 800,
 *   height: 400,
 *   scale: 2,
 *   background: '#ffffff',
 * })
 * ```
 */
export async function renderToPNG(
  type: ChartTypePlugin,
  data: ChartData,
  options?: RasterOptions,
): Promise<Uint8Array> {
  const svg = renderChart(type, data, options)
  const width = (options?.width ?? 600) * (options?.scale ?? 2)

  const { Resvg } = await import('@resvg/resvg-js')
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width' as const, value: width },
    ...(options?.background ? { background: options.background } : {}),
  })
  const rendered = resvg.render()
  return rendered.asPng()
}

// ---------------------------------------------------------------------------
// Raster rendering (JPEG)
// ---------------------------------------------------------------------------

/**
 * Render a chart to JPEG as a Uint8Array.
 *
 * Note: resvg only outputs PNG natively. This function returns PNG data.
 * For true JPEG conversion, consumers should use a separate image library
 * (e.g. sharp) to convert the PNG output.
 *
 * @param type - Chart type plugin
 * @param data - Chart data
 * @param options - Render options
 * @returns PNG bytes as Uint8Array (consumer converts to JPEG if needed)
 */
export async function renderToJPEG(
  type: ChartTypePlugin,
  data: ChartData,
  options?: RasterOptions,
): Promise<Uint8Array> {
  // resvg only outputs PNG; consumers can convert to JPEG with sharp or similar
  return renderToPNG(type, data, options)
}

// ---------------------------------------------------------------------------
// File saving
// ---------------------------------------------------------------------------

/**
 * Save a chart directly to a file.
 *
 * Detects the format from the file extension:
 * - `.svg` - writes SVG string as UTF-8 text
 * - `.png` - rasterizes via resvg and writes binary
 * - Any other extension - treated as PNG
 *
 * Works on Node.js, Bun, and Deno (all support `fs/promises`).
 *
 * @param type - Chart type plugin
 * @param data - Chart data
 * @param filepath - Output file path (extension determines format)
 * @param options - Render options
 *
 * @example
 * ```ts
 * import { saveChart } from '@chartts/ssr'
 * import { lineChartType } from '@chartts/core'
 *
 * await saveChart(lineChartType, data, './chart.svg')
 * await saveChart(lineChartType, data, './chart.png', { scale: 3 })
 * ```
 */
export async function saveChart(
  type: ChartTypePlugin,
  data: ChartData,
  filepath: string,
  options?: RasterOptions,
): Promise<void> {
  const fs = await import('fs/promises')

  if (filepath.endsWith('.svg')) {
    const svg = renderChart(type, data, options)
    await fs.writeFile(filepath, svg, 'utf-8')
  } else {
    const png = await renderToPNG(type, data, options)
    await fs.writeFile(filepath, png)
  }
}
