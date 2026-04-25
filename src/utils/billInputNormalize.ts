/** Match backend `normalizeIban` / `normalizePayerName` for consistent client-side checks. */

const INVISIBLE_CONTROL_REGEX = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/g

function stripInvisibleControls(input: string): string {
    return input.replace(INVISIBLE_CONTROL_REGEX, '')
}

export function normalizeBillIban(input: string): string {
    return stripInvisibleControls(input)
        .normalize('NFKC')
        .trim()
        .replace(/\s+/g, '')
        .replace(/[^A-Za-z0-9]/g, '')
        .toUpperCase()
}

export function normalizeBillPayerName(input: string): string {
    const collapsed = stripInvisibleControls(input).normalize('NFKC').trim().replace(/\s+/g, ' ')
    return collapsed.toLocaleUpperCase('et-EE')
}
