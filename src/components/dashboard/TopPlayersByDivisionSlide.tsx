import {Box, Typography} from '@mui/material'
import type {DashboardPlayerResult} from '@/src/api/useMetrixApi'
import {getScoreBreakdown} from '@/src/utils/scoreUtils'

const scoreCategories = [
    { key: 'eagles', color: '#f8c600', label: 'Eagle' },
    { key: 'birdies', color: 'rgba(62,195,0,.70)', label: 'Birdie' },
    { key: 'pars', color: '#c6c6c6', label: 'Par' },
    { key: 'bogeys', color: 'rgba(244,43,3,.50)', label: 'Bogey' },
    { key: 'double_bogeys', color: 'rgba(244,43,3,.60)', label: 'Double' },
    { key: 'others', color: 'rgba(244,43,3,.80)', label: 'Triple+' },
]

/** Content for a single division slide. Rendered inside SwiperSlide by Dashboard. */
export function TopPlayersByDivisionContent({
    division,
    players,
}: {
    division: string
    players: DashboardPlayerResult[]
}) {
    return (
        <Box sx={{ p: 4, height: '100%', overflowY: 'auto', overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>
            <Typography variant="h3" fontWeight="bold" mb={4} textAlign="center" sx={{ fontSize: '2rem' }}>
                {division}
            </Typography>
            {players.map((player, index) => {
                const breakdown = getScoreBreakdown(player)
                return (
                    <Box key={player.UserID} mb={2} sx={{ width: '100%', boxSizing: 'border-box' }}>
                        <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexDirection="row"
                            gap={2}
                            sx={{ width: '100%', overflowX: 'hidden', height: 56, flexWrap: 'nowrap' }}
                        >
                            <Box
                                sx={{
                                    minWidth: 300,
                                    flex: '0 0 auto',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                    alignItems: 'center',
                                    height: '100%',
                                }}
                            >
                                <Typography
                                    fontSize="1.25rem"
                                    fontWeight="600"
                                    sx={{ lineHeight: 1, m: 0, p: 0, display: 'flex', alignItems: 'center' }}
                                >
                                    {index === 0 ? (
                                        <Box component="span" mr={0.5} fontSize="1.5rem">
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
                                    minWidth: 60,
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    height: '100%',
                                }}
                            >
                                <Typography
                                    fontSize="1.5rem"
                                    fontWeight="bold"
                                    sx={{ lineHeight: 1, m: 0, p: 0, display: 'flex', alignItems: 'center' }}
                                >
                                    {Number(player.Diff) > 0 ? `+${player.Diff}` : player.Diff}
                                </Typography>
                            </Box>
                            <Box
                                display="flex"
                                alignItems="center"
                                gap={1}
                                flexWrap="nowrap"
                                justifyContent="flex-start"
                                sx={{ flexShrink: 0, height: '100%' }}
                            >
                                {scoreCategories.map(({ key, color }) => {
                                    const count = breakdown[key as keyof typeof breakdown]
                                    const circleSize = 48
                                    return (
                                        <Box
                                            key={key}
                                            sx={{
                                                width: circleSize,
                                                height: circleSize,
                                                borderRadius: '50%',
                                                backgroundColor: count ? color : 'transparent',
                                                fontSize: '1.1rem',
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
