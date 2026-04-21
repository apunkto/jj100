import {useEffect} from 'react'
import Head from 'next/head'
import {useTranslation} from 'react-i18next'

/** Syncs document language and default SEO tags with the active i18n locale. */
export function I18nHead() {
    const {t, i18n} = useTranslation('common')

    useEffect(() => {
        document.documentElement.lang = i18n.language?.toLowerCase().startsWith('en') ? 'en' : 'et'
    }, [i18n.language])

    return (
        <Head>
            <title>{t('meta.title')}</title>
            <meta name="description" content={t('meta.description')} />
        </Head>
    )
}
