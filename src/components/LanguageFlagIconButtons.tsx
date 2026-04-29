import {Box, IconButton} from '@mui/material'
import EE from 'country-flag-icons/react/3x2/EE'
import GB from 'country-flag-icons/react/3x2/GB'
import type {CSSProperties} from 'react'
import {useTranslation} from 'react-i18next'

const flagIconStyle: CSSProperties = {
    display: 'block',
    width: '1.35rem',
    height: 'auto',
}

/** Compact ET / EN switcher. SVG flags via `country-flag-icons` (not emoji — works on TVs / old browsers). Uses `common` strings for aria-labels. */
export function LanguageFlagIconButtons() {
    const {t, i18n} = useTranslation('common')
    const lang = i18n.language?.toLowerCase().startsWith('en') ? 'en' : 'et'

    return (
        <Box sx={{display: 'flex', flexShrink: 0, alignItems: 'center', gap: 0.25}}>
            <IconButton
                size="small"
                color={lang === 'et' ? 'primary' : 'default'}
                onClick={() => {
                    void i18n.changeLanguage('et')
                }}
                aria-label={t('languageEt')}
                aria-pressed={lang === 'et'}
                sx={{p: 0.35}}
            >
                <EE aria-hidden style={flagIconStyle} title="" />
            </IconButton>
            <IconButton
                size="small"
                color={lang === 'en' ? 'primary' : 'default'}
                onClick={() => {
                    void i18n.changeLanguage('en')
                }}
                aria-label={t('languageEn')}
                aria-pressed={lang === 'en'}
                sx={{p: 0.35}}
            >
                <GB aria-hidden style={flagIconStyle} title="" />
            </IconButton>
        </Box>
    )
}
