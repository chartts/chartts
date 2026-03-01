import dayjs from 'dayjs'

/**
 * Create a date formatter function compatible with ChartOptions.xFormat.
 *
 * @param formatStr - Day.js format string (default: 'MMM D, YYYY')
 * @returns Formatter function that converts date values to formatted strings
 */
export function dayjsFormatter(formatStr: string = 'MMM D, YYYY'): (value: string | number | Date) => string {
  return (value: string | number | Date): string => {
    const d = dayjs(value)
    if (!d.isValid()) return String(value)
    return d.format(formatStr)
  }
}

/**
 * Auto-detect the best date format based on the range of the data.
 *
 * - <= 60 minutes: 'HH:mm'
 * - <= 48 hours: 'MMM D HH:mm'
 * - <= 30 days: 'MMM D'
 * - <= 365 days: 'MMM YYYY'
 * - > 365 days: 'YYYY'
 *
 * @param dates - Array of date values to analyze
 * @returns Formatter function tuned to the data range
 */
export function autoDateFormatter(dates: (string | number | Date)[]): (value: string | number | Date) => string {
  if (dates.length < 2) return dayjsFormatter('MMM D, YYYY')

  const first = dayjs(dates[0])
  const last = dayjs(dates[dates.length - 1])
  if (!first.isValid() || !last.isValid()) return dayjsFormatter('MMM D, YYYY')

  const diffMinutes = last.diff(first, 'minute')
  const diffHours = last.diff(first, 'hour')
  const diffDays = last.diff(first, 'day')

  if (diffMinutes <= 60) return dayjsFormatter('HH:mm')
  if (diffHours <= 48) return dayjsFormatter('MMM D HH:mm')
  if (diffDays <= 30) return dayjsFormatter('MMM D')
  if (diffDays <= 365) return dayjsFormatter('MMM YYYY')
  return dayjsFormatter('YYYY')
}

/**
 * Parse a date string using Day.js.
 *
 * @param value - Date string to parse
 * @param formatStr - Optional format string for parsing
 * @returns Date object or null if invalid
 */
export function parseDayjs(value: string, formatStr?: string): Date | null {
  const d = formatStr ? dayjs(value, formatStr) : dayjs(value)
  return d.isValid() ? d.toDate() : null
}
