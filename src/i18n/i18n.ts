import i18n from 'i18next'
import {initReactI18next} from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import etCommon from './locales/et/common.json'
import enCommon from './locales/en/common.json'
import etNav from './locales/et/nav.json'
import enNav from './locales/en/nav.json'
import etLogin from './locales/et/login.json'
import enLogin from './locales/en/login.json'
import etHome from './locales/et/home.json'
import enHome from './locales/en/home.json'
import etInfo from './locales/et/info.json'
import enInfo from './locales/en/info.json'
import etPrediction from './locales/et/prediction.json'
import enPrediction from './locales/en/prediction.json'
import etPages from './locales/et/pages.json'
import enPages from './locales/en/pages.json'
import etErrors from './locales/et/errors.json'
import enErrors from './locales/en/errors.json'
import etPdf from './locales/et/pdf.json'

export const defaultNamespaces = [
    'common',
    'nav',
    'login',
    'home',
    'info',
    'prediction',
    'pages',
    'errors',
    'pdf',
] as const

const resources = {
    et: {
        common: etCommon,
        nav: etNav,
        login: etLogin,
        home: etHome,
        info: etInfo,
        prediction: etPrediction,
        pages: etPages,
        errors: etErrors,
        pdf: etPdf,
    },
    en: {
        common: enCommon,
        nav: enNav,
        login: enLogin,
        home: enHome,
        info: enInfo,
        prediction: enPrediction,
        pages: enPages,
        errors: enErrors,
    },
} as const

if (!i18n.isInitialized) {
    i18n.use(initReactI18next)
    if (typeof window !== 'undefined') {
        i18n.use(LanguageDetector)
    }

    void i18n.init({
            resources: resources as unknown as Record<string, Record<string, object>>,
            // Do not set `lng` here — it overrides LanguageDetector (e.g. jj100_lang in localStorage).
            fallbackLng: 'et',
            supportedLngs: ['et', 'en'],
            defaultNS: 'common',
            ns: [...defaultNamespaces],
            interpolation: {escapeValue: false},
            detection:
                typeof window !== 'undefined'
                    ? {
                          order: ['localStorage'],
                          caches: ['localStorage'],
                          lookupLocalStorage: 'jj100_lang',
                      }
                    : undefined,
    })
}

export default i18n
