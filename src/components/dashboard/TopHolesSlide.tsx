import {useCallback, useEffect, useState} from 'react'
import {Swiper, SwiperSlide} from 'swiper/react'
import {Autoplay} from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/autoplay'
import {alpha, Box, Typography} from '@mui/material'
import useCtpApi, {Hole, HoleWithCtp} from '@/src/api/useCtpApi'
import HoleCard from '@/src/components/HoleCard'

/** P5 / wall display: minimum readable type outside HoleCard (explicit px). */
const P5 = {
    caption: '25px',
    statValue: '44px',
    sectionTitle: '25px',
    distCount: '30px',
    distLabel: '25px',
    distPct: '25px',
    barHeight: 36,
    rowMinHeight: 52,
} as const

const scoreCategories = [
    { key: 'eagles', color: '#f8c600', label: 'Eagle' },
    { key: 'birdies', color: 'rgba(62,195,0,.70)', label: 'Birdie' },
    { key: 'pars', color: '#c6c6c6', label: 'Par' },
    { key: 'bogeys', color: 'rgba(244,43,3,.50)', label: 'Bogey' },
    { key: 'double_bogeys', color: 'rgba(244,43,3,.60)', label: 'Double' },
    { key: 'others', color: 'rgba(244,43,3,.80)', label: 'Triple+' },
]

function getOrdinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'],
        v = n % 100
    return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function statCardSx(tint: string, border: string) {
    return {
        px: 2.5,
        py: 2,
        borderRadius: 2,
        bgcolor: tint,
        border: '1px solid',
        borderColor: border,
        minWidth: 0,
        flex: '1 1 160px',
        maxWidth: 280,
    } as const
}

function StatsSection({ hole }: { hole: Hole }) {
    const avgDiff = hole.average_diff ?? 0
    const obPercent = hole.ob_percent ?? 0
    const diffColor = avgDiff <= 0 ? '#2e7d32' : avgDiff <= 0.5 ? '#ed6c02' : '#d32f2f'

    return (
        <Box display="flex" flexDirection="column" gap={2} alignItems="stretch" width="100%">
            <Box display="flex" flexWrap="wrap" gap={2} justifyContent="stretch" sx={{ width: '100%' }}>
                <Box sx={statCardSx(alpha('#1565c0', 0.12), alpha('#1565c0', 0.3))}>
                    <Typography
                        fontWeight={600}
                        color="text.secondary"
                        sx={{ fontSize: P5.caption, lineHeight: 1.2, opacity: 0.92, mb: 0.5 }}
                    >
                        Difficulty
                    </Typography>
                    <Typography fontWeight={700} color="primary.main" sx={{ fontSize: P5.statValue, lineHeight: 1.05 }}>
                        {getOrdinal(hole.rank)}
                    </Typography>
                </Box>
                <Box sx={statCardSx(alpha(diffColor, 0.12), alpha(diffColor, 0.35))}>
                    <Typography
                        fontWeight={600}
                        color="text.secondary"
                        sx={{ fontSize: P5.caption, lineHeight: 1.2, opacity: 0.92, mb: 0.5 }}
                    >
                        Avg to par
                    </Typography>
                    <Typography fontWeight={700} sx={{ fontSize: P5.statValue, lineHeight: 1.05, color: diffColor }}>
                        {avgDiff > 0 ? '+' : ''}
                        {avgDiff.toFixed(1)}
                    </Typography>
                </Box>
                <Box
                    sx={statCardSx(
                        obPercent > 20 ? alpha('#d32f2f', 0.1) : alpha('#757575', 0.08),
                        obPercent > 20 ? alpha('#d32f2f', 0.35) : alpha('#757575', 0.2)
                    )}
                >
                    <Typography
                        fontWeight={600}
                        color="text.secondary"
                        sx={{ fontSize: P5.caption, lineHeight: 1.2, opacity: 0.92, mb: 0.5 }}
                    >
                        Went OB
                    </Typography>
                    <Typography
                        fontWeight={700}
                        sx={{ fontSize: P5.statValue, lineHeight: 1.05, color: obPercent > 20 ? '#d32f2f' : 'text.secondary' }}
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
                mt: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: alpha('#000', 0.03),
                border: '1px solid',
                borderColor: alpha('#000', 0.06),
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Typography
                fontWeight={700}
                color="text.secondary"
                mb={1.25}
                textTransform="uppercase"
                letterSpacing={1}
                sx={{ fontSize: P5.sectionTitle, lineHeight: 1.2 }}
            >
                Score distribution
            </Typography>
            <Box
                display="flex"
                flexDirection="column"
                gap={1.5}
                sx={{ flex: 1, minHeight: 0, justifyContent: 'center', overflowY: 'auto' }}
            >
                {categoryValues.map(({ key, label, color, value }) => {
                    const pct = (value / total) * 100
                    const widthPercent = Math.max(pct, 2) // min 2% so tiny values still show a sliver

                    return (
                        <Box
                            key={key}
                            display="flex"
                            alignItems="center"
                            gap={2}
                            sx={{ minHeight: P5.rowMinHeight }}
                        >
                            <Typography
                                fontWeight={700}
                                textAlign="right"
                                color="text.primary"
                                sx={{
                                    fontSize: P5.distCount,
                                    lineHeight: 1,
                                    width: 44,
                                    flexShrink: 0,
                                }}
                            >
                                {value}
                            </Typography>
                            <Typography
                                fontWeight={600}
                                color="text.secondary"
                                sx={{
                                    fontSize: P5.distLabel,
                                    lineHeight: 1.2,
                                    flex: '0 1 200px',
                                    minWidth: 0,
                                }}
                            >
                                {label}
                            </Typography>
                            <Box
                                flex={1}
                                minWidth={80}
                                height={P5.barHeight}
                                borderRadius={2}
                                overflow="hidden"
                                sx={{
                                    bgcolor: alpha('#000', 0.06),
                                    position: 'relative',
                                }}
                            >
                                <Box
                                    height="100%"
                                    borderRadius={2}
                                    sx={{
                                        backgroundColor: color,
                                        width: `${widthPercent}%`,
                                        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                                    }}
                                />
                            </Box>
                            <Typography
                                fontWeight={700}
                                color="text.secondary"
                                textAlign="right"
                                sx={{
                                    fontSize: P5.distPct,
                                    lineHeight: 1,
                                    minWidth: 64,
                                    flexShrink: 0,
                                }}
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
                <Typography sx={{ fontSize: P5.caption }}>Laen...</Typography>
            </Box>
        )
    }

    if (error && topHoles.length === 0) {
        return (
            <Box sx={{ p: 6, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="error" sx={{ fontSize: P5.caption }}>
                    {error}
                </Typography>
            </Box>
        )
    }

    return (
        <Box sx={{ px: 3, py: 2, height: '100vh', maxHeight: '100dvh', boxSizing: 'border-box', overflow: 'hidden' }}>
            <Swiper
                key={`${topHoles.join(',')}-${isLooping}`}
                modules={[Autoplay]}
                nested
                autoplay={isLooping ? { delay: 15000, disableOnInteraction: false } : false}
                loop={isLooping}
                spaceBetween={30}
                slidesPerView={1}
                style={{ height: '100%' }}
            >
                {topHoles.map((holeNumber, holeIdx) => {
                    const holeData = holeInfo[holeNumber]?.hole
                    if (!holeData) return null
                    return (
                        <SwiperSlide key={holeNumber} style={{ height: '100%', boxSizing: 'border-box' }}>
                            <Box
                                display="flex"
                                justifyContent="flex-start"
                                alignItems="stretch"
                                gap={3}
                                flexWrap="nowrap"
                                height="100%"
                                sx={{ minHeight: 0, maxHeight: '100%' }}
                            >
                                <Box
                                    height="100%"
                                    width={425}
                                    flexShrink={0}
                                    display="flex"
                                    alignItems="center"
                                    sx={{ minHeight: 0 }}
                                >
                                    <HoleCard
                                        number={holeNumber}
                                        hole={holeData}
                                        maxWidth={470}
                                        isPriority={holeIdx === 0}
                                    />
                                </Box>

                                <Box
                                    flex="1 1 0%"
                                    minWidth={0}
                                    minHeight={0}
                                    height="100%"
                                    display="flex"
                                    flexDirection="column"
                                    justifyContent="flex-start"
                                    sx={{ overflow: 'hidden' }}
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
