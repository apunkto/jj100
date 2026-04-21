import {Box, IconButton} from '@mui/material'
import {useTranslation} from 'react-i18next'

/** Compact ET / EN switcher (emoji flags). Uses `common` strings for aria-labels. */
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
                sx={{fontSize: '1.1rem', p: 0.35}}
            >
                <Box component="span" aria-hidden sx={{lineHeight: 1}}>
                    🇪🇪
                </Box>
            </IconButton>
            <IconButton
                size="small"
                color={lang === 'en' ? 'primary' : 'default'}
                onClick={() => {
                    void i18n.changeLanguage('en')
                }}
                aria-label={t('languageEn')}
                aria-pressed={lang === 'en'}
                sx={{fontSize: '1.1rem', p: 0.35}}
            >
                <Box component="span" aria-hidden sx={{lineHeight: 1}}>
                    🇬🇧
                </Box>
            </IconButton>
        </Box>
    )
}
