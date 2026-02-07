import React from 'react'
import {Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,} from '@mui/material'
import type {PredictionLeaderboardResponse} from '@/src/api/usePredictionApi'

interface PredictionLeaderboardProps {
    leaderboard: PredictionLeaderboardResponse | null
    onPlayerClick?: (playerId: number, playerName: string, rank: number) => void
    containerSx?: Record<string, unknown>
}

export function PredictionLeaderboard({
    leaderboard,
    onPlayerClick,
    containerSx,
}: PredictionLeaderboardProps) {
    if (!leaderboard || leaderboard.top_10.length === 0) {
        return null
    }

    const handlePlayerClick = (playerId: number | undefined, playerName: string, rank: number) => {
        if (playerId && onPlayerClick) {
            onPlayerClick(playerId, playerName, rank)
        }
    }

    return (
        <Box sx={{ width: '100%', ...containerSx }}>
                <TableContainer sx={{width: '100%'}}>
                    <Table sx={{width: '100%'}}>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{fontWeight: 'bold', py: 1.5}}>Koht</TableCell>
                                <TableCell sx={{fontWeight: 'bold', py: 1.5}}>Mängija</TableCell>
                                <TableCell align="right" sx={{fontWeight: 'bold', py: 1.5}}>Punktid</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {leaderboard.top_10.map((entry, index) => {
                                const isUser = leaderboard.user_rank && entry.rank === leaderboard.user_rank.rank
                                return (
                                    <TableRow
                                        key={entry.rank}
                                        onClick={() => handlePlayerClick(entry.player_id, entry.player_name, entry.rank)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                handlePlayerClick(entry.player_id, entry.player_name, entry.rank)
                                            }
                                        }}
                                        tabIndex={entry.player_id ? 0 : undefined}
                                        role={entry.player_id ? 'button' : undefined}
                                        sx={{
                                            fontWeight: isUser ? 'bold' : 'normal',
                                            backgroundColor: index % 2 === 0 ? 'background.paper' : 'action.hover',
                                            cursor: entry.player_id ? 'pointer' : 'default',
                                            '&:hover': {
                                                backgroundColor: 'action.selected',
                                            },
                                            '& td': {
                                                cursor: entry.player_id ? 'pointer' : 'default',
                                            },
                                        }}
                                    >
                                        <TableCell sx={{fontWeight: isUser ? 'bold' : 'normal', py: 1.5}}>
                                            {entry.rank}
                                        </TableCell>
                                        <TableCell sx={{fontWeight: isUser ? 'bold' : 'normal', py: 1.5}}>
                                            {entry.player_name}
                                        </TableCell>
                                        <TableCell align="right" sx={{fontWeight: isUser ? 'bold' : 'normal', py: 1.5}}>
                                            {entry.score}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {/* Show separator dots if user rank is 12 or more */}
                            {leaderboard.user_rank &&
                                !leaderboard.top_10.some((entry) => entry.rank === leaderboard.user_rank!.rank) &&
                                leaderboard.user_rank.rank >= 12 && (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center" sx={{py: 1}}>
                                            <Typography variant="body2" color="text.secondary">
                                                • • •
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            {/* Show user's rank separately if not in top 10 */}
                            {leaderboard.user_rank &&
                                !leaderboard.top_10.some((entry) => entry.rank === leaderboard.user_rank!.rank) && (
                                    <TableRow
                                        onClick={() => {
                                            const userRank = leaderboard.user_rank
                                            if (userRank) {
                                                handlePlayerClick(userRank.player_id, userRank.player_name, userRank.rank)
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                const userRank = leaderboard.user_rank
                                                if (userRank) {
                                                    handlePlayerClick(userRank.player_id, userRank.player_name, userRank.rank)
                                                }
                                            }
                                        }}
                                        tabIndex={leaderboard.user_rank?.player_id ? 0 : undefined}
                                        role={leaderboard.user_rank?.player_id ? 'button' : undefined}
                                        sx={{
                                            fontWeight: 'bold',
                                            backgroundColor: leaderboard.top_10.length % 2 === 0 ? 'background.paper' : 'action.hover',
                                            cursor: leaderboard.user_rank?.player_id ? 'pointer' : 'default',
                                            '&:hover': {
                                                backgroundColor: 'action.selected',
                                            },
                                            '& td': {
                                                cursor: leaderboard.user_rank?.player_id ? 'pointer' : 'default',
                                            },
                                        }}
                                    >
                                        <TableCell sx={{fontWeight: 'bold', py: 1.5}}>
                                            {leaderboard.user_rank.rank}
                                        </TableCell>
                                        <TableCell sx={{fontWeight: 'bold', py: 1.5}}>
                                            {leaderboard.user_rank.player_name}
                                        </TableCell>
                                        <TableCell align="right" sx={{fontWeight: 'bold', py: 1.5}}>
                                            {leaderboard.user_rank.score}
                                        </TableCell>
                                    </TableRow>
                                )}
                        </TableBody>
                    </Table>
                </TableContainer>
        </Box>
    )
}
