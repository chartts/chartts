import { createChart } from './create'
import type { ChartData, ChartOptions, ChartInstance, ChartTypePlugin } from '../types'

export interface ChartConfig extends ChartOptions {
  data: ChartData
  debug?: boolean
}

export function createConvenience(chartType: ChartTypePlugin) {
  return function (target: string | HTMLElement, config: ChartConfig): ChartInstance {
    const { data, ...options } = config
    return createChart(target, chartType, data, options)
  }
}
