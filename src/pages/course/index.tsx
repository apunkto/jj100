import { useEffect, useRef, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import { Navigation } from 'swiper/modules'
import Layout from '@/src/components/Layout'
import Image from 'next/image'
import { Box, Button, Typography } from '@mui/material'

export default function CoursePage() {
    const totalCards = 100
    const cards = Array.from({ length: totalCards }, (_, i) => i + 1)

    const prevRef = useRef<HTMLButtonElement | null>(null)
    const nextRef = useRef<HTMLButtonElement | null>(null)
    const [swiperInstance, setSwiperInstance] = useState<any>(null)

    // When swiper and refs are available, initialize navigation
    useEffect(() => {
        if (swiperInstance && prevRef.current && nextRef.current) {
            swiperInstance.params.navigation.prevEl = prevRef.current
            swiperInstance.params.navigation.nextEl = nextRef.current
            swiperInstance.navigation.destroy()
            swiperInstance.navigation.init()
            swiperInstance.navigation.update()
        }
    }, [swiperInstance, prevRef.current, nextRef.current])

    return (
        <Layout>
            <Box textAlign="center" mt={4}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Rada
                </Typography>

                <Swiper
                    modules={[Navigation]}
                    spaceBetween={30}
                    slidesPerView={1}
                    onSwiper={(swiper) => setSwiperInstance(swiper)}
                    style={{ maxWidth: 500, margin: '0 auto' }}
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

                <Box display="flex" justifyContent="center" mt={3} gap={2}>
                    <Button variant="contained" color="primary" ref={prevRef}>
                        Eelmine
                    </Button>
                    <Button variant="contained" color="primary" ref={nextRef}>
                        Järgmine
                    </Button>
                </Box>
            </Box>
        </Layout>
    )
}
