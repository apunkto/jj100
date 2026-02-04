/**
 * Decode common HTML entities in text (e.g. &rarr; → →) so they display correctly.
 */
export function decodeHtmlEntities(text: string | null | undefined): string {
    if (text == null || text === '') return text ?? ''
    return text
        .replace(/&rarr;/g, '→')
        .replace(/&larr;/g, '←')
        .replace(/&nbsp;/g, '\u00A0')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)))
}
