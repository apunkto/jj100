import {Box, Typography} from '@mui/material'
import {usePredictionLeaderboard} from '@/src/api/usePredictionLeaderboard'
import type {PredictionLeaderboardEntry} from '@/src/api/usePredictionApi'

const TOP_SHOWN = 8

/** Prediction leaderboard slide for dashboard rotation (rank, name, points). */
export function PredictionResultsContent({title, entries}: {title: string; entries: PredictionLeaderboardEntry[]}) {
    const rows = entries.slice(0, TOP_SHOWN)

    return (
        <Box
            sx={{
                px: {xs: 1.5, sm: 2, md: 3},
                pt: {xs: 1, sm: 1.25, md: 1.5},
                pb: {xs: 1, sm: 1.25, md: 1.5},
                height: '100%',
                overflowY: 'auto',
                overflowX: 'hidden',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                bgcolor: 'background.default',
                color: 'text.primary',
            }}
        >
            <Typography
                variant="h3"
                fontWeight="bold"
                mb={{xs: 0.75, sm: 1, md: 1.25}}
                textAlign="center"
                sx={{fontSize: {xs: '1.9rem', sm: '2.2rem', md: '2.6rem'}}}
            >
                {title}
            </Typography>
            {rows.map((row, index) => (
                <Box
                    key={`${row.rank}-${row.player_id ?? row.player_name}`}
                    mb={{xs: 0.3, sm: 0.4, md: 0.45}}
                    sx={{width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box'}}
                >
                    <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="flex-start"
                        flexDirection="row"
                        gap={{xs: 0.75, sm: 1.25, md: 2}}
                        sx={{
                            width: '100%',
                            maxWidth: '100%',
                            minWidth: 0,
                            overflowX: 'hidden',
                            minHeight: {xs: 44, sm: 48, md: 52},
                            py: {xs: 0.15, sm: 0.2, md: 0.25},
                            flexWrap: 'nowrap',
                        }}
                    >
                        <Box
                            sx={{
                                flex: '1 1 0%',
                                minWidth: 0,
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                height: '100%',
                            }}
                        >
                            <Typography
                                component="div"
                                fontWeight={600}
                                sx={{
                                    fontSize: {xs: '1.38rem', sm: '1.52rem', md: '1.72rem'},
                                    lineHeight: 1.25,
                                    m: 0,
                                    p: 0,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    width: '100%',
                                }}
                            >
                                {index === 0 ? (
                                    <Box component="span" mr={0.5} sx={{fontSize: {xs: '1.55rem', sm: '1.7rem', md: '1.95rem'}}}>
                                        🔥
                                    </Box>
                                ) : (
                                    <Box component="span" sx={{fontWeight: 700}}>
                                        {row.rank}.{' '}
                                    </Box>
                                )}
                                {row.player_name}
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                minWidth: {xs: 64, sm: 72, md: 84},
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                            }}
                        >
                            <Typography
                                fontWeight={800}
                                sx={{
                                    fontSize: {xs: '1.52rem', sm: '1.7rem', md: '1.95rem'},
                                    lineHeight: 1,
                                    m: 0,
                                    p: 0,
                                    color: 'primary.main',
                                }}
                            >
                                {row.score}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            ))}
        </Box>
    )
}

export default function PredictionResultsSlide({
    competitionId,
    title,
    loadingLabel,
    emptyLabel,
}: {
    competitionId: number
    title: string
    loadingLabel: string
    emptyLabel: string
}) {
    const {entries, loading} = usePredictionLeaderboard(competitionId)

    if (loading) {
        return (
            <Box
                sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 2,
                    bgcolor: 'background.default',
                    color: 'text.primary',
                }}
            >
                <Typography sx={{fontSize: {xs: '1.25rem', sm: '1.4rem'}}}>{loadingLabel}</Typography>
            </Box>
        )
    }

    if (entries.length === 0) {
        return (
            <Box
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 3,
                    gap: 2,
                    bgcolor: 'background.default',
                    color: 'text.primary',
                }}
            >
                <Typography
                    variant="h3"
                    fontWeight="bold"
                    textAlign="center"
                    sx={{fontSize: {xs: '1.75rem', sm: '2rem', md: '2.2rem'}}}
                >
                    {title}
                </Typography>
                <Typography color="text.secondary" textAlign="center" sx={{fontSize: {xs: '1.15rem', sm: '1.3rem'}, maxWidth: 520}}>
                    {emptyLabel}
                </Typography>
            </Box>
        )
    }

    return <PredictionResultsContent title={title} entries={entries} />
}
