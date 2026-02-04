import {useCallback, useEffect, useState} from 'react'
import {Box, Typography} from '@mui/material'
import useMetrixApi, {type DashboardPlayerResult} from '@/src/api/useMetrixApi'

const scoreCategories = [
    { key: 'eagles', color: '#f8c600', label: 'Eagle' },
    { key: 'birdies', color: 'rgba(62,195,0,.70)', label: 'Birdie' },
    { key: 'pars', color: '#c6c6c6', label: 'Par' },
    { key: 'bogeys', color: 'rgba(244,43,3,.50)', label: 'Bogey' },
    { key: 'double_bogeys', color: 'rgba(244,43,3,.60)', label: 'Double' },
    { key: 'others', color: 'rgba(244,43,3,.80)', label: 'Triple+' },
]

function getScoreBreakdown(player: DashboardPlayerResult) {
    let eagles = 0,
        birdies = 0,
        pars = 0,
        bogeys = 0,
        double_bogeys = 0,
        others = 0

    for (const hole of player.PlayerResults || []) {
        const diff = hole.Diff
        if (diff <= -2) eagles++
        else if (diff === -1) birdies++
        else if (diff === 0) pars++
        else if (diff === 1) bogeys++
        else if (diff === 2) double_bogeys++
        else if (diff >= 3) others++
    }

    return { eagles, birdies, pars, bogeys, double_bogeys, others }
}

const REFRESH_MS = 5 * 60 * 1000

/** Hook to fetch top players by division. Use in Dashboard and render SwiperSlides directly. */
export function useTopPlayersByDivision(competitionId: number) {
    const { getTopPlayersByDivision } = useMetrixApi()
    const [topPlayersByDivision, setTopPlayersByDivision] = useState<Record<string, DashboardPlayerResult[]>>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        try {
            setError(null)
            const data = await getTopPlayersByDivision(competitionId)
            setTopPlayersByDivision(data.topPlayersByDivision)
        } catch (err) {
            console.error('Failed to load top players:', err)
            setError(err instanceof Error ? err.message : 'Failed to load')
        } finally {
            setLoading(false)
        }
    }, [competitionId, getTopPlayersByDivision])

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, REFRESH_MS)
        return () => clearInterval(interval)
    }, [fetchData])

    return { topPlayersByDivision, loading, error }
}

/** Content for a single division slide. Rendered inside SwiperSlide by Dashboard. */
export function TopPlayersByDivisionContent({
    division,
    players,
}: {
    division: string
    players: DashboardPlayerResult[]
}) {
    return (
        <Box sx={{ 
            p: { xs: 2, sm: 4, md: 6 }, 
            height: '100%', 
            overflowY: 'auto', 
            overflowX: 'hidden', 
            width: '100%', 
            boxSizing: 'border-box' 
        }}>
            <Typography 
                variant="h3" 
                fontWeight="bold" 
                mb={4} 
                textAlign="center"
                sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}
            >
                {division}
            </Typography>
            {players.map((player, index) => {
                const breakdown = getScoreBreakdown(player)
                return (
                    <Box 
                        key={player.UserID} 
                        mb={2} 
                        sx={{ width: '100%', boxSizing: 'border-box' }}
                    >
                        <Box 
                            display="flex" 
                            alignItems="center" 
                            justifyContent={{ xs: 'flex-start', sm: 'center' }}
                            flexDirection="row"
                            gap={{ xs: 0.5, sm: 2 }}
                            sx={{ 
                                width: '100%', 
                                overflowX: 'hidden',
                                height: { xs: '32px', sm: '50px', md: '60px' },
                                flexWrap: 'nowrap'
                            }}
                        >
                            <Box
                                sx={{ 
                                    minWidth: { xs: 0, sm: '300px', md: '450px' },
                                    flex: { xs: '1 1 auto', sm: '0 0 auto' },
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                    alignItems: 'center',
                                    height: '100%',
                                }}
                            >
                                <Typography
                                    fontSize={{ xs: '0.9rem', sm: '1.25rem', md: 'clamp(1.25rem, 2.5vw, 2rem)' }}
                                    fontWeight="600"
                                    sx={{ 
                                        lineHeight: 1,
                                        m: 0,
                                        p: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    {index === 0 ? (
                                        <Box component="span" mr={0.5} fontSize={{ xs: '0.9rem', sm: '1.5rem', md: '1.8rem' }}>
                                            🔥
                                        </Box>
                                    ) : (
                                        `${index + 1}. `
                                    )}
                                    {player.Name}
                                </Typography>
                            </Box>
                            <Box 
                                sx={{ 
                                    minWidth: { xs: '40px', sm: '60px' }, 
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    height: '100%',
                                }}
                            >
                                <Typography 
                                    fontSize={{ xs: '1rem', sm: '1.5rem', md: 'clamp(1.5rem, 2vw, 2rem)' }}
                                    fontWeight="bold"
                                    sx={{ 
                                        lineHeight: 1,
                                        m: 0,
                                        p: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    {Number(player.Diff) > 0 ? `+${player.Diff}` : player.Diff}
                                </Typography>
                            </Box>
                            <Box 
                                display="flex" 
                                alignItems="center"
                                gap={{ xs: 0.5, sm: 1 }} 
                                flexWrap="nowrap"
                                justifyContent="flex-start"
                                sx={{ 
                                    flexShrink: 0, 
                                    height: '100%',
                                }}
                            >
                                {scoreCategories.map(({ key, color }) => {
                                    const count = breakdown[key as keyof typeof breakdown]
                                    const circleSize = { xs: 32, sm: 50, md: 60 }
                                    return (
                                        <Box
                                            key={key}
                                            sx={{
                                                width: circleSize,
                                                height: circleSize,
                                                borderRadius: '50%',
                                                backgroundColor: count ? color : 'transparent',
                                                fontSize: { xs: '0.75rem', sm: '1.1rem', md: 'clamp(1.2rem, 1.8vw, 22rem)' },
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                visibility: count ? 'visible' : 'hidden',
                                                lineHeight: 1,
                                                m: 0,
                                                p: 0,
                                            }}
                                        >
                                            {count || ''}
                                        </Box>
                                    )
                                })}
                            </Box>
                        </Box>
                    </Box>
                )
            })}
        </Box>
    )
}
