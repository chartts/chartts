import { createConvenience } from '../api/factory'
import { wordcloudChartType } from '../charts/wordcloud/wordcloud-type'

export const WordCloud = createConvenience(wordcloudChartType)
export { wordcloudChartType }
export * from './shared'
