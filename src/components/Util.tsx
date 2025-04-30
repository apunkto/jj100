import { parseISO, format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const ESTONIA_TIMEZONE = 'Europe/Tallinn'

export function formatEstonianDateTime(isoDateString: string): string {
    const utcDate = parseISO(isoDateString)
    const localDate = toZonedTime(utcDate, ESTONIA_TIMEZONE)
    return format(localDate, 'HH:mm')
}
