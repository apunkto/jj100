export type AppLocale = 'et' | 'en'

export function appLocaleFromLanguage(lang: string | undefined): AppLocale {
    return lang?.toLowerCase().startsWith('en') ? 'en' : 'et'
}
