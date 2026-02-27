import type { ChartTypePlugin, ScaleFactory, ScaleType } from '../types'

/**
 * @deprecated Use the `CHART_TYPES` map from `@chartts/core` instead.
 * This registry is unused internally and will be removed in a future version.
 */

const charts = new Map<string, ChartTypePlugin>()
const scales = new Map<ScaleType, ScaleFactory>()

/** @deprecated Use `CHART_TYPES` map instead. */
export function registerChart(plugin: ChartTypePlugin): void {
  if (charts.has(plugin.type)) {
    throw new Error(`[chartts] Chart type "${plugin.type}" already registered.`)
  }
  charts.set(plugin.type, plugin)
}

/** @deprecated Use `CHART_TYPES` map instead. */
export function getChart(type: string): ChartTypePlugin {
  const plugin = charts.get(type)
  if (!plugin) {
    const available = Array.from(charts.keys()).join(', ') || 'none'
    throw new Error(`[chartts] Unknown chart type "${type}". Registered: ${available}`)
  }
  return plugin
}

/** @deprecated */
export function registerScale(type: ScaleType, factory: ScaleFactory): void {
  scales.set(type, factory)
}

/** @deprecated */
export function getScaleFactory(type: ScaleType): ScaleFactory {
  const factory = scales.get(type)
  if (!factory) {
    throw new Error(`[chartts] Unknown scale type "${type}".`)
  }
  return factory
}

/** @deprecated */
export function clearRegistry(): void {
  charts.clear()
  scales.clear()
}
