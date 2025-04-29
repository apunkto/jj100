import {useCallback, useEffect, useRef, useState} from 'react'
import {Swiper, SwiperSlide} from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import {Navigation} from 'swiper/modules'
import Layout from '@/src/components/Layout'
import Image from 'next/image'
import {Box, IconButton, Typography, TextField, Button} from '@mui/material'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import useCtpApi, {HoleResult} from '@/src/api/useCtpApi'
import {debounce} from 'lodash'

export default function CoursePage() {
    const totalCards = 100
    const cards = Array.from({length: totalCards}, (_, i) => i + 1)

    const {getHole} = useCtpApi()

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

            // Preload previous hole if it exists
            if (currentHoleNumber > 1) {
                loadHole(currentHoleNumber - 1)
            }

            // Preload next hole if it exists
            if (currentHoleNumber < totalCards) {
                loadHole(currentHoleNumber + 1)
            }
        }
    }, [currentHoleNumber, getHole, holeInfo])


    // Debounced function
    const debouncedSlideTo = useCallback(
        debounce((holeNumber: number) => {
            if (swiperInstance && holeNumber >= 1 && holeNumber <= totalCards) {
                swiperInstance.slideTo(holeNumber - 1)
            }
        }, 400),
        [swiperInstance]
    )

    useEffect(() => {
        return () => debouncedSlideTo.cancel()
    }, [debouncedSlideTo])


    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchInput(value)

        const parsed = parseInt(value)
        if (!isNaN(parsed)) {
            debouncedSlideTo(parsed)
        }
    }

    return (
        <Layout>
            <Box mt={0}>
                {/* Header with Title and Search */}
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
                            width: 80,
                            '& .MuiInputBase-root': {
                                paddingTop: '2px',
                                paddingBottom: '2px',
                                fontSize: '0.8rem',
                            },
                            '& input': {
                                padding: '6px 8px',
                            },
                        }}
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                    />

                </Box>

                <Swiper
                    modules={[Navigation]}
                    spaceBetween={10}  // Space between slides
                    centeredSlides={true}  // Center active slide
                    slidesPerView={"auto"}  // Each slide can have its own width
                    onSwiper={(swiper) => setSwiperInstance(swiper)}
                    onSlideChange={(swiper) => setCurrentHoleNumber(swiper.activeIndex + 1)}
                    style={{maxWidth: '550px', margin: '0 auto', width: '100%'}}
                >
                    {cards.map((number) => (
                        <SwiperSlide key={number} style={{width: '90%'}}>

                            <Box
                                sx={{
                                    position: 'relative',
                                    width: '100%',
                                    paddingTop: '141.4%', // maintain aspect ratio
                                    borderRadius: '15px',
                                    overflow: 'hidden',
                                }}
                            >
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        zIndex: 2,
                                        right: '12%',
                                        top: '7.5%',
                                        transform: 'translateY(-50%)',  // Pull up by 50% of its own height
                                    }}
                                >
                                    <Typography
                                        variant="h4"
                                        fontWeight="bold"
                                        sx={{
                                            fontSize: 'clamp(4px, 4vw, 24px)',
                                            color: 'black',
                                            fontFamily: 'Alatsi, sans-serif',
                                        }}
                                    >
                                        {holeInfo[number]?.hole.length}
                                    </Typography>
                                </Box>
                                <Image
                                    src={`/cards/${number}.webp`}
                                    alt={`Rada ${number}`}
                                    layout="fill"
                                    objectFit="cover"
                                    style={{
                                        borderRadius: '10px', // <-- directly on the img
                                    }}
                                    sizes="(max-width: 600px) 100vw, 500px"
                                />
                            </Box>
                        </SwiperSlide>


                    ))}
                </Swiper>

                <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} mt={1}>
                    <IconButton color="primary" ref={prevRef}>
                        <ArrowBackIosNewIcon/>
                    </IconButton>
                    {holeInfo[currentHoleNumber]?.hole.coordinates && (
                        <Box>

                            <Button variant="outlined" color="primary" size="small"
                                    onClick={() => {
                                        const coords = holeInfo[currentHoleNumber]!.hole.coordinates
                                        const url = `https://www.google.com/maps/dir/?api=1&destination=${coords}&travelmode=walking`

                                        window.open(
                                            url,
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

                {holeInfo[currentHoleNumber] && (
                    <Box mt={1} textAlign="center">
                        {holeInfo[currentHoleNumber]?.hole.is_ctp ? (
                            <>
                                <Typography color="primary">
                                    🎯 Sellel korvil on CTP
                                </Typography>
                                <Box mt={1}>
                                    <Button variant="contained" color="primary" size="small"
                                            onClick={() => {
                                                window.location.href = `/ctp/${currentHoleNumber}`
                                            }}
                                    >
                                        Märgi CTP
                                    </Button>
                                </Box>
                            </>
                        ) : ''}


                    </Box>
                )}
            </Box>
        </Layout>
    )
}
