import {useCallback, useEffect, useRef, useState} from 'react'
import {Swiper, SwiperSlide} from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import {Navigation} from 'swiper/modules'
import Layout from '@/src/components/Layout'
import {Box, Button, IconButton, TextField, Typography} from '@mui/material'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import useCtpApi, {HoleResult} from '@/src/api/useCtpApi'
import useMetrixApi from '@/src/api/useMetrixApi'
import {debounce} from 'lodash'
import HoleCard from "@/src/components/HoleCard";

type HoleCacheEntry = {
    data: HoleResult
    fetchedAt: number
}

export default function CoursePage() {
    const totalCards = 100
    const cards = Array.from({length: totalCards}, (_, i) => i + 1)

    const {getHole} = useCtpApi()
    const {getUserCurrentHoleNumber} = useMetrixApi()

    const prevRef = useRef<HTMLButtonElement | null>(null)
    const nextRef = useRef<HTMLButtonElement | null>(null)
    const [swiperInstance, setSwiperInstance] = useState<any>(null)

    const [currentHoleNumber, setCurrentHoleNumber] = useState<number>(1)
    const [initialHole, setInitialHole] = useState<number | null>(null)
    const [initialSlideToDone, setInitialSlideToDone] = useState(false)

    const [holeInfo, setHoleInfo] = useState<Record<number, HoleCacheEntry>>({})
    const [searchInput, setSearchInput] = useState<string>('')
    const [lastUpdated, setLastUpdated] = useState<number | null>(null)

    const loadHole = async (holeNumber: number, forceRefresh = false) => {
        const cacheEntry = holeInfo[holeNumber]
        const now = Date.now()
        const maxAge = 5 * 60 * 1000

        if (!forceRefresh && cacheEntry && now - cacheEntry.fetchedAt < maxAge) return

        const data = await getHole(holeNumber)
        if (!data) return

        setHoleInfo((prev) => ({
            ...prev,
            [holeNumber]: {
                data,
                fetchedAt: now,
            },
        }))

        if (holeNumber === currentHoleNumber) {
            setLastUpdated(now)
        }
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

    useEffect(() => {
        if (typeof window === "undefined") return;

        // Logs whenever the main thread is blocked for >50ms
        const obs = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                // entry.duration is how long the main thread was blocked
                console.log("[LongTask]", entry.duration.toFixed(1), "ms", entry);
            }
        });

        try {
            // "longtask" supported in Chromium; Firefox may not show it
            obs.observe({entryTypes: ["longtask"] as any});
        } catch {
        }

        return () => obs.disconnect();
    }, []);

    // fetch user's current hole once; set initialHole (fallback to 1)
    useEffect(() => {
        const init = async () => {
            try {
                const ch = await getUserCurrentHoleNumber()
                const hole = ch && ch >= 1 && ch <= totalCards ? ch : 1
                setInitialHole(hole)
                console.log('Initial hole set to', hole)
            } catch (e) {
                console.warn('Failed to load current hole, defaulting to 1:', e)
                setInitialHole(1)
            }
        }
        console.log('Fetching user current hole number...')
        init()
    }, [])

    // after swiper is ready AND initialHole is known, jump once (no animation)
    useEffect(() => {
        if (!swiperInstance) return
        if (initialHole == null) return
        if (initialSlideToDone) return

        swiperInstance.slideTo(initialHole - 1, 0)
        setCurrentHoleNumber(initialHole)
        setInitialSlideToDone(true)
    }, [swiperInstance, initialHole, initialSlideToDone])

    // preload current, prev, next — but only after initial slide has been applied
    useEffect(() => {
        if (!initialSlideToDone) return

        if (currentHoleNumber >= 1 && currentHoleNumber <= totalCards) {
            loadHole(currentHoleNumber)
            if (currentHoleNumber > 1) loadHole(currentHoleNumber - 1)
            if (currentHoleNumber < totalCards) loadHole(currentHoleNumber + 1)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentHoleNumber, initialSlideToDone])

    useEffect(() => {
        const handleVisibilityChange = () => {
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
    }, [currentHoleNumber])

    const debouncedSlideTo = useCallback(
        debounce((holeNumber: number) => {
            if (swiperInstance && holeNumber >= 1 && holeNumber <= totalCards) {
                swiperInstance.slideTo(holeNumber - 1)
            }
        }, 400),
        [swiperInstance]
    )

    useEffect(() => () => debouncedSlideTo.cancel(), [debouncedSlideTo])

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchInput(value)
        const parsed = parseInt(value)
        if (!isNaN(parsed)) debouncedSlideTo(parsed)
    }

    const renderScoreBar = () => {
        const holeData = holeInfo[currentHoleNumber]?.data.hole
        if (!holeData) return null

        const categories = [
            {key: 'eagles', color: '#f8c600', label: 'Eagle'},
            {key: 'birdies', color: 'rgba(62,195,0,.34)', label: 'Birdie'},
            {key: 'pars', color: '#ECECECFF', label: 'Par'},
            {key: 'bogeys', color: 'rgba(244,43,3,.12)', label: 'Bogey'},
            {key: 'double_bogeys', color: 'rgba(244,43,3,.26)', label: 'Double'},
            {key: 'others', color: 'rgba(244,43,3,.42)', label: 'Triple+'},
        ]

        const total = categories.reduce(
            (sum, cat) => sum + Number(holeData[cat.key as keyof typeof holeData] ?? 0),
            0
        )
        if (total === 0) return null

        return (
            <Box mt={1}>
                <Box display="flex" height={10} borderRadius={2} overflow="hidden" width="100%">
                    {categories.map(({key, color}) => {
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
                    {categories.map(({key, color, label}) => {
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

    const formatRelativeTime = (timestamp: number): string => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000)
        if (seconds < 60) return `${seconds} sek tagasi`
        const minutes = Math.floor(seconds / 60)
        if (minutes < 60) return `${minutes} min tagasi`
        const hours = Math.floor(minutes / 60)
        return `${hours} h tagasi`
    }

    return (
        <Layout>
            <Box mt={0}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h4" fontWeight="bold">
                        Rada
                    </Typography>
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
                        inputProps={{inputMode: 'numeric', pattern: '[0-9]*'}}
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
                                {haba}
                                {isNear ? (
                                    <HoleCard
                                        maxWidth={500}
                                        number={number}
                                        hole={holeInfo[number]?.data?.hole}
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
                    {holeInfo[currentHoleNumber]?.data.hole.coordinates && (
                        <Box>
                            <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                onClick={() => {
                                    const coords = holeInfo[currentHoleNumber]!.data.hole.coordinates
                                    window.open(
                                        `https://www.google.com/maps/dir/?api=1&destination=${coords}&travelmode=walking`,
                                        '_blank'
                                    )
                                }}
                            >
                                📍 Juhata rajale
                            </Button>
                        </Box>
                    )}
                    <IconButton color="primary" ref={nextRef}>
                        <ArrowForwardIosIcon/>
                    </IconButton>
                </Box>

                {holeInfo[currentHoleNumber]?.data.hole.is_ctp && (
                    <Box mt={2} textAlign="center">
                        <Box mt={1} display="flex" justifyContent="center" gap={2} alignItems="center">
                            <Typography color="primary">🎯 Sellel korvil on CTP</Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={() => (window.location.href = `/ctp/${currentHoleNumber}`)}
                            >
                                Märgi CTP
                            </Button>
                        </Box>
                    </Box>
                )}

                <Box mt={2} display="flex" justifyContent="space-between" gap={2} alignItems="start">
                    <Typography fontSize={12}>
                        Raskuselt <strong>{holeInfo[currentHoleNumber]?.data.hole.rank}</strong>. rada (
                        {holeInfo[currentHoleNumber]?.data.hole.average_diff !== undefined
                            ? (() => {
                                const diff = holeInfo[currentHoleNumber].data.hole.average_diff
                                const rounded = Number(diff.toFixed(1))
                                if (rounded === 0) return '0'
                                return `${rounded > 0 ? '+' : ''}${rounded.toFixed(1)}`
                            })()
                            : ''}{' '}
                        viset par-ile)
                    </Typography>

                    <Typography fontSize={12} sx={{borderTop: '3px solid #f42b03'}}>
                        {holeInfo[currentHoleNumber]?.data.hole.ob_percent !== undefined
                            ? (() => {
                                const rounded = Number(holeInfo[currentHoleNumber]?.data.hole.ob_percent.toFixed(0))
                                if (rounded === 0) return '0'
                                return rounded
                            })()
                            : ''}
                        % viskas OB
                    </Typography>
                </Box>

                {renderScoreBar()}

                {holeInfo[currentHoleNumber]?.fetchedAt && (
                    <Typography fontSize={10} textAlign="center" mt={2} color="gray">
                        Uuendatud: {formatRelativeTime(holeInfo[currentHoleNumber].fetchedAt)}
                    </Typography>
                )}
            </Box>
        </Layout>
    )
}
