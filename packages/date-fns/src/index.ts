import { format, parse, parseISO, isValid, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns'

export interface DateFnsFormatterOptions {
  format?: string
  fallback?: string
}

/**
 * Create a date formatter function compatible with ChartOptions.xFormat.
 *
 * @param formatStr - date-fns format string (default: 'MMM d, yyyy')
 * @returns Formatter function that converts date values to formatted strings
 */
export function dateFnsFormatter(formatStr: string = 'MMM d, yyyy'): (value: string | number | Date) => string {
  return (value: string | number | Date): string => {
    const date = toDate(value)
    if (!date || !isValid(date)) return String(value)
    return format(date, formatStr)
  }
}

/**
 * Auto-detect the best date format based on the range of the data.
 *
 * - <= 60 minutes: 'HH:mm'
 * - <= 48 hours: 'MMM d HH:mm'
 * - <= 30 days: 'MMM d'
 * - <= 365 days: 'MMM yyyy'
 * - > 365 days: 'yyyy'
 *
 * @param dates - Array of date values to analyze
 * @returns Formatter function tuned to the data range
 */
export function autoDateFormatter(dates: (string | number | Date)[]): (value: string | number | Date) => string {
  if (dates.length < 2) return dateFnsFormatter('MMM d, yyyy')

  const first = toDate(dates[0]!)
  const last = toDate(dates[dates.length - 1]!)
  if (!first || !last) return dateFnsFormatter('MMM d, yyyy')

  const days = Math.abs(differenceInDays(last, first))
  const hours = Math.abs(differenceInHours(last, first))
  const minutes = Math.abs(differenceInMinutes(last, first))

  if (minutes <= 60) return dateFnsFormatter('HH:mm')
  if (hours <= 48) return dateFnsFormatter('MMM d HH:mm')
  if (days <= 30) return dateFnsFormatter('MMM d')
  if (days <= 365) return dateFnsFormatter('MMM yyyy')
  return dateFnsFormatter('yyyy')
}

/**
 * Parse a date string using date-fns.
 *
 * @param value - Date string to parse
 * @param formatStr - Optional format string for parsing (uses parseISO if omitted)
 * @returns Date object or null if invalid
 */
export function parseDateFns(value: string, formatStr?: string): Date | null {
  if (formatStr) {
    const parsed = parse(value, formatStr, new Date())
    return isValid(parsed) ? parsed : null
  }
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : null
}

function toDate(value: string | number | Date): Date | null {
  if (value instanceof Date) return value
  if (typeof value === 'number') return new Date(value)
  const d = parseISO(value)
  return isValid(d) ? d : null
}
