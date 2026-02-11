import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Box, Typography} from '@mui/material'
import SportsGolfIcon from '@mui/icons-material/SportsGolf'
import {PuttingGameState, useCheckinApi} from '@/src/api/useCheckinApi'

const RECONNECT_DELAY_MS = 2000
const MAX_DISPLAYED_LEVELS = 20

export default function PuttingGameDashboard() {
    const {subscribeToFinalGamePuttingState} = useCheckinApi()

    const [puttingGame, setPuttingGame] = useState<PuttingGameState | null>(null)
    const unsubscribeRef = useRef<(() => void) | null>(null)
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const applyState = useCallback((raw: PuttingGameState) => {
        console.log('Received putting game state update:', raw)
        setPuttingGame(raw)
    }, [])

    const subscribe = useCallback(() => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current()
            unsubscribeRef.current = null
        }

        const unsub = subscribeToFinalGamePuttingState(applyState, () => {
            reconnectTimerRef.current = setTimeout(() => {
                reconnectTimerRef.current = null
                subscribe()
            }, RECONNECT_DELAY_MS)
        })
        unsubscribeRef.current = unsub
    }, [subscribeToFinalGamePuttingState, applyState])

    useEffect(() => {
        subscribe()
        return () => {
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current)
                reconnectTimerRef.current = null
            }
            if (unsubscribeRef.current) {
                unsubscribeRef.current()
                unsubscribeRef.current = null
            }
        }
    }, [subscribe])

    const sortedPlayers = useMemo(() => {
        console.log('Putting game players:', puttingGame?.players)
        if (!puttingGame?.players) return []
        return [...puttingGame.players].sort((a, b) => a.order - b.order)
    }, [puttingGame?.players])

    const {maxLevel, levels} = useMemo(() => {
        if (sortedPlayers.length === 0)
            return {maxLevel: 1, levels: [1] as number[]}
        const max = Math.min(
            MAX_DISPLAYED_LEVELS,
            Math.max(
                puttingGame?.currentLevel ?? 1,
                ...sortedPlayers.map((p) => p.lastLevel),
                1
            )
        )
        const allLevels = Array.from({length: max}, (_, i) => i + 1)
        // Show only the last 10 rounds if there are more than 10
        const displayedLevels = allLevels.length > 10 ? allLevels.slice(-10) : allLevels
        return {
            maxLevel: max,
            levels: displayedLevels,
        }
    }, [sortedPlayers, puttingGame?.currentLevel])

    const isPuttingRunning = puttingGame?.status === 'running'
    const isPuttingFinished = puttingGame?.status === 'finished'

    const renderContent = () => {
        if (!puttingGame) {
            return <Typography sx={{color: 'text.secondary', fontStyle: 'italic'}}>Ootan...</Typography>
        }
        if (sortedPlayers.length === 0) {
            return <Typography sx={{color: 'text.secondary', fontStyle: 'italic'}}>Ootan...</Typography>
        }
        if (!isPuttingRunning && !isPuttingFinished) {
            return sortedPlayers.map((p) => (
                <Typography
                    key={p.finalParticipantId}
                    sx={{fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 600, color: '#1a1a1a'}}
                >
                    {p.order}. {p.name}
                </Typography>
            ))
        }
        return (
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: `minmax(250px, 1fr) repeat(${levels.length}, clamp(2rem, 4vw, 3rem))`,
                    alignItems: 'center',
                    gap: '0.5rem 0.1rem',
                }}
            >
                <Box key="h-empty"/>
                {levels.map((lvl) => (
                    <Typography
                        key={`h-${lvl}`}
                        sx={{
                            fontSize: 'clamp(1rem, 2vw, 1.5rem)',
                            fontWeight: 600,
                            color: 'text.secondary',
                            justifySelf: 'center'
                        }}
                    >
                        {lvl}
                    </Typography>
                ))}
                {sortedPlayers.map((p) => (
                    <Box key={p.finalParticipantId} sx={{display: 'contents'}}>
                        <Typography
                            sx={{
                                fontSize: isPuttingFinished ? 'clamp(1.5rem, 3vw, 2.25rem)' : 'clamp(1.25rem, 2.5vw, 1.75rem)',
                                fontWeight: p.status === 'active' ? 700 : 500,
                                color: p.status === 'active' ? '#1a1a1a' : 'text.secondary',
                                textDecoration: p.status === 'out' ? 'line-through' : 'none',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {p.order}. {p.name}
                        </Typography>
                        {levels.map((lvl) => {
                            const cleared =
                                (p.lastResult === 'in' && lvl <= p.lastLevel) ||
                                (p.lastResult === 'out' && lvl < p.lastLevel)
                            const missed = p.lastResult === 'out' && lvl === p.lastLevel
                            return (
                                <Box key={`${p.finalParticipantId}-${lvl}`}
                                     sx={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                                    {cleared ? (
                                        <Box
                                            sx={{
                                                width: 'clamp(1.5rem, 3vw, 2.5rem)',
                                                height: 'clamp(1.5rem, 3vw, 2.5rem)',
                                                borderRadius: '50%',
                                                backgroundColor: '#4caf50',
                                                flexShrink: 0,
                                            }}
                                        />
                                    ) : missed ? (
                                        <Box
                                            sx={{
                                                width: 'clamp(1.5rem, 3vw, 2.5rem)',
                                                height: 'clamp(1.5rem, 3vw, 2.5rem)',
                                                borderRadius: '50%',
                                                backgroundColor: '#f44336',
                                                flexShrink: 0,
                                            }}
                                        />
                                    ) : null}
                                </Box>
                            )
                        })}
                    </Box>
                ))}
            </Box>
        )
    }

    return (
        <Box
            sx={{
                minHeight: '100dvh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'start',
                px: 2,
                py: 2,
                boxSizing: 'border-box',
                background: 'linear-gradient(180deg, #faf6f0 0%, #f2ede6 50%, #eae5de 100%)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <Box
                sx={{
                    width: '100%',
                    maxWidth: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    pt: 10,
                    alignItems: 'center',
                    justifyContent: 'start',
                    gap: 3,
                    flex: 1,
                    minHeight: 0,
                    mx: 'auto',
                }}
            >
                <Box sx={{
                    flexShrink: 0,
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5
                }}>
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        flexWrap: 'wrap',
                        justifyContent: 'center'
                    }}>
                        <SportsGolfIcon sx={{fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'primary.main'}}/>
                        <Typography
                            component="h1"
                            sx={{
                                fontSize: 'clamp(2rem, 5.5vw, 3.25rem)',
                                fontWeight: 800,
                                letterSpacing: '-0.02em',
                                color: '#1a1a1a',
                                lineHeight: 1.15
                            }}
                        >
                            JJ100 Putimäng
                        </Typography>
                    </Box>
                    {isPuttingRunning && (
                        <Typography
                            sx={{fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: '#1a1a1a', mt: 1}}>
                            Kaugus: {puttingGame?.currentLevel}m
                        </Typography>
                    )}
                    {isPuttingRunning && puttingGame?.currentTurnName && (
                        <Typography sx={{
                            fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)',
                            fontWeight: 600,
                            color: 'primary.main',
                            mt: 0.5
                        }}>
                            Viskab: {puttingGame.currentTurnName}
                        </Typography>
                    )}
                    {isPuttingFinished && puttingGame?.winnerName && (
                        <Typography
                            sx={{fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: 'primary.main', mt: 1}}>
                            Võitja: {puttingGame.winnerName}
                        </Typography>
                    )}
                </Box>

                <Box
                    sx={{
                        width: '100%',
                        py: 3,
                        px: 4,
                        borderRadius: 3,
                        background: 'rgba(255, 252, 248, 0.98)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        border: '2px solid rgba(0,0,0,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                    }}
                >
                    {renderContent()}
                </Box>
            </Box>
        </Box>
    )
}
