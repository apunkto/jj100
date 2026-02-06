import {useCallback, useEffect, useState} from 'react'
import {Box, Typography} from '@mui/material'
import useMetrixApi from '@/src/api/useMetrixApi'

const REFRESH_MS = 5 * 60 * 1000
const STREAK_ACE_ROTATE_MS = 15000

export default function StatsSlide({ competitionId }: { competitionId: number }) {
    const { getCompetitionStats } = useMetrixApi()
    const [stats, setStats] = useState<{
        playerCount: number
        mostHolesLeft: number
        finishedPlayersCount: number
        totalThrows: number
        averageDiff: number
        lakeOBCount: number
        lakePlayersCount: number
        totalHoles: number
        longestStreaks: { count: number; player: string; startHole: number; endHole: number }[]
        longestAces: { player: string; holeNumber: number; length: number }[]
    } | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentStreakIndex, setCurrentStreakIndex] = useState(0)
    const [currentAceIndex, setCurrentAceIndex] = useState(0)

    const fetchData = useCallback(async () => {
        try {
            setError(null)
            const data = await getCompetitionStats(competitionId)
            setStats(data)
        } catch (err) {
            console.error('Failed to load stats:', err)
            setError(err instanceof Error ? err.message : 'Failed to load')
        } finally {
            setLoading(false)
        }
    }, [competitionId, getCompetitionStats])

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, REFRESH_MS)
        return () => clearInterval(interval)
    }, [fetchData])

    const streakCount = stats?.longestStreaks.length ?? 0
    const aceCount = stats?.longestAces.length ?? 0

    useEffect(() => {
        if (streakCount <= 1) return
        const interval = setInterval(() => {
            setCurrentStreakIndex((prev) => (prev + 1) % streakCount)
        }, STREAK_ACE_ROTATE_MS)
        return () => clearInterval(interval)
    }, [streakCount])

    useEffect(() => {
        if (aceCount <= 1) return
        const interval = setInterval(() => {
            setCurrentAceIndex((prev) => (prev + 1) % aceCount)
        }, STREAK_ACE_ROTATE_MS)
        return () => clearInterval(interval)
    }, [aceCount])

    if (loading && !stats) {
        return (
            <Box sx={{ p: 6, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography>Laen...</Typography>
            </Box>
        )
    }

    if (error && !stats) {
        return (
            <Box sx={{ p: 6, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="error">{error}</Typography>
            </Box>
        )
    }

    if (!stats) return null

    const {
        playerCount,
        mostHolesLeft,
        finishedPlayersCount,
        totalThrows,
        averageDiff,
        lakeOBCount,
        lakePlayersCount,
        totalHoles,
        longestStreaks,
        longestAces,
    } = stats

    const items = [
        {
            label: '🕒 Viimasel puulil',
            value: mostHolesLeft,
            sub: `korvi ${totalHoles}st`,
            bg: '#fb638c',
        },
        {
            label: '🏁 Lõpetanud',
            value: finishedPlayersCount,
            sub: `mängijat ${playerCount}st`,
            bg: '#ffcc80',
        },
        {
            label: '📊 Viskeid kokku',
            value: totalThrows,
            sub: `${(() => {
                const diff = Math.round(averageDiff)
                return diff === 0 ? '0' : `${diff > 0 ? '+' : ''}${diff}`
            })()} viset par-ile`,
            bg: '#efb4f5',
        },
        {
            label: '🌊 Järve viskas',
            value: lakeOBCount,
            sub: `mängijat (${playerCount > 0 ? Math.round((lakeOBCount / playerCount) * 100) : 0}% 🤦‍♂️)`,
            bg: '#b3d4fc',
        },
        ...(longestStreaks.length > 0
            ? [
                {
                    label: '🐤 Pikim birdie jada',
                    value: longestStreaks[currentStreakIndex]?.count,
                    sub: `${longestStreaks[currentStreakIndex]?.player} (${String(longestStreaks[currentStreakIndex]?.startHole).padStart(2, '0')}-${String(longestStreaks[currentStreakIndex]?.endHole).padStart(2, '0')})`,
                    bg: '#a6e4a3',
                },
            ]
            : []),
        ...(longestAces.length > 0
            ? [
                {
                    label: '🎯 Pikim HIO',
                    value: `${longestAces[currentAceIndex]?.length}m`,
                    sub: `${longestAces[currentAceIndex]?.player} (rada ${String(longestAces[currentAceIndex]?.holeNumber).padStart(2, '0')})`,
                    bg: '#f4d774',
                },
            ]
            : []),
    ]

    return (
        <Box
            sx={{
                px: 6,
                py: 3,
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gridTemplateRows: 'repeat(2, auto)',
                    gap: 6,
                    maxWidth: '1400px',
                    width: '100%',
                }}
            >
                {items.map((item, i) => (
                    <Box
                        key={i}
                        sx={{
                            textAlign: 'center',
                            opacity: 0,
                            animation: 'fadeIn 0.5s forwards',
                            '@keyframes fadeIn': {
                                from: { opacity: 0 },
                                to: { opacity: 1 },
                            },
                        }}
                    >
                        <Typography variant="h4" fontWeight="bold" mb={2}>
                            {item.label}
                        </Typography>
                        <Box
                            sx={{
                                width: '25vh',
                                height: '25vh',
                                borderRadius: '50%',
                                backgroundColor: item.bg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto',
                            }}
                        >
                            <Typography
                                component="span"
                                sx={{
                                    position: 'relative',
                                    fontSize: item.label.includes('Viskeid') || item.label.includes('HIO')
                                        ? 'clamp(2rem, 3.1vw, 4rem)'
                                        : 'clamp(2rem, 5vw, 64rem)',
                                    fontWeight: 'bold',
                                    color: '#000',
                                }}
                            >
                                {item.value}
                            </Typography>
                        </Box>
                        <Box mt={1} sx={{ fontSize: 27, fontWeight: 500, lineHeight: 1.2 }}>
                            {item.sub.replace(/\s*\(.*\)/, '')}
                            <br />
                            <span style={{ fontSize: 25 }}>{item.sub.match(/\(.*\)/)?.[0] ?? ''}</span>
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    )
}
