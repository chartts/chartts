import { createConvenience } from '../api/factory'
import { matrixChartType } from '../charts/matrix/matrix-type'

export const Matrix = createConvenience(matrixChartType)
export { matrixChartType }
export * from './shared'
