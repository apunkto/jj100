import {Box, Typography} from '@mui/material'
import type {DashboardPlayerResult} from '@/src/api/useMetrixApi'
import {getScoreBreakdown} from '@/src/utils/scoreUtils'

/** Dashboard slide fits ~8 rows comfortably on the rotation display */
const TOP_PLAYERS_SHOWN = 8

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
    const topPlayers = players.slice(0, TOP_PLAYERS_SHOWN)

    return (
        <Box
            sx={{
                px: { xs: 1.5, sm: 2, md: 3 },
                pt: { xs: 1, sm: 1.25, md: 1.5 },
                pb: { xs: 1, sm: 1.25, md: 1.5 },
                height: '100%',
                overflowY: 'auto',
                overflowX: 'hidden',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
            }}
        >
            <Typography
                variant="h3"
                fontWeight="bold"
                mb={{ xs: 0.75, sm: 1, md: 1.25 }}
                textAlign="center"
                sx={{ fontSize: { xs: '1.9rem', sm: '2.2rem', md: '2.6rem' } }}
            >
                {division}
            </Typography>
            {topPlayers.map((player, index) => {
                const breakdown = getScoreBreakdown(player)
                return (
                    <Box key={player.UserID} mb={{ xs: 0.35, sm: 0.45, md: 0.55 }} sx={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                        <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="flex-start"
                            flexDirection="row"
                            gap={{ xs: 0.75, sm: 1.25, md: 2 }}
                            sx={{
                                width: '100%',
                                maxWidth: '100%',
                                minWidth: 0,
                                overflowX: 'hidden',
                                minHeight: { xs: 48, sm: 52, md: 58 },
                                py: { xs: 0.2, sm: 0.25, md: 0.35 },
                                flexWrap: 'nowrap',
                            }}
                        >
                            <Box
                                sx={{
                                    flex: '1 1 0%',
                                    minWidth: 0,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                    alignItems: 'center',
                                    height: '100%',
                                }}
                            >
                                <Typography
                                    fontWeight="600"
                                    sx={{
                                        fontSize: { xs: '1.38rem', sm: '1.52rem', md: '1.72rem' },
                                        lineHeight: 1.25,
                                        m: 0,
                                        p: 0,
                                        display: 'block',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        width: '100%',
                                    }}
                                >
                                    {index === 0 ? (
                                        <Box component="span" mr={0.5} sx={{ fontSize: { xs: '1.55rem', sm: '1.7rem', md: '1.95rem' } }}>
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
                                    minWidth: { xs: 54, sm: 62, md: 72 },
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    height: '100%',
                                }}
                            >
                                <Typography
                                    fontWeight="bold"
                                    sx={{
                                        fontSize: { xs: '1.52rem', sm: '1.7rem', md: '1.95rem' },
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
                                gap={{ xs: 0.35, sm: 0.5, md: 0.75 }}
                                flexWrap="nowrap"
                                justifyContent="flex-start"
                                sx={{ flexShrink: 0, height: '100%' }}
                            >
                                {scoreCategories.map(({ key, color }) => {
                                    const count = breakdown[key as keyof typeof breakdown]
                                    return (
                                        <Box
                                            key={key}
                                            sx={{
                                                width: { xs: 38, sm: 42, md: 48, lg: 56 },
                                                height: { xs: 38, sm: 42, md: 48, lg: 56 },
                                                borderRadius: '50%',
                                                backgroundColor: count ? color : 'transparent',
                                                fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.5rem', lg: '1.3rem' },
                                                fontWeight: 700,
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
