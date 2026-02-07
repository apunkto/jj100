import {Box, Typography} from '@mui/material'
import type {DashboardPlayerResult} from '@/src/api/useMetrixApi'

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

const MEDAL_ICONS = ['🥇', '🥈', '🥉'] as const

/** Top players by division content for the admin Results page. */
export function TopPlayersByDivisionResults({
    division,
    players,
    currentUserMetrixId,
    myDivisionResult,
}: {
    division: string
    players: DashboardPlayerResult[]
    currentUserMetrixId?: number
    /** When user is in this division but place > 10; fetched separately */
    myDivisionResult?: { place: number; player: DashboardPlayerResult }
}) {
    const showSeparatorAndMe = myDivisionResult != null
    const visiblePlayers = players

    return (
        <Box
            sx={{
                p: { xs: 2, sm: 3, md: 4 },
                height: '100%',
                overflowY: 'auto',
                width: '100%',
                boxSizing: 'border-box',
            }}
        >
            <Typography
                variant="h3"
                fontWeight="bold"
                mb={2}
                textAlign="center"
                sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}
            >
                {division}
            </Typography>
            {visiblePlayers.map((player, index) => {
                const breakdown = getScoreBreakdown(player)
                const diffNum = Number(player.Diff)
                const isTopThree = index < 3
                const isCurrentUser = currentUserMetrixId != null && player.UserID === currentUserMetrixId
                const scoreColor =
                    diffNum < 0 ? 'success.main' : diffNum > 0 ? 'error.main' : 'text.primary'
                return (
                    <Box
                        key={player.UserID}
                        sx={{
                            width: '100%',
                            boxSizing: 'border-box',
                            mb: 1,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: isCurrentUser ? 'primary.main' : 'divider',
                            borderWidth: isCurrentUser ? 2 : 1,
                            backgroundColor: isTopThree ? 'action.hover' : 'background.paper',
                            px: 2,
                            py: 1,
                            minHeight: 40,
                        }}
                    >
                        {/* Mobile only: two-row layout, circles only when count, right-aligned */}
                        <Box
                            sx={{
                                display: { xs: 'flex', sm: 'none' },
                                flexDirection: 'column',
                                gap: 0.75,
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    minWidth: 0,
                                    minHeight: 40,
                                }}
                            >
                                <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                                    <Typography
                                        fontSize="0.95rem"
                                        fontWeight="600"
                                        sx={{
                                            lineHeight: 1,
                                            m: 0,
                                            p: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {index < 3 ? (
                                            <Box component="span" fontSize="1rem" mr={0.25}>
                                                {MEDAL_ICONS[index]}
                                            </Box>
                                        ) : (
                                            `${index + 1}. `
                                        )}
                                    </Typography>
                                </Box>
                                <Typography
                                    fontSize="0.95rem"
                                    fontWeight="600"
                                    sx={{
                                        flex: 1,
                                        minWidth: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        lineHeight: 1,
                                        m: 0,
                                        p: 0,
                                    }}
                                >
                                    {player.Name}
                                </Typography>
                                <Box sx={{ flexShrink: 0, minHeight: 40, display: 'flex', alignItems: 'center' }}>
                                    <Typography
                                        fontSize="1rem"
                                        fontWeight="bold"
                                        sx={{ lineHeight: 1, m: 0, p: 0, color: scoreColor }}
                                    >
                                        {Number(player.Diff) > 0 ? `+${player.Diff}` : player.Diff}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box
                                display="flex"
                                alignItems="flex-start"
                                gap={0.5}
                                flexWrap="wrap"
                                justifyContent="flex-end"
                                sx={{ flexShrink: 0 }}
                            >
                                {scoreCategories.map(({ key, color }) => {
                                    const count = breakdown[key as keyof typeof breakdown]
                                    if (!count) return null
                                    return (
                                        <Box
                                            key={key}
                                            sx={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                backgroundColor: color,
                                                fontSize: '0.65rem',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                lineHeight: 1,
                                                m: 0,
                                                p: 0,
                                            }}
                                        >
                                            {count}
                                        </Box>
                                    )
                                })}
                            </Box>
                        </Box>
                        {/* Desktop only: single row, left-aligned, all 6 circle slots so columns align */}
                        <Box
                            sx={{
                                display: { xs: 'none', sm: 'flex' },
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                flexDirection: 'row',
                                gap: 2,
                                width: '100%',
                                overflowX: 'hidden',
                                height: 56,
                                flexWrap: 'nowrap',
                            }}
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
                                    sx={{
                                        lineHeight: 1,
                                        m: 0,
                                        p: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    {index < 3 ? (
                                        <Box component="span" mr={0.5} fontSize="1.25rem">
                                            {MEDAL_ICONS[index]}
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
                                    sx={{
                                        lineHeight: 1,
                                        m: 0,
                                        p: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: scoreColor,
                                    }}
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
                                sx={{ flexShrink: 0, height: '100%', marginLeft: 'auto' }}
                            >
                                {scoreCategories.map(({ key, color }) => {
                                    const count = breakdown[key as keyof typeof breakdown]
                                    return (
                                        <Box
                                            key={key}
                                            sx={{
                                                width: 48,
                                                height: 48,
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
            {showSeparatorAndMe && myDivisionResult && (() => {
                const { place: myPlace, player } = myDivisionResult
                const breakdown = getScoreBreakdown(player)
                const diffNum = Number(player.Diff)
                const scoreColor =
                    diffNum < 0 ? 'success.main' : diffNum > 0 ? 'error.main' : 'text.primary'
                return (
                    <>
                        <Box sx={{ textAlign: 'center', py: 0.5, mb: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                                • • •
                            </Typography>
                        </Box>
                        <Box
                            key={player.UserID}
                            sx={{
                                width: '100%',
                                boxSizing: 'border-box',
                                mb: 1,
                                borderRadius: 2,
                                border: '2px solid',
                                borderColor: 'primary.main',
                                backgroundColor: 'action.hover',
                                px: 2,
                                py: 1,
                                minHeight: 40,
                            }}
                        >
                            <Box
                                sx={{
                                    display: { xs: 'flex', sm: 'none' },
                                    flexDirection: 'column',
                                    gap: 0.75,
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        minWidth: 0,
                                        minHeight: 40,
                                    }}
                                >
                                    <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                                        <Typography
                                            fontSize="0.95rem"
                                            fontWeight="600"
                                            sx={{
                                                lineHeight: 1,
                                                m: 0,
                                                p: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                        >
                                            {myPlace}.{' '}
                                        </Typography>
                                    </Box>
                                    <Typography
                                        fontSize="0.95rem"
                                        fontWeight="600"
                                        sx={{
                                            flex: 1,
                                            minWidth: 0,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            lineHeight: 1,
                                            m: 0,
                                            p: 0,
                                        }}
                                    >
                                        {player.Name}
                                    </Typography>
                                    <Box
                                        sx={{
                                            flexShrink: 0,
                                            minHeight: 40,
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Typography
                                            fontSize="1rem"
                                            fontWeight="bold"
                                            sx={{
                                                lineHeight: 1,
                                                m: 0,
                                                p: 0,
                                                color: scoreColor,
                                            }}
                                        >
                                            {Number(player.Diff) > 0 ? `+${player.Diff}` : player.Diff}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box
                                    display="flex"
                                    alignItems="flex-start"
                                    gap={0.5}
                                    flexWrap="wrap"
                                    justifyContent="flex-end"
                                    sx={{ flexShrink: 0 }}
                                >
                                    {scoreCategories.map(({ key, color }) => {
                                        const count = breakdown[key as keyof typeof breakdown]
                                        if (!count) return null
                                        return (
                                            <Box
                                                key={key}
                                                sx={{
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: '50%',
                                                    backgroundColor: color,
                                                    fontSize: '0.65rem',
                                                    fontWeight: 600,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    lineHeight: 1,
                                                    m: 0,
                                                    p: 0,
                                                }}
                                            >
                                                {count}
                                            </Box>
                                        )
                                    })}
                                </Box>
                            </Box>
                            <Box
                                sx={{
                                    display: { xs: 'none', sm: 'flex' },
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                    flexDirection: 'row',
                                    gap: 2,
                                    width: '100%',
                                    overflowX: 'hidden',
                                    height: 56,
                                    flexWrap: 'nowrap',
                                }}
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
                                        sx={{
                                            lineHeight: 1,
                                            m: 0,
                                            p: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {myPlace}. {player.Name}
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
                                        sx={{
                                            lineHeight: 1,
                                            m: 0,
                                            p: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            color: scoreColor,
                                        }}
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
                                    sx={{ flexShrink: 0, height: '100%', marginLeft: 'auto' }}
                                >
                                    {scoreCategories.map(({ key, color }) => {
                                        const count = breakdown[key as keyof typeof breakdown]
                                        return (
                                            <Box
                                                key={key}
                                                sx={{
                                                    width: 48,
                                                    height: 48,
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
                    </>
                )
            })()}
            {/* Circle legend under the leaderboard */}
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: { xs: 1, sm: 1.5 },
                    mt: 2,
                    pt: 1.5,
                    borderTop: 1,
                    borderColor: 'divider',
                    px: 0.5,
                }}
            >
                {scoreCategories.map(({ key, color, label }) => (
                    <Box
                        key={key}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                        }}
                    >
                        <Box
                            sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: color,
                                flexShrink: 0,
                            }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {label}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    )
}
