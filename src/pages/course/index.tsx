import {useEffect, useRef, useState} from 'react'
import {Swiper, SwiperSlide} from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import {Navigation} from 'swiper/modules'
import Layout from '@/src/components/Layout'
import Image from 'next/image'
import {Box, Button, IconButton, Typography} from '@mui/material'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import useCtpApi, {HoleResult} from '@/src/api/useCtpApi'

export default function CoursePage() {
    const totalCards = 100
    const cards = Array.from({length: totalCards}, (_, i) => i + 1)

    const {getHole} = useCtpApi()

    const prevRef = useRef<HTMLButtonElement | null>(null)
    const nextRef = useRef<HTMLButtonElement | null>(null)
    const [swiperInstance, setSwiperInstance] = useState<any>(null)

    const [currentHoleNumber, setCurrentHoleNumber] = useState<number>(1)
    const [holeInfo, setHoleInfo] = useState<Record<number, HoleResult | null>>({}) // Cache fetched holes

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
        // Load hole data when hole number changes (if not already cached)
        if (!holeInfo[currentHoleNumber]) {
            getHole(currentHoleNumber).then((data) => {
                setHoleInfo((prev) => ({
                    ...prev,
                    [currentHoleNumber]: data,
                }))
            })
        }
    }, [currentHoleNumber])

    return (
        <Layout>
            <Box textAlign="center" mt={2}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Rada
                </Typography>

                <Swiper
                    modules={[Navigation]}
                    spaceBetween={30}
                    slidesPerView={1}
                    onSwiper={(swiper) => setSwiperInstance(swiper)}
                    onSlideChange={(swiper) => setCurrentHoleNumber(swiper.activeIndex + 1)}
                    style={{maxWidth: 500, margin: '0 auto'}}
                >
                    {cards.map((number) => (
                        <SwiperSlide key={number}>
                            <Image
                                src={`/cards/${number}.webp`}
                                alt={`Rada ${number}`}
                                width={500}
                                height={700}
                                layout="responsive"
                            />
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

                {/* Hole Info */}
                {holeInfo[currentHoleNumber] && (
                    <Box mt={4}>
                        {holeInfo[currentHoleNumber]?.hole.is_ctp ? (
                            <>
                                <Typography color="primary">
                                    🎯 Sellel korvil toimub CTP mäng
                                </Typography>
                                <Button variant="contained" color="primary" onClick={() => {
                                    window.location.href = `/ctp/${currentHoleNumber}`
                                }}>
                                    Märgi CTP
                                </Button>
                            </>
                        ) : ''}
                    </Box>
                )}
            </Box>
        </Layout>
    )
}
