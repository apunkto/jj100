import {useCallback, useEffect, useState} from 'react'
import {Box, Typography} from '@mui/material'
import {useTheme} from '@mui/material/styles'
import useMetrixApi from '@/src/api/useMetrixApi'

const REFRESH_MS = 5 * 60 * 1000
const STREAK_ACE_ROTATE_MS = 15000

/** Pastel fills (light UI). */
const circleBgLight = {
    holesLeft: '#fb638c',
    finished: '#ffcc80',
    throws: '#efb4f5',
    lake: '#b3d4fc',
    streak: '#a6e4a3',
    ace: '#f4d774',
} as const

/** Saturated darker fills for dashboard LED dark mode — white text stays readable in sunlight. */
const circleBgDark = {
    holesLeft: '#ad1457',
    finished: '#e65100',
    throws: '#6a1b9a',
    lake: '#1565c0',
    streak: '#2e7d32',
    ace: '#b45309',
} as const

export default function StatsSlide({ competitionId }: { competitionId: number }) {
    const theme = useTheme()
    const { getCompetitionStats } = useMetrixApi()
    const [stats, setStats] = useState<{
        playerCount: number
        totalPlayersCount: number
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
            <Box
                sx={{
                    p: 6,
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.default',
                    color: 'text.primary',
                }}
            >
                <Typography>Laen...</Typography>
            </Box>
        )
    }

    if (error && !stats) {
        return (
            <Box
                sx={{
                    p: 6,
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.default',
                    color: 'text.primary',
                }}
            >
                <Typography color="error">{error}</Typography>
            </Box>
        )
    }

    if (!stats) return null

    const {
        playerCount,
        totalPlayersCount,
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

    const isLedDark = theme.palette.mode === 'dark'

    const items = [
        {
            label: '🕒 Viimasel puulil',
            value: mostHolesLeft,
            sub: `korvi ${totalHoles}st`,
            bg: isLedDark ? circleBgDark.holesLeft : circleBgLight.holesLeft,
        },
        {
            label: '🏁 Lõpetanud',
            value: finishedPlayersCount,
            sub: `mängijat ${playerCount}st`,
            bg: isLedDark ? circleBgDark.finished : circleBgLight.finished,
        },
        {
            label: '📊 Viskeid kokku',
            value: totalThrows,
            sub: `${(() => {
                const diff = Math.round(averageDiff)
                return diff === 0 ? '0' : `${diff > 0 ? '+' : ''}${diff}`
            })()} viset par-ile`,
            bg: isLedDark ? circleBgDark.throws : circleBgLight.throws,
        },
        {
            label: '🌊 Järve viskas',
            value: lakeOBCount,
            sub: `mängijat (${totalPlayersCount > 0 ? Math.round((lakeOBCount / totalPlayersCount) * 100) : 0}% 🤦‍♂️)`,
            bg: isLedDark ? circleBgDark.lake : circleBgLight.lake,
        },
        ...(longestStreaks.length > 0
            ? (() => {
                const idx = currentStreakIndex < longestStreaks.length ? currentStreakIndex : 0
                const streak = longestStreaks[idx]
                return [{
                    label: '🐤 Pikim birdie jada',
                    value: streak.count,
                    sub: `${streak.player} (${String(streak.startHole).padStart(2, '0')}-${String(streak.endHole).padStart(2, '0')})`,
                    bg: isLedDark ? circleBgDark.streak : circleBgLight.streak,
                }]
            })()
            : []),
        ...(longestAces.length > 0
            ? (() => {
                const idx = currentAceIndex < longestAces.length ? currentAceIndex : 0
                const ace = longestAces[idx]
                return [{
                    label: '🎯 Pikim HIO',
                    value: `${ace.length}m`,
                    sub: `${ace.player} (rada ${String(ace.holeNumber).padStart(2, '0')})`,
                    bg: isLedDark ? circleBgDark.ace : circleBgLight.ace,
                }]
            })()
            : []),
    ]

    const statValueColor = isLedDark ? '#ffffff' : '#000'

    return (
        <Box
            sx={{
                px: 6,
                py: 3,
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                color: 'text.primary',
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
                        <Typography variant="h4" fontWeight="bold" mb={2} color="text.primary">
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
                                ...(isLedDark && {
                                    boxShadow:
                                        '0 0 0 3px rgba(255,255,255,0.14), 0 8px 24px rgba(0,0,0,0.45)',
                                }),
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
                                    color: statValueColor,
                                }}
                            >
                                {item.value}
                            </Typography>
                        </Box>
                        <Box
                            mt={1}
                            sx={{
                                fontSize: 27,
                                fontWeight: 500,
                                lineHeight: '1.75rem',
                                color: isLedDark ? 'rgba(255,255,255,0.82)' : 'text.secondary',
                                '& span': {fontSize: 25},
                            }}
                        >
                            {item.sub.replace(/\s*\(.*\)/, '')}
                            <br />
                            <span>{item.sub.match(/\(.*\)/)?.[0] ?? ''}</span>
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    )
}
