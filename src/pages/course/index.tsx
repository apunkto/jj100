import {useEffect, useMemo, useRef, useState} from 'react'
import {Swiper, SwiperSlide} from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import {Navigation} from 'swiper/modules'
import Layout from '@/src/components/Layout'
import {Box, Button, IconButton, TextField, Typography} from '@mui/material'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import useCtpApi, {Hole} from '@/src/api/useCtpApi'
import useMetrixApi from '@/src/api/useMetrixApi'
import {useAuth} from '@/src/contexts/AuthContext'
import debounce from 'lodash/debounce'
import HoleCard from "@/src/components/HoleCard";
import RestaurantIcon from '@mui/icons-material/Restaurant'
import GpsFixedIcon from '@mui/icons-material/GpsFixed'
import {useRouter} from 'next/router'

type HoleCacheEntry = {
    data: Hole
    fetchedAt: number
}

const DEFAULT_TOTAL_CARDS = 100

// Score categories for bar and hole result circle (order: eagle → birdie → par → bogey → double → triple+)
const SCORE_CATEGORIES = [
    { key: 'eagles', color: '#f8c600', label: 'Eagle' },
    { key: 'birdies', color: 'rgba(62,195,0,.34)', label: 'Birdie' },
    { key: 'pars', color: '#ECECECFF', label: 'Par' },
    { key: 'bogeys', color: 'rgba(244,43,3,.12)', label: 'Bogey' },
    { key: 'double_bogeys', color: 'rgba(244,43,3,.26)', label: 'Double' },
    { key: 'others', color: 'rgba(244,43,3,.42)', label: 'Triple+' },
]

function getHoleResultColor(result: number, par: number): string {
    const diff = result - par
    if (diff <= -2) return SCORE_CATEGORIES[0].color
    if (diff === -1) return SCORE_CATEGORIES[1].color
    if (diff === 0) return SCORE_CATEGORIES[2].color
    if (diff === 1) return SCORE_CATEGORIES[3].color
    if (diff === 2) return SCORE_CATEGORIES[4].color
    return SCORE_CATEGORIES[5].color
}

export default function CoursePage() {
    const [totalCards, setTotalCards] = useState<number>(DEFAULT_TOTAL_CARDS)
    const cards = Array.from({length: totalCards}, (_, i) => i + 1)

    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const {getHole, getHoleCount} = useCtpApi()
    const {getUserCurrentHoleNumber} = useMetrixApi()

    const prevRef = useRef<HTMLButtonElement | null>(null)
    const nextRef = useRef<HTMLButtonElement | null>(null)
    const [swiperInstance, setSwiperInstance] = useState<any>(null)

    const [currentHoleNumber, setCurrentHoleNumber] = useState<number>(1)
    const [initialHole, setInitialHole] = useState<number | null>(null)
    const [initialSlideToDone, setInitialSlideToDone] = useState(false)

    const [holeInfo, setHoleInfo] = useState<Record<number, HoleCacheEntry>>({})
    const [searchInput, setSearchInput] = useState<string>('')

    // Clear in-memory hole cache when user switches competition so we don't show wrong competition's data
    useEffect(() => {
        setHoleInfo({})
    }, [user?.activeCompetitionId])

    const loadHole = async (holeNumber: number, forceRefresh = false) => {
        if (user?.activeCompetitionId == null) return

        const cacheEntry = holeInfo[holeNumber]
        const now = Date.now()
        const maxAge = 5 * 60 * 1000

        if (!forceRefresh && cacheEntry && now - cacheEntry.fetchedAt < maxAge) return

        const data = await getHole(holeNumber, user.activeCompetitionId)
        if (!data) return

        setHoleInfo((prev) => ({
            ...prev,
            [holeNumber]: {
                data,
                fetchedAt: now,
            },
        }))
    }

    // wire swiper nav buttons after instance exists
    useEffect(() => {
        if (swiperInstance && prevRef.current && nextRef.current) {
            swiperInstance.params.navigation.prevEl = prevRef.current
            swiperInstance.params.navigation.nextEl = nextRef.current
            swiperInstance.navigation.destroy()
            swiperInstance.navigation.init()
            swiperInstance.navigation.update()
        }
    }, [swiperInstance])

    // fetch hole count and user's current hole only when we have a competition (no requests without competitionId)
    useEffect(() => {
        if (authLoading) return
        if (user?.activeCompetitionId == null) {
            setTotalCards(DEFAULT_TOTAL_CARDS)
            setInitialHole(1)
            return
        }
        const init = async () => {
            try {
                const [count, ch] = await Promise.all([getHoleCount(user.activeCompetitionId), getUserCurrentHoleNumber()])
                const total = count ?? DEFAULT_TOTAL_CARDS
                if (count != null) setTotalCards(total)
                const hole = ch != null && ch >= 1 && ch <= total ? ch : 1
                setInitialHole(hole)
            } catch (e) {
                console.warn('Failed to load course init, using defaults:', e)
                setInitialHole(1)
            }
        }
        init()
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when auth ready or competition changes
    }, [authLoading, user?.activeCompetitionId])

    // after swiper is ready AND initialHole is known, jump once (no animation)
    useEffect(() => {
        if (!swiperInstance) return
        if (initialHole == null) return
        if (initialSlideToDone) return

        swiperInstance.slideTo(initialHole - 1, 0)
        setCurrentHoleNumber(initialHole)
        setInitialSlideToDone(true)
    }, [swiperInstance, initialHole, initialSlideToDone])

    // preload current, prev, next — only when we have competitionId (loadHole no-op without it)
    useEffect(() => {
        if (authLoading || user?.activeCompetitionId == null || !initialSlideToDone) return

        if (currentHoleNumber >= 1 && currentHoleNumber <= totalCards) {
            loadHole(currentHoleNumber)
            if (currentHoleNumber > 1) loadHole(currentHoleNumber - 1)
            if (currentHoleNumber < totalCards) loadHole(currentHoleNumber + 1)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, user?.activeCompetitionId, currentHoleNumber, initialSlideToDone])

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (user?.activeCompetitionId == null) return
            if (document.visibilityState === 'visible') {
                loadHole(currentHoleNumber, true)
                if (currentHoleNumber > 1) loadHole(currentHoleNumber - 1, true)
                if (currentHoleNumber < totalCards) loadHole(currentHoleNumber + 1, true)
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentHoleNumber, user?.activeCompetitionId])

    const debouncedSlideTo = useMemo(
        () =>
            debounce((holeNumber: number) => {
                if (swiperInstance && holeNumber >= 1 && holeNumber <= totalCards) {
                    swiperInstance.slideTo(holeNumber - 1)
                }
            }, 400),
        [swiperInstance, totalCards]
    )

    useEffect(() => () => debouncedSlideTo.cancel(), [debouncedSlideTo])

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchInput(value)
        const parsed = parseInt(value)
        if (!isNaN(parsed)) debouncedSlideTo(parsed)
    }

    const renderScoreBar = () => {
        const holeData = holeInfo[currentHoleNumber]?.data
        if (!holeData) return null

        const total = SCORE_CATEGORIES.reduce(
            (sum, cat) => sum + Number(holeData[cat.key as keyof typeof holeData] ?? 0),
            0
        )
        if (total === 0) return null

        return (
            <Box mt={1}>
                <Box display="flex" height={10} borderRadius={2} overflow="hidden" width="100%">
                    {SCORE_CATEGORIES.map(({key, color}) => {
                        const value = holeData[key as keyof typeof holeData] || 0
                        const percent = (Number(value) / Number(total)) * 100
                        return (
                            <Box
                                key={key}
                                sx={{
                                    width: `${percent}%`,
                                    backgroundColor: color,
                                    display: percent > 0 ? 'block' : 'none',
                                    minWidth: '2px',
                                    height: '100%',
                                }}
                            />
                        )
                    })}
                </Box>

                <Box mt={1} display="flex" flexWrap="wrap" justifyContent="center" gap={1}>
                    {SCORE_CATEGORIES.map(({key, color, label}) => {
                        const value = holeData[key as keyof typeof holeData] || 0
                        if (!value) return null
                        return (
                            <Box
                                key={key}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0,
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: '20px',
                                    backgroundColor: color,
                                    color: '#000',
                                    fontWeight: 400,
                                    fontSize: '10px',
                                }}
                            >
                                {label}: {value}
                            </Box>
                        )
                    })}
                </Box>
            </Box>
        )
    }

    const currentHole = holeInfo[currentHoleNumber]?.data
    const hasCtp = !!currentHole?.is_ctp
    const hasFood = !!currentHole?.is_food
    const par = currentHole?.par ?? 3
    const userResult = currentHole?.user_result ?? null
    const userHasPenalty = !!currentHole?.user_has_penalty
    const resultNum = userResult != null ? parseInt(userResult, 10) : NaN
    const holeResultColor = !isNaN(resultNum) ? getHoleResultColor(resultNum, par) : null

    return (
        <Layout>
            <Box mt={0}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h4" fontWeight="bold" component="span">
                            Korv {currentHoleNumber}
                        </Typography>

                        {/* icons shown only when current hole has flags */}
                        {hasCtp && (
                            <Box
                                title="CTP"
                                sx={{ display: 'inline-flex', alignItems: 'center', lineHeight: 0 }}
                            >
                                {/* use either emoji or MUI icon */}
                                {/* <Typography fontSize={22}>🎯</Typography> */}
                                <GpsFixedIcon color="primary" fontSize="small" />
                            </Box>
                        )}

                        {hasFood && (
                            <Box
                                title="Toidupunkt"
                                sx={{ display: 'inline-flex', alignItems: 'center', lineHeight: 0 }}
                            >
                                <RestaurantIcon color="primary" fontSize="small" />
                            </Box>
                        )}
                    </Box>

                    <TextField
                        size="small"
                        placeholder="Otsi korvi.."
                        value={searchInput}
                        onChange={handleSearchChange}
                        sx={{
                            width: 100,
                            '& .MuiInputBase-root': {
                                paddingTop: '0px',
                                paddingBottom: '0px',
                                fontSize: '1rem',
                            },
                            '& input': {
                                padding: '3px 8px',
                                fontSize: '1rem',
                            },
                        }}
                        slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' } }}
                    />
                </Box>

                <Swiper
                    modules={[Navigation]}
                    spaceBetween={10}
                    centeredSlides
                    slidesPerView={'auto'}
                    onSwiper={setSwiperInstance}
                    onSlideChange={(swiper) => {
                        const hole = swiper.activeIndex + 1
                        setCurrentHoleNumber(hole)
                    }}
                    style={{maxWidth: '550px', margin: '0 auto', width: '100%'}}
                >
                    {cards.map((number) => {
                        const isNear = Math.abs(number - currentHoleNumber) <= 2 // tune: 1..3

                        return (

                            <SwiperSlide key={number} style={{width: "90%"}}>
                                {isNear ? (
                                    <HoleCard
                                        maxWidth={500}
                                        number={number}
                                        hole={holeInfo[number]?.data}
                                        isPriority={number === currentHoleNumber}
                                    />
                                ) : (
                                    // lightweight placeholder to keep Swiper layout stable
                                    <Box
                                        sx={{
                                            width: "100%",
                                            maxWidth: "500px",
                                            mx: "auto",
                                            aspectRatio: "5 / 7",
                                            borderRadius: "6% / 4.3%",
                                            outline: "1px solid rgba(0,0,0,0.08)",
                                            background: "rgba(0,0,0,0.03)",
                                        }}
                                    />
                                )}
                            </SwiperSlide>


                        )
                    })}

                </Swiper>

                <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} mt={1}>
                    <IconButton color="primary" ref={prevRef}>
                        <ArrowBackIosNewIcon/>
                    </IconButton>
                    <Box display="flex" alignItems="center" justifyContent="center" flex={1}>
                        {userResult != null ? (
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2" color="text.secondary">
                                    Minu tulemus:
                                </Typography>
                                <Box
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        backgroundColor: holeResultColor ?? 'action.hover',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        lineHeight: 1,
                                        ...(userHasPenalty && {
                                            border: '2px solid',
                                            borderColor: 'error.main',
                                        }),
                                    }}
                                >
                                    {userResult}
                                </Box>
                            </Box>
                        ) : holeInfo[currentHoleNumber]?.data.coordinates ? (
                            <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                onClick={() => {
                                    const coords = holeInfo[currentHoleNumber]!.data.coordinates
                                    window.open(
                                        `https://www.google.com/maps/dir/?api=1&destination=${coords}&travelmode=walking`,
                                        '_blank'
                                    )
                                }}
                            >
                                📍 Juhata rajale
                            </Button>
                        ) : null}
                    </Box>
                    <IconButton color="primary" ref={nextRef}>
                        <ArrowForwardIosIcon/>
                    </IconButton>
                </Box>

                {holeInfo[currentHoleNumber]?.data.is_ctp && (
                    <Box  textAlign="center">
                        <Box mt={1} display="flex" justifyContent="center" gap={1} alignItems="center">
                            <GpsFixedIcon color="primary" fontSize="small" />
                            <Typography color="primary">Sellel korvil on CTP</Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={() => router.push(`/ctp/${currentHoleNumber}`)}
                            >
                                Märgi CTP
                            </Button>
                        </Box>
                    </Box>
                )}

                {holeInfo[currentHoleNumber]?.data.is_food && (
                    <Box  textAlign="center">
                        <Box mt={1} display="flex" justifyContent="center" gap={1} alignItems="center">
                            <RestaurantIcon color="primary" fontSize="small" />
                            <Typography color="primary">Toidupunkt</Typography>
                        </Box>
                    </Box>
                )}

                <Box mt={2} display="flex" justifyContent="space-between" gap={2} alignItems="start">
                    <Typography fontSize={12}>
                        Raskuselt <strong>{holeInfo[currentHoleNumber]?.data.rank}</strong>. rada (
                        {holeInfo[currentHoleNumber]?.data.average_diff !== undefined
                            ? (() => {
                                const diff = holeInfo[currentHoleNumber].data.average_diff
                                const rounded = Number(diff.toFixed(1))
                                if (rounded === 0) return '0'
                                return `${rounded > 0 ? '+' : ''}${rounded.toFixed(1)}`
                            })()
                            : ''}{' '}
                        viset par-ile)
                    </Typography>

                    <Typography fontSize={12} sx={{borderTop: '3px solid #f42b03'}}>
                        {holeInfo[currentHoleNumber]?.data.ob_percent !== undefined
                            ? (() => {
                                const rounded = Number(holeInfo[currentHoleNumber]?.data.ob_percent.toFixed(0))
                                if (rounded === 0) return '0'
                                return rounded
                            })()
                            : ''}
                        % viskas OB
                    </Typography>
                </Box>

                {renderScoreBar()}

            </Box>
        </Layout>
    )
}
