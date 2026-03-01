/**
 * Shared entry-point generator.
 *
 * Each per-chart entry file (e.g. `entries/line.ts`) re-exports from here
 * plus its own chart-specific convenience function and type plugin.
 *
 * This eliminates 13 identical boilerplate lines from every entry file.
 */

export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
