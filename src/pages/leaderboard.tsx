import type {ReactNode} from 'react'
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

function LeaderboardBody({
    competitionId,
    controlledDivision,
    controlledPrediction,
}: {
    competitionId: number
    controlledDivision: string | null
    controlledPrediction: boolean
}) {
    const {t} = useTranslation('pages')
    const {topPlayersByDivision, loading, error} = useTopPlayersByDivision(competitionId)
    const divisionEntries = Object.entries(topPlayersByDivision)

    const controlledPlayers =
        controlledDivision != null ? topPlayersByDivision[controlledDivision] : undefined

    let body: ReactNode

    if (controlledPrediction) {
        body = (
            <Box
                sx={{
                    height: '100%',
                    maxWidth: 960,
                    mx: 'auto',
                    px: {xs: 1, sm: 2},
                    boxSizing: 'border-box',
                    overflowY: 'auto',
                }}
            >
                <PredictionResultsSlide
                    competitionId={competitionId}
                    title={t('dashboard.predictionTitle')}
                    loadingLabel={t('dashboard.loading')}
                    emptyLabel={t('dashboard.predictionNoData')}
                />
            </Box>
        )
    } else if (controlledDivision != null) {
        if (loading && divisionEntries.length === 0) {
            body = (
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
            )
        } else if (error && divisionEntries.length === 0) {
            body = (
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
            )
        } else if (!loading && divisionEntries.length === 0) {
            body = (
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
            )
        } else if (!loading && divisionEntries.length > 0 && controlledPlayers === undefined) {
            body = (
                <Box
                    sx={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        px: 2,
                    }}
                >
                    <Typography color="error" textAlign="center">
                        {t('leaderboard.divisionNotFound', {division: controlledDivision})}
                    </Typography>
                </Box>
            )
        } else if (controlledPlayers !== undefined) {
            body = (
                <Box
                    sx={{
                        height: '100%',
                        maxWidth: 960,
                        mx: 'auto',
                        px: {xs: 1, sm: 2},
                        boxSizing: 'border-box',
                        overflowY: 'auto',
                    }}
                >
                    <TopPlayersByDivisionContent
                        division={controlledDivision}
                        players={controlledPlayers}
                        layout="standalonePage"
                    />
                </Box>
            )
        } else {
            body = (
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
            )
        }
    } else if (loading && divisionEntries.length === 0) {
        body = (
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
        )
    } else if (error && divisionEntries.length === 0) {
        body = (
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
        )
    } else if (divisionEntries.length === 0) {
        body = (
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
        )
    } else {
        body = (
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
        )
    }

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
            {body}
        </Box>
    )
}

export default function LeaderboardPage() {
    const {t} = useTranslation('pages')
    const router = useRouter()
    const competitionIdParam = router.query.competitionId
    const competitionId =
        competitionIdParam != null && competitionIdParam !== '' ? Number(competitionIdParam) : null

    const divisionParam = router.query.division
    const rawDivision =
        router.isReady && divisionParam != null && divisionParam !== ''
            ? (Array.isArray(divisionParam) ? divisionParam[0]! : divisionParam)
            : null
    const controlledDivision =
        rawDivision != null
            ? (() => {
                  try {
                      return decodeURIComponent(rawDivision)
                  } catch {
                      return rawDivision
                  }
              })()
            : null

    const rawPrediction = Array.isArray(router.query.prediction)
        ? router.query.prediction[0]
        : router.query.prediction
    const controlledPrediction =
        router.isReady && (rawPrediction === '1' || rawPrediction === 'true')

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
            <LeaderboardBody
                competitionId={competitionId}
                controlledDivision={controlledPrediction ? null : controlledDivision}
                controlledPrediction={controlledPrediction}
            />
        </ThemeProvider>
    )
}
