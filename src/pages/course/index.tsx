import { useCallback, useEffect, useRef, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import { Navigation } from 'swiper/modules'
import Layout from '@/src/components/Layout'
import Image from 'next/image'
import { Box, IconButton, Typography, TextField, Button, LinearProgress, Tooltip } from '@mui/material'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import useCtpApi, { HoleResult } from '@/src/api/useCtpApi'
import { debounce } from 'lodash'

export default function CoursePage() {
    const totalCards = 100
    const cards = Array.from({ length: totalCards }, (_, i) => i + 1)

    const { getHole } = useCtpApi()

    const prevRef = useRef<HTMLButtonElement | null>(null)
    const nextRef = useRef<HTMLButtonElement | null>(null)
    const [swiperInstance, setSwiperInstance] = useState<any>(null)

    const [currentHoleNumber, setCurrentHoleNumber] = useState<number>(1)
    const [holeInfo, setHoleInfo] = useState<Record<number, HoleResult | null>>({})

    const [searchInput, setSearchInput] = useState<string>('')

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
        const loadHole = async (holeNumber: number) => {
            if (!holeInfo[holeNumber]) {
                const data = await getHole(holeNumber)
                setHoleInfo((prev) => ({
                    ...prev,
                    [holeNumber]: data,
                }))
            }
        }

        if (currentHoleNumber >= 1 && currentHoleNumber <= totalCards) {
            loadHole(currentHoleNumber)
            if (currentHoleNumber > 1) loadHole(currentHoleNumber - 1)
            if (currentHoleNumber < totalCards) loadHole(currentHoleNumber + 1)
        }
    }, [currentHoleNumber, getHole, holeInfo])

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
        const holeData = holeInfo[currentHoleNumber]?.hole
        if (!holeData) return null

        const categories = [
            { key: 'eagles', color: '#f8c600', label: 'Eagle' },
            { key: 'birdies', color: '#7bc87f', label: 'Birdie' },
            { key: 'pars', color: '#ddd', label: 'Par' },
            { key: 'bogeys', color: '#ffc6c6', label: 'Bogey' },
            { key: 'double_bogeys', color: '#f86969', label: 'Double' },
            { key: 'others', color: '#ff2121', label: '3+ Bogey' },
        ]

        const total = categories.reduce(
            (sum, cat) => sum + Number(holeData[cat.key as keyof typeof holeData] ?? 0),
            0
        )
        if (total === 0) return null

        return (
            <Box mt={2}>
                <Box display="flex" height={10} borderRadius={2} overflow="hidden" width="100%">
                    {categories.map(({ key, color, label }) => {
                        const value = holeData[key as keyof typeof holeData] || 0
                        const percent = (Number(value) / Number(total)) * 100;
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
                    {categories.map(({ key, color, label }) => {
                        const value = holeData[key as keyof typeof holeData] || 0
                        if (!value) return null
                        return (
                            <Box
                                key={key}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    px: 1.3,
                                    py: 0.5,
                                    borderRadius: '20px',
                                    backgroundColor: color,
                                    color: '#000',
                                    fontWeight: 500,
                                    fontSize: '12px',
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


    return (
        <Layout>
            <Box mt={0}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h4" fontWeight="bold">Rada</Typography>
                    <TextField
                        size="small"
                        placeholder="Otsi korvi.."
                        value={searchInput}
                        onChange={handleSearchChange}
                        sx={{ width: 80, '& .MuiInputBase-root': { paddingTop: '2px', paddingBottom: '2px', fontSize: '0.8rem' }, '& input': { padding: '6px 8px' } }}
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                    />
                </Box>

                <Swiper
                    modules={[Navigation]}
                    spaceBetween={10}
                    centeredSlides
                    slidesPerView={'auto'}
                    onSwiper={setSwiperInstance}
                    onSlideChange={(swiper) => setCurrentHoleNumber(swiper.activeIndex + 1)}
                    style={{ maxWidth: '550px', margin: '0 auto', width: '100%' }}
                >
                    {cards.map((number) => (
                        <SwiperSlide key={number} style={{ width: '90%' }}>
                            <Box sx={{ position: 'relative', width: '100%', paddingTop: '141.4%', borderRadius: '15px', overflow: 'hidden' }}>
                                { holeInfo[number]?.hole.length && (
                                    <Box sx={{ position: 'absolute', zIndex: 2, right: '6.5%', top: '7.5%', transform: 'translateY(-50%)' }}>
                                        <Typography variant="h4" fontWeight="regular" sx={{ fontSize: 'clamp(4px, 4.2vw, 24px)', color: 'black', fontFamily: 'Alatsi, sans-serif' }}>
                                            {holeInfo[number]?.hole.length}m
                                        </Typography>
                                    </Box>
                                )}
                                <Image
                                    src={`/cards/${number}.webp?v=2`}
                                    alt={`Rada ${number}`}
                                    layout="fill"
                                    objectFit="cover"
                                    style={{ borderRadius: '10px' }}
                                    sizes="(max-width: 600px) 100vw, 500px"
                                />
                            </Box>
                        </SwiperSlide>
                    ))}
                </Swiper>

                <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} mt={1}>
                    <IconButton color="primary" ref={prevRef}><ArrowBackIosNewIcon /></IconButton>
                    {holeInfo[currentHoleNumber]?.hole.coordinates && (
                        <Box>
                            <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                onClick={() => {
                                    const coords = holeInfo[currentHoleNumber]!.hole.coordinates
                                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords}&travelmode=walking`, '_blank')
                                }}
                            >
                                📍 Juhata rajale
                            </Button>
                        </Box>
                    )}
                    <IconButton color="primary" ref={nextRef}><ArrowForwardIosIcon /></IconButton>
                </Box>

                {renderScoreBar()}

                {holeInfo[currentHoleNumber]?.hole.is_ctp && (
                    <Box mt={1} textAlign="center">
                        <Typography color="primary">🎯 Sellel korvil on CTP</Typography>
                        <Box mt={1}>
                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={() => window.location.href = `/ctp/${currentHoleNumber}`}
                            >
                                Märgi CTP
                            </Button>
                        </Box>
                    </Box>
                )}
            </Box>
        </Layout>
    )
}
