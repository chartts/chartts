import { createConvenience } from '../api/factory'
import { matrixChartType } from '../charts/matrix/matrix-type'

export const Matrix = createConvenience(matrixChartType)
export { matrixChartType }
export type { MatrixOptions } from '../charts/matrix/matrix-type'
export { createChart } from '../api/create'
export { renderToString } from '../render/string'
export { resolveTheme, applyTheme } from '../theme/engine'
export type {
  ChartData, ChartOptions, ChartInstance, ChartTypePlugin,
  ThemeConfig, Series, RenderContext, RenderNode,
} from '../types'
export type { ChartConfig } from '../api/factory'
