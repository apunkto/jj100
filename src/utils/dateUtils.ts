import {format, parseISO} from 'date-fns'
import {enUS, et} from 'date-fns/locale'
import {toZonedTime} from 'date-fns-tz'
import type {AppLocale} from '@/src/utils/appLocale'

const ESTONIA_TIMEZONE = 'Europe/Tallinn'

function dateFnsLocale(locale: AppLocale) {
    return locale === 'en' ? enUS : et
}

/**
 * Format an ISO date string to local time in Europe/Tallinn (HH:mm)
 */
export function formatLocalDateTime(isoDateString: string, locale: AppLocale = 'et'): string {
    const utcDate = parseISO(isoDateString)
    const localDate = toZonedTime(utcDate, ESTONIA_TIMEZONE)
    return format(localDate, 'HH:mm', {locale: dateFnsLocale(locale)})
}

/** @deprecated use formatLocalDateTime */
export function formatEstonianDateTime(isoDateString: string): string {
    return formatLocalDateTime(isoDateString, 'et')
}

/**
 * Format calendar date for display (locale-specific pattern).
 */
export function formatDate(date: string | Date | null | undefined, locale: AppLocale = 'et'): string {
    if (!date) return ''

    const dateObj = typeof date === 'string' ? parseISO(date) : date

    if (isNaN(dateObj.getTime())) return ''

    const pattern = locale === 'en' ? 'MMM d, yyyy' : 'dd.MM.yyyy'
    return format(dateObj, pattern, {locale: dateFnsLocale(locale)})
}
