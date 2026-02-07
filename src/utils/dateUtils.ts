import {format, parseISO} from 'date-fns'
import {toZonedTime} from 'date-fns-tz'

const ESTONIA_TIMEZONE = 'Europe/Tallinn'

/**
 * Format an ISO date string to Estonian time (HH:mm)
 */
export function formatEstonianDateTime(isoDateString: string): string {
    const utcDate = parseISO(isoDateString)
    const localDate = toZonedTime(utcDate, ESTONIA_TIMEZONE)
    return format(localDate, 'HH:mm')
}

/**
 * Format date as dd.MM.yyyy
 */
export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return ''
    
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    
    if (isNaN(dateObj.getTime())) return ''
    
    return format(dateObj, 'dd.MM.yyyy')
}
