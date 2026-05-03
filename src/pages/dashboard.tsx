import {useEffect, useRef} from 'react'
import {Swiper, SwiperSlide} from 'swiper/react'
import {Autoplay, Keyboard} from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/autoplay'
import {Box, Typography} from '@mui/material'
import {ThemeProvider} from '@mui/material/styles'
import theme, {dashboardLedDarkTheme} from '@/lib/theme'
import {useRouter} from 'next/router'
import TopHolesSlide from '@/src/components/dashboard/TopHolesSlide'
import {useTopPlayersByDivision} from '@/src/api/useTopPlayersByDivision'
import {TopPlayersByDivisionContent} from '@/src/components/dashboard/TopPlayersByDivisionSlide'
import StatsSlide from '@/src/components/dashboard/StatsSlide'
import PredictionResultsSlide from '@/src/components/dashboard/PredictionResultsSlide'
import {useTranslation} from 'react-i18next'
import {isDashboardLedDarkMode, useLedDashboardChrome} from '@/src/utils/dashboardDarkMode'

const TOP_HOLES_AUTOPLAY_MS = 180_000
const TOP_PLAYERS_SLIDE_MS = 20_000
const PREDICTION_SLIDE_MS = 20_000
const STATS_SLIDE_MS = 60_000

/** Default autoplay delay when a slide has no `data-swiper-autoplay` (all dashboard slides set one). */
const DEFAULT_SWIPER_AUTOPLAY_MS = TOP_PLAYERS_SLIDE_MS

function slideAutoplayDelay(isLooping: boolean, ms: number): { 'data-swiper-autoplay': number } | Record<string, never> {
    return isLooping ? { 'data-swiper-autoplay': ms } : {}
}

export default function Dashboard() {
    const { t } = useTranslation('pages')
    const router = useRouter()
    const competitionIdParam = router.query.competitionId
    const competitionId =
        competitionIdParam != null && competitionIdParam !== ''
            ? Number(competitionIdParam)
            : null

    const isLooping = router.isReady ? router.query.loop !== 'off' : true
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
                            <Typography textAlign="center">{t('dashboard.openWithId')}</Typography>
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
            <DashboardSwiper competitionId={competitionId} isLooping={isLooping} />
        </ThemeProvider>
    )
}

function DashboardSwiper({ competitionId, isLooping }: { competitionId: number; isLooping: boolean }) {
    const { t } = useTranslation('pages')
    const swiperRef = useRef<any>(null)
    const { topPlayersByDivision, loading, error } = useTopPlayersByDivision(competitionId)
    const divisionEntries = Object.entries(topPlayersByDivision)

    useEffect(() => {
        const s = swiperRef.current
        if (!s?.update) return
        requestAnimationFrame(() => s.update())
    }, [loading, divisionEntries.length, error])

    return (
        <Box
            sx={{
                height: '100vh',
                maxHeight: '100dvh',
                width: '100%',
                bgcolor: 'background.default',
                color: 'text.primary',
                boxSizing: 'border-box',
            }}
        >
        <Swiper
            key={isLooping ? 'loop' : 'no-loop'}
            onSwiper={(swiper) => { swiperRef.current = swiper }}
            modules={[Autoplay, Keyboard]}
            keyboard={{ enabled: true }}
            /* `loop` duplicates slides in the DOM; nested Swiper inside slide 1 breaks on clones — use rewind instead. */
            loop={false}
            rewind={isLooping}
            spaceBetween={50}
            slidesPerView={1}
            autoplay={isLooping ? { delay: DEFAULT_SWIPER_AUTOPLAY_MS, disableOnInteraction: false } : false}
            style={{ height: '100%', width: '100%' }}
        >
            <SwiperSlide {...slideAutoplayDelay(isLooping, TOP_HOLES_AUTOPLAY_MS)}>
                <TopHolesSlide competitionId={competitionId} isLooping={isLooping} />
            </SwiperSlide>
            {loading && divisionEntries.length === 0 ? (
                <SwiperSlide {...slideAutoplayDelay(isLooping, TOP_PLAYERS_SLIDE_MS)}>
                    <Box
                        sx={{
                            p: 6,
                            height: '100%',
                            minHeight: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'background.default',
                            color: 'text.primary',
                        }}
                    >
                        <Typography>{t('dashboard.loading')}</Typography>
                    </Box>
                </SwiperSlide>
            ) : error && divisionEntries.length === 0 ? (
                <SwiperSlide {...slideAutoplayDelay(isLooping, TOP_PLAYERS_SLIDE_MS)}>
                    <Box
                        sx={{
                            p: 6,
                            height: '100%',
                            minHeight: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'background.default',
                            color: 'text.primary',
                        }}
                    >
                        <Typography color="error">{error}</Typography>
                    </Box>
                </SwiperSlide>
            ) : divisionEntries.length === 0 ? (
                <SwiperSlide {...slideAutoplayDelay(isLooping, TOP_PLAYERS_SLIDE_MS)}>
                    <Box
                        sx={{
                            p: 6,
                            height: '100%',
                            minHeight: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'background.default',
                            color: 'text.primary',
                        }}
                    >
                        <Typography>{t('dashboard.noDivisions')}</Typography>
                    </Box>
                </SwiperSlide>
            ) : (
                divisionEntries.map(([division, players]) => (
                    <SwiperSlide key={division} {...slideAutoplayDelay(isLooping, TOP_PLAYERS_SLIDE_MS)}>
                        <TopPlayersByDivisionContent division={division} players={players} />
                    </SwiperSlide>
                ))
            )}
            <SwiperSlide key="prediction-results" {...slideAutoplayDelay(isLooping, PREDICTION_SLIDE_MS)}>
                <PredictionResultsSlide
                    competitionId={competitionId}
                    title={t('dashboard.predictionTitle')}
                    loadingLabel={t('dashboard.loading')}
                    emptyLabel={t('dashboard.predictionNoData')}
                />
            </SwiperSlide>
            <SwiperSlide {...slideAutoplayDelay(isLooping, STATS_SLIDE_MS)}>
                <StatsSlide competitionId={competitionId} />
            </SwiperSlide>
        </Swiper>
        </Box>
    )
}
