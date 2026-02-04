/**
 * Format date as dd.MM.yyyy
 */
export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return ''
    
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) return ''
    
    const day = String(dateObj.getDate()).padStart(2, '0')
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const year = dateObj.getFullYear()
    
    return `${day}.${month}.${year}`
}
