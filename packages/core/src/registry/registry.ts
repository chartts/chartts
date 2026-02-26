import type { ChartTypePlugin, ScaleFactory, ScaleType } from '../types'

const charts = new Map<string, ChartTypePlugin>()
const scales = new Map<ScaleType, ScaleFactory>()

export function registerChart(plugin: ChartTypePlugin): void {
  if (charts.has(plugin.type)) {
    throw new Error(`[chartts] Chart type "${plugin.type}" already registered.`)
  }
  charts.set(plugin.type, plugin)
}

export function getChart(type: string): ChartTypePlugin {
  const plugin = charts.get(type)
  if (!plugin) {
    const available = Array.from(charts.keys()).join(', ') || 'none'
    throw new Error(`[chartts] Unknown chart type "${type}". Registered: ${available}`)
  }
  return plugin
}

export function registerScale(type: ScaleType, factory: ScaleFactory): void {
  scales.set(type, factory)
}

export function getScaleFactory(type: ScaleType): ScaleFactory {
  const factory = scales.get(type)
  if (!factory) {
    throw new Error(`[chartts] Unknown scale type "${type}".`)
  }
  return factory
}

export function clearRegistry(): void {
  charts.clear()
  scales.clear()
}
