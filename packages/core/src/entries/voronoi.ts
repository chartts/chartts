import { createConvenience } from '../api/factory'
import { voronoiChartType } from '../charts/voronoi/voronoi-type'

export const Voronoi = createConvenience(voronoiChartType)
export { voronoiChartType }
export * from './shared'
