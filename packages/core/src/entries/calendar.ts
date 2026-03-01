import { createConvenience } from '../api/factory'
import { calendarChartType } from '../charts/calendar/calendar-type'

export const Calendar = createConvenience(calendarChartType)
export { calendarChartType }
export * from './shared'
