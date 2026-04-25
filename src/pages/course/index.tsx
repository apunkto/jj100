import {useEffect, useMemo, useRef, useState} from 'react'
import {Swiper, SwiperSlide} from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import {Navigation} from 'swiper/modules'
import Layout from '@/src/components/Layout'
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    TextField,
    Typography,
    useMediaQuery
} from '@mui/material'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import useCtpApi, {Hole} from '@/src/api/useCtpApi'
import useMetrixApi from '@/src/api/useMetrixApi'
import {useAuth} from '@/src/contexts/AuthContext'
import debounce from 'lodash/debounce'
import HoleCard from "@/src/components/HoleCard"
import {SCORE_CATEGORY_COLORS, ScoreResultCircle} from '@/src/components/ScoreResultCircle'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import GpsFixedIcon from '@mui/icons-material/GpsFixed'
import CloseIcon from '@mui/icons-material/Close'
import {useRouter} from 'next/router'
import {useTranslation} from 'react-i18next'

type HoleCacheEntry = {
    data: Hole
    fetchedAt: number
}

type LatLngLiteral = {
    lat: number
    lng: number
}

type CourseKmlMarker = {
    position: LatLngLiteral
    holeNumber: string
    kind: 'tee' | 'basket'
}

type CourseFairwayPath = {
    holeNumber: string
    path: LatLngLiteral[]
}

type GoogleMap = {
    fitBounds: (bounds: GoogleLatLngBounds, padding?: number) => void
    setHeading?: (heading: number) => void
}

type GoogleLatLngBounds = {
    extend: (point: LatLngLiteral) => void
}

type GoogleMapsApi = {
    Map: new (element: HTMLElement, options: {
        center: LatLngLiteral
        zoom: number
        mapTypeId: string
        fullscreenControl: boolean
        mapTypeControl: boolean
        streetViewControl: boolean
    }) => GoogleMap
    Marker: new (options: {
        position: LatLngLiteral
        map: GoogleMap
        label: string | {
            text: string
            color: string
            fontSize: string
            fontWeight: string
        }
        title: string
        icon?: {
            path: number
            scale: number
            fillColor: string
            fillOpacity: number
            strokeColor: string
            strokeWeight: number
            labelOrigin: unknown
        }
    }) => unknown
    Polyline: new (options: {
        path: LatLngLiteral[]
        map: GoogleMap
        strokeWeight: number
        strokeOpacity: number
        strokeColor?: string
        icons?: Array<{
            icon: {
                path: number
                scale: number
                fillColor: string
                fillOpacity: number
                strokeColor: string
                strokeOpacity: number
                strokeWeight: number
            }
            offset: string
            repeat: string
        }>
        zIndex?: number
    }) => unknown
    LatLngBounds: new () => GoogleLatLngBounds
    Point: new (x: number, y: number) => unknown
    SymbolPath: {
        CIRCLE: number
    }
}

type GoogleMapsGlobal = {
    maps: GoogleMapsApi
}

declare global {
    interface Window {
        google?: GoogleMapsGlobal
        initCourseNavigationMap?: () => void
    }
}

const DEFAULT_TOTAL_CARDS = 100
const GOOGLE_MAPS_API_KEY = 'AIzaSyCy0sLiAbVop7U805jotdW6FY9b6gzVHQw'
const GOOGLE_MAPS_SCRIPT_ID = 'course-navigation-google-maps'
const COURSE_KML_URL = '/kml/data.kml'
const FAIRWAY_KML_URL = '/kml/Fairway.kml'

let googleMapsPromise: Promise<GoogleMapsGlobal> | null = null
let courseKmlMarkersPromise: Promise<CourseKmlMarker[]> | null = null
let fairwayKmlPathsPromise: Promise<CourseFairwayPath[]> | null = null

const parseCoordinateString = (value?: string | null): LatLngLiteral | null => {
    if (!value) return null
    const [latRaw, lngRaw] = value.split(',').map((part) => Number(part.trim()))
    if (!Number.isFinite(latRaw) || !Number.isFinite(lngRaw)) return null
    return {lat: latRaw, lng: lngRaw}
}

const parseNavigationPath = (value?: string | null): LatLngLiteral[] | null => {
    if (!value) return null

    try {
        const parsed = JSON.parse(value) as unknown
        if (!Array.isArray(parsed)) return null

        const path = parsed
            .map((point) => {
                if (!Array.isArray(point) || point.length < 2) return null
                const [lat, lng] = point.map(Number)
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
                return {lat, lng}
            })
            .filter((point): point is LatLngLiteral => point !== null)

        return path.length > 0 ? path : null
    } catch {
        return null
    }
}

const parseKmlCoordinate = (value: string | null | undefined): LatLngLiteral | null => {
    if (!value) return null
    const [lngRaw, latRaw] = value.trim().split(',').map(Number)
    if (!Number.isFinite(latRaw) || !Number.isFinite(lngRaw)) return null
    return {lat: latRaw, lng: lngRaw}
}

const parseKmlCoordinateList = (value: string | null | undefined): LatLngLiteral[] => {
    if (!value) return []

    return value
        .trim()
        .split(/\s+/)
        .map(parseKmlCoordinate)
        .filter((point): point is LatLngLiteral => point !== null)
}

const getBearingDegrees = (from: LatLngLiteral, to: LatLngLiteral) => {
    const fromLat = (from.lat * Math.PI) / 180
    const toLat = (to.lat * Math.PI) / 180
    const deltaLng = ((to.lng - from.lng) * Math.PI) / 180

    const y = Math.sin(deltaLng) * Math.cos(toLat)
    const x = Math.cos(fromLat) * Math.sin(toLat) - Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLng)
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

const loadCourseKmlMarkers = () => {
    if (courseKmlMarkersPromise) return courseKmlMarkersPromise

    courseKmlMarkersPromise = fetch(COURSE_KML_URL)
        .then((response) => {
            if (!response.ok) throw new Error('Course KML failed to load')
            return response.text()
        })
        .then((kmlText) => {
            const xml = new DOMParser().parseFromString(kmlText, 'application/xml')
            const placemarks = Array.from(xml.getElementsByTagName('Placemark'))

            return placemarks
                .map((placemark): CourseKmlMarker | null => {
                    const holeNumber = placemark.getElementsByTagName('name')[0]?.textContent?.trim()
                    const description = placemark.getElementsByTagName('description')[0]?.textContent?.trim()
                    const coordinates = placemark.getElementsByTagName('coordinates')[0]?.textContent
                    const position = parseKmlCoordinate(coordinates)

                    if (!holeNumber || !position) return null
                    if (description !== 'tii' && description !== 'korv') return null

                    return {
                        position,
                        holeNumber,
                        kind: description === 'tii' ? 'tee' : 'basket',
                    }
                })
                .filter((marker): marker is CourseKmlMarker => marker !== null)
        })

    return courseKmlMarkersPromise
}

const loadFairwayKmlPaths = () => {
    if (fairwayKmlPathsPromise) return fairwayKmlPathsPromise

    fairwayKmlPathsPromise = fetch(FAIRWAY_KML_URL)
        .then((response) => {
            if (!response.ok) throw new Error('Fairway KML failed to load')
            return response.text()
        })
        .then((kmlText) => {
            const xml = new DOMParser().parseFromString(kmlText, 'application/xml')
            const placemarks = Array.from(xml.getElementsByTagName('Placemark'))

            return placemarks
                .map((placemark): CourseFairwayPath | null => {
                    const holeNumber = placemark.getElementsByTagName('name')[0]?.textContent?.trim()
                    const coordinates = placemark.getElementsByTagName('coordinates')[0]?.textContent
                    const path = parseKmlCoordinateList(coordinates)

                    if (!holeNumber || path.length < 2) return null
                    return {holeNumber, path}
                })
                .filter((fairway): fairway is CourseFairwayPath => fairway !== null)
        })

    return fairwayKmlPathsPromise
}

const loadGoogleMaps = () => {
    if (typeof window === 'undefined') return Promise.reject(new Error('Google Maps can only load in the browser'))
    if (window.google?.maps) return Promise.resolve(window.google)
    if (googleMapsPromise) return googleMapsPromise

    googleMapsPromise = new Promise<GoogleMapsGlobal>((resolve, reject) => {
        window.initCourseNavigationMap = () => {
            if (window.google?.maps) {
                resolve(window.google)
            } else {
                reject(new Error('Google Maps failed to initialize'))
            }
        }

        const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID)
        if (existingScript) return

        const script = document.createElement('script')
        script.id = GOOGLE_MAPS_SCRIPT_ID
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initCourseNavigationMap`
        script.async = true
        script.defer = true
        script.onerror = () => reject(new Error('Google Maps failed to load'))
        document.head.appendChild(script)
    })

    return googleMapsPromise
}

function CourseNavigationMap({
    fromBasket,
    toTee,
    path,
    fairwayHoleNumber,
}: {
    fromBasket: LatLngLiteral
    toTee: LatLngLiteral
    path: LatLngLiteral[]
    fairwayHoleNumber: number
}) {
    const mapRef = useRef<HTMLDivElement | null>(null)
    const [mapLoadError, setMapLoadError] = useState(false)

    useEffect(() => {
        let cancelled = false

        Promise.all([loadGoogleMaps(), loadCourseKmlMarkers(), loadFairwayKmlPaths()])
            .then(([{maps}, courseMarkers, fairwayPaths]) => {
                if (cancelled || !mapRef.current) return

                mapRef.current.innerHTML = ''
                const map = new maps.Map(mapRef.current, {
                    center: fromBasket,
                    zoom: 18,
                    mapTypeId: 'hybrid',
                    fullscreenControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                })

                const currentFairwayPath = fairwayPaths.find((fairway) => Number(fairway.holeNumber) === fairwayHoleNumber)?.path ?? []

                fairwayPaths.forEach((fairway) => {
                    new maps.Polyline({
                        path: fairway.path,
                        map,
                        strokeColor: '#FFD600',
                        strokeWeight: 3,
                        strokeOpacity: 0.75,
                        zIndex: 1,
                    })
                })

                courseMarkers.forEach((marker) => {
                    const isTee = marker.kind === 'tee'
                    new maps.Marker({
                        position: marker.position,
                        map,
                        label: {
                            text: marker.holeNumber,
                            color: '#ffffff',
                            fontSize: '10px',
                            fontWeight: '700',
                        },
                        title: `${isTee ? 'Tee' : 'Basket'} ${marker.holeNumber}`,
                        icon: {
                            path: maps.SymbolPath.CIRCLE,
                            scale: 9,
                            fillColor: isTee ? '#FFD600' : '#0288D1',
                            fillOpacity: 0.95,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                            labelOrigin: new maps.Point(0, 0),
                        },
                    })
                })

                new maps.Polyline({
                    path,
                    map,
                    strokeWeight: 0,
                    strokeOpacity: 0,
                    icons: [
                        {
                            icon: {
                                path: maps.SymbolPath.CIRCLE,
                                scale: 4,
                                fillColor: '#4FC3F7',
                                fillOpacity: 1,
                                strokeColor: '#0288D1',
                                strokeOpacity: 1,
                                strokeWeight: 1,
                            },
                            offset: '0',
                            repeat: '16px',
                        },
                    ],
                    zIndex: 2,
                })

                const bounds = new maps.LatLngBounds()
                ;[fromBasket, toTee, ...path, ...currentFairwayPath].forEach((point) => bounds.extend(point))
                map.fitBounds(bounds, 32)

                if (currentFairwayPath.length >= 2) {
                    map.setHeading?.(getBearingDegrees(currentFairwayPath[0], currentFairwayPath[currentFairwayPath.length - 1]))
                }
            })
            .catch(() => {
                if (!cancelled) setMapLoadError(true)
            })

        return () => {
            cancelled = true
        }
    }, [fairwayHoleNumber, fromBasket, path, toTee])

    return (
        <Box sx={{position: 'relative', width: '100%', height: {xs: '100%', sm: 600}}}>
            <Box ref={mapRef} sx={{width: '100%', height: '100%'}} />
            {mapLoadError && (
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'background.paper',
                        px: 2,
                        textAlign: 'center',
                    }}
                >
                    <Typography color="error">Google Maps laadimine ebaõnnestus.</Typography>
                </Box>
            )}
        </Box>
    )
}

// Score categories for bar (order: eagle → birdie → par → bogey → double → triple+); colors shared with ScoreResultCircle
const SCORE_CATEGORIES = [
    { key: 'eagles', color: SCORE_CATEGORY_COLORS.eagles, label: 'Eagle' },
    { key: 'birdies', color: SCORE_CATEGORY_COLORS.birdies, label: 'Birdie' },
    { key: 'pars', color: SCORE_CATEGORY_COLORS.pars, label: 'Par' },
    { key: 'bogeys', color: SCORE_CATEGORY_COLORS.bogeys, label: 'Bogey' },
    { key: 'double_bogeys', color: SCORE_CATEGORY_COLORS.doubleBogeys, label: 'Double' },
    { key: 'others', color: SCORE_CATEGORY_COLORS.tripleOrWorse, label: 'Triple+' },
]

export default function CoursePage() {
    const { t } = useTranslation('pages')
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
    const initialSlideApplied = useRef(false)

    const [holeInfo, setHoleInfo] = useState<Record<number, HoleCacheEntry>>({})
    const [searchInput, setSearchInput] = useState<string>('')
    const [navDialogOpen, setNavDialogOpen] = useState(false)
    const navDialogFullScreen = useMediaQuery('(max-width:600px)')

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
            return
        }
        setInitialHole(null)
        initialSlideApplied.current = false
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
        if (!swiperInstance || initialHole == null) return
        if (initialSlideApplied.current) return

        swiperInstance.slideTo(initialHole - 1, 0)
        setCurrentHoleNumber(initialHole)
        initialSlideApplied.current = true
    }, [swiperInstance, initialHole])

    // preload current, prev, next — only when we have competitionId (loadHole no-op without it)
    useEffect(() => {
        if (authLoading || user?.activeCompetitionId == null || initialHole == null) return

        if (currentHoleNumber >= 1 && currentHoleNumber <= totalCards) {
            loadHole(currentHoleNumber)
            if (currentHoleNumber > 1) loadHole(currentHoleNumber - 1)
            if (currentHoleNumber < totalCards) loadHole(currentHoleNumber + 1)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, user?.activeCompetitionId, currentHoleNumber, initialHole])

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

    const scoreLabel = (key: string) => {
        const m: Record<string, string> = {
            eagles: t('stats.scoreEagle'),
            birdies: t('stats.scoreBirdie'),
            pars: t('stats.scorePar'),
            bogeys: t('stats.scoreBogey'),
            double_bogeys: t('stats.scoreDouble'),
            others: t('stats.scoreTriple'),
        }
        return m[key] ?? key
    }

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
                    {SCORE_CATEGORIES.map(({key, color}) => {
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
                                {scoreLabel(key)}: {value}
                            </Box>
                        )
                    })}
                </Box>
            </Box>
        )
    }

    const currentHole = holeInfo[currentHoleNumber]?.data
    const previousHole = currentHoleNumber > 1 ? holeInfo[currentHoleNumber - 1]?.data : null
    const transitionRoute = useMemo(() => {
        const path = parseNavigationPath(currentHole?.nav_from_previous)
        if (!path || path.length < 2) return null

        return {
            fromBasket: parseCoordinateString(previousHole?.target_coordinates) ?? path[0],
            toTee: parseCoordinateString(currentHole?.coordinates) ?? path[path.length - 1],
            path,
            destinationHoleNumber: currentHoleNumber,
            fairwayHoleNumber: currentHoleNumber - 1,
        }
    }, [currentHole?.coordinates, currentHole?.nav_from_previous, currentHoleNumber, previousHole?.target_coordinates])
    const hasCtp = !!currentHole?.is_ctp
    const hasFood = !!currentHole?.is_food
    const isAdmin = user?.isAdmin ?? false
    const par = currentHole?.par ?? 3
    const userResult = currentHole?.user_result ?? null
    const userHasPenalty = !!currentHole?.user_has_penalty
    const resultNum = userResult != null ? parseInt(userResult, 10) : NaN

    return (
        <Layout>
            <Box mt={0}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h4" fontWeight="bold" component="span">
                            {t('course.basket', { n: currentHoleNumber })}
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
                                title={t('course.foodPointTitle')}
                                sx={{ display: 'inline-flex', alignItems: 'center', lineHeight: 0 }}
                            >
                                <RestaurantIcon color="primary" fontSize="small" />
                            </Box>
                        )}
                    </Box>

                    <TextField
                        size="small"
                        placeholder={t('course.searchPlaceholder')}
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
                                    {t('course.myResult')}
                                </Typography>
                                <ScoreResultCircle
                                    value={userResult}
                                    strokes={resultNum}
                                    par={par}
                                    hasPenalty={userHasPenalty}
                                />
                            </Box>
                        ) : currentHole?.coordinates || transitionRoute ? (
                            <Box display="flex" justifyContent="center" flexWrap="wrap" gap={1}>
                                {currentHole?.coordinates && (
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                        onClick={() => {
                                            const coords = currentHole.coordinates
                                            window.open(
                                                `https://www.google.com/maps/dir/?api=1&destination=${coords}&travelmode=walking`,
                                                '_blank'
                                            )
                                        }}
                                    >
                                        {t('course.navigateToHole')}
                                    </Button>
                                )}
                                {isAdmin && transitionRoute && (
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                        onClick={() => setNavDialogOpen(true)}
                                    >
                                        {t('course.navigateToNextHoleTitle', {n: transitionRoute.destinationHoleNumber})}
                                    </Button>
                                )}
                            </Box>
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
                            <Typography color="primary">{t('course.hasCtp')}</Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={() => router.push(`/ctp/${currentHoleNumber}`)}
                            >
                                {t('course.markCtp')}
                            </Button>
                        </Box>
                    </Box>
                )}

                {holeInfo[currentHoleNumber]?.data.is_food && (
                    <Box  textAlign="center">
                        <Box mt={1} display="flex" justifyContent="center" gap={1} alignItems="center">
                            <RestaurantIcon color="primary" fontSize="small" />
                            <Typography color="primary">{t('course.foodPointTitle')}</Typography>
                        </Box>
                    </Box>
                )}

                <Box mt={2} display="flex" justifyContent="space-between" gap={2} alignItems="start">
                    <Typography fontSize={12}>
                        {(() => {
                            const rank = holeInfo[currentHoleNumber]?.data.rank
                            const diffRaw = holeInfo[currentHoleNumber]?.data.average_diff
                            let diffStr = ''
                            if (diffRaw !== undefined) {
                                const rounded = Number(diffRaw.toFixed(1))
                                diffStr = rounded === 0 ? '0' : `${rounded > 0 ? '+' : ''}${rounded.toFixed(1)}`
                            }
                            return t('course.difficulty', { rank: rank ?? '', diff: diffStr })
                        })()}
                    </Typography>

                    <Typography fontSize={12} sx={{borderTop: '3px solid #f42b03'}}>
                        {holeInfo[currentHoleNumber]?.data.ob_percent !== undefined
                            ? t('course.obPercent', {
                                  pct:
                                      (() => {
                                          const rounded = Number(
                                              holeInfo[currentHoleNumber]?.data.ob_percent!.toFixed(0),
                                          )
                                          if (rounded === 0) return '0'
                                          return String(rounded)
                                      })(),
                              })
                            : ''}
                    </Typography>
                </Box>

                {renderScoreBar()}

            </Box>
            <Dialog
                open={navDialogOpen && transitionRoute !== null}
                onClose={() => setNavDialogOpen(false)}
                fullScreen={navDialogFullScreen}
                fullWidth
                maxWidth="md"
                slotProps={{
                    paper: {
                        sx: {
                            overflow: 'hidden',
                            height: {xs: '100dvh', sm: 'auto'},
                        },
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        px: 2,
                        py: 1,
                    }}
                >
                    <Typography variant="h6" component="span" noWrap>
                        {transitionRoute
                            ? t('course.navigateToNextHoleTitle', {n: transitionRoute.destinationHoleNumber})
                            : t('course.navigateToNextHole')}
                    </Typography>
                    <IconButton
                        aria-label={t('course.closeNavigationMap')}
                        color="primary"
                        edge="end"
                        onClick={() => setNavDialogOpen(false)}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{p: {xs: 0, sm: 2}, flex: 1, minHeight: 0, display: 'flex'}}>
                    {transitionRoute && (
                        <CourseNavigationMap
                            fromBasket={transitionRoute.fromBasket}
                            toTee={transitionRoute.toTee}
                            path={transitionRoute.path}
                            fairwayHoleNumber={transitionRoute.fairwayHoleNumber}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </Layout>
    )
}
