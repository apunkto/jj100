import {useRef} from 'react'
import {Swiper, SwiperSlide} from 'swiper/react'
import {Autoplay, Keyboard} from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/autoplay'
import {Box, Typography} from '@mui/material'
import {useRouter} from 'next/router'
import TopHolesSlide from '@/src/components/dashboard/TopHolesSlide'
import {useTopPlayersByDivision} from '@/src/api/useTopPlayersByDivision'
import {TopPlayersByDivisionContent} from '@/src/components/dashboard/TopPlayersByDivisionSlide'
import StatsSlide from '@/src/components/dashboard/StatsSlide'

export default function Dashboard() {
    const router = useRouter()
    const competitionIdParam = router.query.competitionId
    const competitionId =
        competitionIdParam != null && competitionIdParam !== ''
            ? Number(competitionIdParam)
            : null

    const isLooping = router.isReady ? router.query.loop !== 'off' : true

    if (!router.isReady || competitionId == null || !Number.isFinite(competitionId)) {
        return (
            <Box
                sx={{
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >
                {!router.isReady ? (
                    <Typography>Laen...</Typography>
                ) : (
                    <>
                        <Typography variant="h5" color="error">
                            Competition required
                        </Typography>
                        <Typography>
                            Please open the dashboard with a competition ID: /dashboard?competitionId=123
                        </Typography>
                    </>
                )}
            </Box>
        )
    }

    return (
        <DashboardSwiper competitionId={competitionId} isLooping={isLooping} />
    )
}

function DashboardSwiper({ competitionId, isLooping }: { competitionId: number; isLooping: boolean }) {
    const swiperRef = useRef<any>(null)
    const { topPlayersByDivision, loading, error } = useTopPlayersByDivision(competitionId)
    const divisionEntries = Object.entries(topPlayersByDivision)

    return (
        <Swiper
            key={isLooping ? 'loop' : 'no-loop'}
            onSwiper={(swiper) => { swiperRef.current = swiper }}
            modules={[Autoplay, Keyboard]}
            keyboard={{ enabled: true }}
            loop={isLooping}
            spaceBetween={50}
            slidesPerView={1}
            autoplay={isLooping ? { delay: 60000, disableOnInteraction: false } : false}
            style={{ height: '100vh' }}
        >
            <SwiperSlide>
                <TopHolesSlide competitionId={competitionId} isLooping={isLooping} />
            </SwiperSlide>
            {loading && divisionEntries.length === 0 ? (
                <SwiperSlide>
                    <Box
                        sx={{
                            p: 6,
                            height: '100vh',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography>Laen...</Typography>
                    </Box>
                </SwiperSlide>
            ) : error && divisionEntries.length === 0 ? (
                <SwiperSlide>
                    <Box
                        sx={{
                            p: 6,
                            height: '100vh',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography color="error">{error}</Typography>
                    </Box>
                </SwiperSlide>
            ) : divisionEntries.length === 0 ? (
                <SwiperSlide>
                    <Box
                        sx={{
                            p: 6,
                            height: '100vh',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography>No divisions yet</Typography>
                    </Box>
                </SwiperSlide>
            ) : (
                divisionEntries.map(([division, players]) => (
                    <SwiperSlide key={division}>
                        <TopPlayersByDivisionContent division={division} players={players} />
                    </SwiperSlide>
                ))
            )}
            <SwiperSlide>
                <StatsSlide competitionId={competitionId} />
            </SwiperSlide>
        </Swiper>
    )
}
