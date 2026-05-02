import {Box, Typography} from '@mui/material'
import {ThemeProvider} from '@mui/material/styles'
import theme, {dashboardLedDarkTheme} from '@/lib/theme'
import {useRouter} from 'next/router'
import {Swiper, SwiperSlide} from 'swiper/react'
import {Keyboard} from 'swiper/modules'
import 'swiper/css'
import {useTranslation} from 'react-i18next'
import {isDashboardLedDarkMode, useLedDashboardChrome} from '@/src/utils/dashboardDarkMode'
import {useTopPlayersByDivision} from '@/src/api/useTopPlayersByDivision'
import {TopPlayersByDivisionContent} from '@/src/components/dashboard/TopPlayersByDivisionSlide'
import PredictionResultsSlide from '@/src/components/dashboard/PredictionResultsSlide'

function LeaderboardBody({competitionId}: {competitionId: number}) {
    const {t} = useTranslation('pages')
    const {topPlayersByDivision, loading, error} = useTopPlayersByDivision(competitionId)
    const divisionEntries = Object.entries(topPlayersByDivision)

    return (
        <Box
            component="main"
            sx={{
                height: '100vh',
                maxHeight: '100dvh',
                bgcolor: 'background.default',
                boxSizing: 'border-box',
            }}
        >
            {loading && divisionEntries.length === 0 ? (
                <Box
                    sx={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        px: 2,
                    }}
                >
                    <Typography>{t('dashboard.loading')}</Typography>
                </Box>
            ) : error && divisionEntries.length === 0 ? (
                <Box
                    sx={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        px: 2,
                    }}
                >
                    <Typography color="error">{error}</Typography>
                </Box>
            ) : divisionEntries.length === 0 ? (
                <Box
                    sx={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        px: 2,
                    }}
                >
                    <Typography>{t('dashboard.noDivisions')}</Typography>
                </Box>
            ) : (
                <Swiper
                    modules={[Keyboard]}
                    keyboard={{enabled: true}}
                    loop={false}
                    slidesPerView={1}
                    spaceBetween={0}
                    grabCursor
                    simulateTouch
                    style={{height: '100%', width: '100%'}}
                >
                    {divisionEntries.map(([division, players]) => (
                        <SwiperSlide key={division} style={{height: '100%', boxSizing: 'border-box'}}>
                            <Box
                                sx={{
                                    height: '100%',
                                    maxWidth: 960,
                                    mx: 'auto',
                                    px: {xs: 1, sm: 2},
                                    boxSizing: 'border-box',
                                }}
                            >
                                <TopPlayersByDivisionContent division={division} players={players} />
                            </Box>
                        </SwiperSlide>
                    ))}
                    <SwiperSlide key="prediction-results" style={{height: '100%', boxSizing: 'border-box'}}>
                        <Box
                            sx={{
                                height: '100%',
                                maxWidth: 960,
                                mx: 'auto',
                                px: {xs: 1, sm: 2},
                                boxSizing: 'border-box',
                            }}
                        >
                            <PredictionResultsSlide
                                competitionId={competitionId}
                                title={t('dashboard.predictionTitle')}
                                loadingLabel={t('dashboard.loading')}
                                emptyLabel={t('dashboard.predictionNoData')}
                            />
                        </Box>
                    </SwiperSlide>
                </Swiper>
            )}
        </Box>
    )
}

export default function LeaderboardPage() {
    const {t} = useTranslation('pages')
    const router = useRouter()
    const competitionIdParam = router.query.competitionId
    const competitionId =
        competitionIdParam != null && competitionIdParam !== '' ? Number(competitionIdParam) : null

    const darkMode = !router.isReady || isDashboardLedDarkMode(router.query.darkMode)
    const activeTheme = darkMode ? dashboardLedDarkTheme : theme
    useLedDashboardChrome(darkMode)

    if (!router.isReady || competitionId == null || !Number.isFinite(competitionId)) {
        return (
            <ThemeProvider theme={activeTheme}>
                <Box
                    sx={{
                        minHeight: '100vh',
                        bgcolor: 'background.default',
                        color: 'text.primary',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: 2,
                        px: 2,
                    }}
                >
                    {!router.isReady ? (
                        <Typography>{t('dashboard.loading')}</Typography>
                    ) : (
                        <>
                            <Typography variant="h5" color="error">
                                {t('dashboard.competitionRequired')}
                            </Typography>
                            <Typography textAlign="center">{t('leaderboard.openWithId')}</Typography>
                            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{maxWidth: 520}}>
                                {t('dashboard.darkModeHint')}
                            </Typography>
                        </>
                    )}
                </Box>
            </ThemeProvider>
        )
    }

    return (
        <ThemeProvider theme={activeTheme}>
            <LeaderboardBody competitionId={competitionId} />
        </ThemeProvider>
    )
}
