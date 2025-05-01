import { useCallback, useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/autoplay'
import { Box, Typography } from '@mui/material'
import Image from 'next/image'
import useCtpApi, { HoleResult } from '@/src/api/useCtpApi'

// Metrix types
type HoleResultAPI = {
    Diff: number;
};

type PlayerResult = {
    UserID: number;
    Name: string;
    OrderNumber: number;
    Diff: string;
    ClassName: string;
    Sum: number;
    Dnf?: boolean | null;
    PlayerResults?: HoleResultAPI[];
};

type MetrixAPIResponse = {
    Competition: {
        Results: PlayerResult[];
    };
};

// ✅ Shared score categories with color and label
const scoreCategories = [
    { key: 'eagles', color: '#f8c600', label: 'Eagle' },
    { key: 'birdies', color: 'rgba(62,195,0,.34)', label: 'Birdie' },
    { key: 'pars', color: '#ECECECFF', label: 'Par' },
    { key: 'bogeys', color: 'rgba(244,43,3,.12)', label: 'Bogey' },
    { key: 'doubleBogeys', color: 'rgba(244,43,3,.26)', label: 'Double' },
    { key: 'tripleOrWorse', color: 'rgba(244,43,3,.42)', label: 'Triple+' },
]

export default function TopHolesDashboard() {
    const { getTopRankedHoles } = useCtpApi()
    const [holeInfo, setHoleInfo] = useState<Record<number, HoleResult>>({})
    const [topHoles, setTopHoles] = useState<number[]>([])
    const [topPlayersByDivision, setTopPlayersByDivision] = useState<Record<string, PlayerResult[]>>({})

    const countScoreTypes = (player: PlayerResult) => {
        let birdieOrBetter = 0, pars = 0, bogeys = 0
        for (const hole of player.PlayerResults || []) {
            const diff = hole.Diff
            if (diff <= -1) birdieOrBetter++
            else if (diff === 0) pars++
            else if (diff === 1) bogeys++
        }
        return { birdieOrBetter, pars, bogeys }
    }

    const getScoreBreakdown = (player: PlayerResult) => {
        let eagles = 0, birdies = 0, pars = 0, bogeys = 0, doubleBogeys = 0, tripleOrWorse = 0
        for (const hole of player.PlayerResults || []) {
            const diff = hole.Diff
            if (diff <= -2) eagles++
            else if (diff === -1) birdies++
            else if (diff === 0) pars++
            else if (diff === 1) bogeys++
            else if (diff === 2) doubleBogeys++
            else if (diff >= 3) tripleOrWorse++
        }
        return { eagles, birdies, pars, bogeys, doubleBogeys, tripleOrWorse }
    }

    const fetchTopHoles = useCallback(async () => {
        try {
            const topHolesData = await getTopRankedHoles()
            const holeMap: Record<number, HoleResult> = {}
            topHolesData.forEach((h) => {
                holeMap[h.hole.number] = h
            })
            setHoleInfo(holeMap)
            setTopHoles(topHolesData.map((h) => h.hole.number))

            const res = await fetch('https://discgolfmetrix.com/api.php?content=result&id=2834664')
            const metrixData = (await res.json()) as MetrixAPIResponse
            const players = metrixData.Competition.Results

            const grouped: Record<string, PlayerResult[]> = {}
            for (const player of players) {
                if (player.Dnf) continue
                if (!grouped[player.ClassName]) grouped[player.ClassName] = []
                grouped[player.ClassName].push(player)
            }

            Object.keys(grouped).forEach((division) => {
                grouped[division].sort((a, b) => {
                    if (a.Sum !== b.Sum) return a.Sum - b.Sum
                    const aStats = countScoreTypes(a)
                    const bStats = countScoreTypes(b)
                    if (aStats.birdieOrBetter !== bStats.birdieOrBetter) {
                        return bStats.birdieOrBetter - aStats.birdieOrBetter
                    }
                    if (aStats.pars !== bStats.pars) {
                        return bStats.pars - aStats.pars
                    }
                    if (aStats.bogeys !== bStats.bogeys) {
                        return bStats.bogeys - aStats.bogeys
                    }
                    return 0
                })
                grouped[division] = grouped[division].slice(0, 4)
            })

            setTopPlayersByDivision(grouped)
        } catch (err) {
            console.error('Failed to load data:', err)
        }
    }, [getTopRankedHoles])

    useEffect(() => {
        fetchTopHoles()
        const interval = setInterval(fetchTopHoles, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [fetchTopHoles])

    const renderScoreBar = (hole: HoleResult['hole']) => {
        const categories = scoreCategories
        const total = categories.reduce((sum, cat) => sum + Number(hole[cat.key as keyof typeof hole] || 0), 0)
        if (total === 0) return null

        return (
            <Box mt={2}>
                <Box display="flex" height={14} borderRadius={2} overflow="hidden" width="100%">
                    {categories.map(({ key, color }) => {
                        const value = hole[key as keyof typeof hole] || 0
                        const percent = (Number(value) / total) * 100
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

                <Box mt={1.5} display="flex" flexWrap="wrap" justifyContent="center" gap={1}>
                    {categories.map(({ key, color, label }) => {
                        const value = hole[key as keyof typeof hole] || 0
                        if (!value) return null
                        return (
                            <Box
                                key={key}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: '20px',
                                    backgroundColor: color,
                                    color: '#000',
                                    fontWeight: 500,
                                    fontSize: '14px',
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
        <Box sx={{ display: 'flex', gap: 4, p: 4 }}>
            {/* Left: Swiper */}
            <Box sx={{ maxWidth: 600, flexShrink: 0 }}>
                <Typography variant="h4" textAlign="left" mb={4} fontWeight="bold">
                    Top 10 raskemad rajad
                </Typography>
                <Swiper
                    modules={[Autoplay]}
                    autoplay={{ delay: 30000, disableOnInteraction: false }}
                    loop
                    spaceBetween={30}
                    slidesPerView={1}
                >
                    {topHoles.map((holeNumber) => {
                        const holeData = holeInfo[holeNumber]?.hole
                        if (!holeData) return null
                        return (
                            <SwiperSlide key={holeNumber}>
                                <Box sx={{ position: 'relative', borderRadius: '15px', overflow: 'hidden' }}>
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            zIndex: 2,
                                            right: '17%',
                                            top: '10%',
                                            transform: 'translateY(-50%)',
                                        }}
                                    >
                                        <Typography
                                            variant="h4"
                                            fontWeight="bold"
                                            sx={{
                                                fontSize: 'clamp(24px, 1.2vw, 42px)',
                                                color: 'black',
                                                fontFamily: 'Alatsi, sans-serif',
                                            }}
                                        >
                                            {holeData.length}m
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                                        <Image
                                            src={`/cards/${holeNumber}.webp?v=3`}
                                            alt={`Rada ${holeNumber}`}
                                            layout="intrinsic"
                                            width={450}
                                            height={630}
                                            style={{ borderRadius: '10px' }}
                                            sizes="(max-width: 600px) 100vw, 450px"
                                        />
                                    </Box>
                                </Box>

                                <Box mt={3} display="flex" justifyContent="space-between" gap={4} alignItems="start">
                                    <Typography fontSize={20}>
                                        Raskuselt <strong>{holeData.rank}</strong>. rada (
                                        {holeData.average_diff !== undefined
                                            ? (() => {
                                                const diff = holeData.average_diff
                                                const rounded = Number(diff.toFixed(1))
                                                return `${rounded > 0 ? '+' : ''}${rounded} viset par-ile`
                                            })()
                                            : ''}
                                        )
                                    </Typography>

                                    <Typography fontSize={20} sx={{ borderTop: '3px solid #f42b03', pt: 0.5 }}>
                                        {holeData.ob_percent !== undefined ? `${Math.round(holeData.ob_percent)}% viskas OB` : ''}
                                    </Typography>
                                </Box>

                                {renderScoreBar(holeData)}
                            </SwiperSlide>
                        )
                    })}
                </Swiper>
            </Box>

            {/* Right: Top 3 per division */}
            <Box sx={{ flex: 1, maxWidth: 400 }}>
                {Object.entries(topPlayersByDivision).map(([division, players]) => (
                    <Box key={division} mb={3}>
                        <Typography variant="h6" fontWeight="bold" mb={1}>
                            {division}
                        </Typography>
                        {players.map((player, index) => {
                            const breakdown = getScoreBreakdown(player)
                            return (
                                <Box key={player.UserID} mb={1}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        {/* Player name */}
                                        <Typography>
                                            {index + 1}. {player.Name}
                                        </Typography>

                                        {/* Fixed-width score + chips */}
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Box sx={{ width: 40, textAlign: 'right' }}>
                                                <Typography fontWeight="bold" sx={{ minWidth: 40, textAlign: 'right' }}>
                                                    {Number(player.Diff) > 0 ? `+${player.Diff}` : player.Diff}
                                                </Typography>
                                            </Box>

                                            <Box display="flex" gap={0.5} flexWrap="wrap" width={150}>
                                                {scoreCategories.map(({ key, color }) => {
                                                    const count = breakdown[key as keyof typeof breakdown]
                                                    if (!count) return null
                                                    return (
                                                        <Box
                                                            key={key}
                                                            sx={{
                                                                width: 20,
                                                                height: 20,
                                                                borderRadius: '50%',
                                                                backgroundColor: color,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '12px',
                                                                fontWeight: 500,
                                                                color: '#000',
                                                            }}
                                                        >
                                                            {count}
                                                        </Box>
                                                    )
                                                })}
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            )
                        })}
                    </Box>
                ))}
            </Box>
        </Box>
    )
}
