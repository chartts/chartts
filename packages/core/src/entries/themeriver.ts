import { createConvenience } from '../api/factory'
import { themeRiverChartType } from '../charts/themeriver/themeriver-type'

export const ThemeRiver = createConvenience(themeRiverChartType)
export { themeRiverChartType }
export * from './shared'
