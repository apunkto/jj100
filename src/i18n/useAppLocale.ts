import {useTranslation} from 'react-i18next'
import {type AppLocale, appLocaleFromLanguage} from '@/src/utils/appLocale'

export function useAppLocale(): AppLocale {
    const {i18n} = useTranslation()
    return appLocaleFromLanguage(i18n.language)
}
