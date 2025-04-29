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
        if (!holeInfo[currentHoleNumber]) {
            getHole(currentHoleNumber).then((data) => {
                setHoleInfo((prev) => ({
                    ...prev,
                    [currentHoleNumber]: data,
                }))
            })
        }
    }, [currentHoleNumber])

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
            <Box mt={2}>
                {/* Header with Title and Search */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h4" fontWeight="bold">
                        Rada
                    </Typography>
                    <TextField
                        size="small"
                        placeholder="Otsi korvi..."
                        value={searchInput}
                        onChange={handleSearchChange}
                        sx={{width: 120}}
                        inputProps={{inputMode: 'numeric', pattern: '[0-9]*'}}
                    />
                </Box>

                <Swiper
                    modules={[Navigation]}
                    spaceBetween={25}
                    slidesPerView={1}
                    onSwiper={(swiper) => setSwiperInstance(swiper)}
                    onSlideChange={(swiper) => setCurrentHoleNumber(swiper.activeIndex + 1)}
                    style={{maxWidth: 400, margin: '0 auto'}}
                >
                    {cards.map((number) => (
                        <SwiperSlide key={number}>
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
                                        right: '50px',
                                        top: '28px', // maintain aspect ratio

                                    }}
                                >
                                    <Typography
                                        variant="h4"
                                        fontWeight="bold"
                                        sx={{
                                            fontSize: '22px',
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

                <Box display="flex" justifyContent="center" alignItems="center" mt={2} gap={2}>
                    <IconButton color="primary" ref={prevRef}>
                        <ArrowBackIosNewIcon/>
                    </IconButton>
                    <IconButton color="primary" ref={nextRef}>
                        <ArrowForwardIosIcon/>
                    </IconButton>
                </Box>

                {holeInfo[currentHoleNumber] && (
                    <Box mt={1} textAlign="center">
                        {holeInfo[currentHoleNumber]?.hole.is_ctp ? (
                            <>
                                <Typography color="primary">
                                    🎯 Sellel korvil toimub CTP mäng
                                </Typography>
                                <Box mt={1}>
                                    <Button
                                        onClick={() => {
                                            window.location.href = `/ctp/${currentHoleNumber}`
                                        }}
                                    >
                                        Märgi CTP
                                    </Button>
                                </Box>
                            </>
                        ) : ''}

                        {holeInfo[currentHoleNumber]?.hole.coordinates && (
                            <Box mt={2}>
                                <button
                                    onClick={() => {
                                        const coords = holeInfo[currentHoleNumber]!.hole.coordinates
                                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords}`, '_blank')
                                    }}
                                    style={{
                                        marginTop: '10px',
                                        padding: '8px 16px',
                                        backgroundColor: '#4285F4',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                    }}
                                >
                                    📍 Vaata kaardil
                                </button>
                            </Box>
                        )}
                    </Box>
                )}
            </Box>
        </Layout>
    )
}
