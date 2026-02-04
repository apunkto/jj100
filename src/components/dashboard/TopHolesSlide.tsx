import {useCallback, useEffect, useState} from 'react'
import {Swiper, SwiperSlide} from 'swiper/react'
import {Autoplay} from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/autoplay'
import {alpha, Box, Typography} from '@mui/material'
import useCtpApi, {Hole, HoleWithCtp} from '@/src/api/useCtpApi'
import HoleCard from '@/src/components/HoleCard'

const scoreCategories = [
    { key: 'eagles', color: '#f8c600', label: 'Eagle' },
    { key: 'birdies', color: 'rgba(62,195,0,.70)', label: 'Birdie' },
    { key: 'pars', color: '#c6c6c6', label: 'Par' },
    { key: 'bogeys', color: 'rgba(244,43,3,.50)', label: 'Bogey' },
    { key: 'double_bogeys', color: 'rgba(244,43,3,.60)', label: '2x Bgy' },
    { key: 'others', color: 'rgba(244,43,3,.80)', label: '3x+ Bgy' },
]

function getOrdinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'],
        v = n % 100
    return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function StatsSection({ hole }: { hole: Hole }) {
    const avgDiff = hole.average_diff ?? 0
    const obPercent = hole.ob_percent ?? 0
    const diffColor = avgDiff <= 0 ? '#2e7d32' : avgDiff <= 0.5 ? '#ed6c02' : '#d32f2f'

    return (
        <Box display="flex" flexDirection="column" gap={2} alignItems="center">
            <Box display="flex" flexWrap="wrap" gap={2} justifyContent="center">
                <Box
                    sx={{
                        px: 2.5,
                        py: 1.25,
                        borderRadius: 2,
                        bgcolor: alpha('#1565c0', 0.12),
                        border: '1px solid',
                        borderColor: alpha('#1565c0', 0.3),
                    }}
                >
                    <Typography fontSize="0.85rem" fontWeight={600} color="text.secondary" sx={{ opacity: 0.9 }}>
                        Difficulty
                    </Typography>
                    <Typography fontSize="1.75rem" fontWeight={700} color="primary.main">
                        {getOrdinal(hole.rank)}
                    </Typography>
                </Box>
                <Box
                    sx={{
                        px: 2.5,
                        py: 1.25,
                        borderRadius: 2,
                        bgcolor: alpha(diffColor, 0.12),
                        border: '1px solid',
                        borderColor: alpha(diffColor, 0.35),
                    }}
                >
                    <Typography fontSize="0.85rem" fontWeight={600} color="text.secondary" sx={{ opacity: 0.9 }}>
                        Avg to par
                    </Typography>
                    <Typography fontSize="1.75rem" fontWeight={700} sx={{ color: diffColor }}>
                        {avgDiff > 0 ? '+' : ''}{avgDiff.toFixed(1)}
                    </Typography>
                </Box>
                <Box
                    sx={{
                        px: 2.5,
                        py: 1.25,
                        borderRadius: 2,
                        bgcolor: obPercent > 20 ? alpha('#d32f2f', 0.1) : alpha('#757575', 0.08),
                        border: '1px solid',
                        borderColor: obPercent > 20 ? alpha('#d32f2f', 0.35) : alpha('#757575', 0.2),
                    }}
                >
                    <Typography fontSize="0.85rem" fontWeight={600} color="text.secondary" sx={{ opacity: 0.9 }}>
                        Went OB
                    </Typography>
                    <Typography
                        fontSize="1.75rem"
                        fontWeight={700}
                        sx={{ color: obPercent > 20 ? '#d32f2f' : 'text.secondary' }}
                    >
                        {Math.round(obPercent)}%
                    </Typography>
                </Box>
            </Box>
        </Box>
    )
}

function ScoreDistributionChart({ hole }: { hole: Hole }) {
    const categoryValues = scoreCategories
        .map(({ key, label, color }) => ({
            key,
            label,
            color,
            value: Number(hole[key as keyof typeof hole] || 0),
        }))
        .filter((c) => c.value > 0)

    const total = categoryValues.reduce((sum, c) => sum + c.value, 0)
    if (total === 0) return null

    return (
        <Box
            sx={{
                mt: 3,
                p: 2.5,
                borderRadius: 2,
                bgcolor: alpha('#000', 0.03),
                border: '1px solid',
                borderColor: alpha('#000', 0.06),
            }}
        >
            <Typography
                fontSize="0.9rem"
                fontWeight={600}
                color="text.secondary"
                mb={1.5}
                textTransform="uppercase"
                letterSpacing={0.5}
            >
                Score distribution
            </Typography>
            <Box display="flex" flexDirection="column" gap={1.25}>
                {categoryValues.map(({ key, label, color, value }) => {
                    const pct = (value / total) * 100
                    const widthPercent = Math.max(pct, 2) // min 2% so tiny values still show a sliver

                    return (
                        <Box key={key} display="flex" alignItems="center" gap={2} minHeight={36}>
                            <Box display="flex" alignItems="center" width={120} flexShrink={0}>
                                <Typography
                                    fontWeight={700}
                                    fontSize="1.5rem"
                                    width={36}
                                    textAlign="right"
                                    color="text.primary"
                                >
                                    {value}
                                </Typography>
                                <Typography ml={1} fontSize="1.35rem" fontWeight={500} color="text.secondary" noWrap>
                                    {label}
                                </Typography>
                            </Box>
                            <Box
                                flex={1}
                                minWidth={0}
                                height={28}
                                borderRadius={1.5}
                                overflow="hidden"
                                sx={{
                                    bgcolor: alpha('#000', 0.06),
                                    position: 'relative',
                                }}
                            >
                                <Box
                                    height="100%"
                                    borderRadius={1.5}
                                    sx={{
                                        backgroundColor: color,
                                        width: `${widthPercent}%`,
                                        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                                    }}
                                />
                            </Box>
                            <Typography
                                fontSize="1rem"
                                fontWeight={600}
                                color="text.secondary"
                                width={44}
                                flexShrink={0}
                                textAlign="right"
                            >
                                {Math.round(pct)}%
                            </Typography>
                        </Box>
                    )
                })}
            </Box>
        </Box>
    )
}

const REFRESH_MS = 5 * 60 * 1000

export default function TopHolesSlide({ competitionId, isLooping = true }: { competitionId: number; isLooping?: boolean }) {
    const { getTopRankedHoles } = useCtpApi()
    const [holeInfo, setHoleInfo] = useState<Record<number, HoleWithCtp>>({})
    const [topHoles, setTopHoles] = useState<number[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        try {
            setError(null)
            const topHolesData = await getTopRankedHoles(competitionId)

            const holeMap: Record<number, HoleWithCtp> = {}
            topHolesData.forEach((h) => {
                holeMap[h.hole.number] = h
            })
            setHoleInfo(holeMap)
            setTopHoles(topHolesData.map((h) => h.hole.number))
        } catch (err) {
            console.error('Failed to load top holes:', err)
            setError(err instanceof Error ? err.message : 'Failed to load')
        } finally {
            setLoading(false)
        }
    }, [competitionId, getTopRankedHoles])

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, REFRESH_MS)
        return () => clearInterval(interval)
    }, [fetchData])

    if (loading && topHoles.length === 0) {
        return (
            <Box sx={{ p: 6, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography>Laen...</Typography>
            </Box>
        )
    }

    if (error && topHoles.length === 0) {
        return (
            <Box sx={{ p: 6, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="error">{error}</Typography>
            </Box>
        )
    }

    return (
        <Box sx={{ px: 6, py: 4, height: '100vh', boxSizing: 'border-box' }}>
            <Swiper
                key={`${topHoles.join(',')}-${isLooping}`}
                modules={[Autoplay]}
                nested
                autoplay={isLooping ? { delay: 15000, disableOnInteraction: false } : false}
                loop={isLooping}
                spaceBetween={30}
                slidesPerView={1}
            >
                {topHoles.map((holeNumber) => {
                    const holeData = holeInfo[holeNumber]?.hole
                    if (!holeData) return null
                    return (
                        <SwiperSlide key={holeNumber}>
                            <Box
                                display="flex"
                                justifyContent="center"
                                alignItems="stretch"
                                gap={6}
                                flexWrap="nowrap"
                                height="100%"
                            >
                                <Box height="100%" width={470} display="flex" alignItems="center">
                                    <HoleCard
                                        number={holeNumber}
                                        hole={holeData}
                                        maxWidth={470}
                                        isPriority={topHoles.indexOf(holeNumber) === 0}
                                    />
                                </Box>

                                <Box
                                    maxWidth={600}
                                    width={500}
                                    height={670}
                                    display="flex"
                                    flexDirection="column"
                                    justifyContent="flex-start"
                                >
                                    <StatsSection hole={holeData} />
                                    <ScoreDistributionChart hole={holeData} />
                                </Box>
                            </Box>
                        </SwiperSlide>
                    )
                })}
            </Swiper>
        </Box>
    )
}
