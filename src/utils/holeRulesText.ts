import type {AppLocale} from '@/src/utils/appLocale'

type HoleRulesFields = {
    rules_et?: string | null
    rules_en?: string | null
}

function trimText(s: string | null | undefined): string {
    return typeof s === 'string' ? s.trim() : ''
}

/** Prefer locale-specific rules; fall back to the other language if empty. */
export function localizedHoleRules(hole: HoleRulesFields | null | undefined, locale: AppLocale): string | null {
    if (hole == null) return null
    const primary = locale === 'en' ? hole.rules_en : hole.rules_et
    const fallback = locale === 'en' ? hole.rules_et : hole.rules_en
    return trimText(primary) || trimText(fallback) || null
}
