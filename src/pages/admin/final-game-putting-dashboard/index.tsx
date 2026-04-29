import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Box, SvgIcon, Typography} from '@mui/material'
import {ThemeProvider} from '@mui/material/styles'
import theme, {dashboardLedDarkTheme} from '@/lib/theme'
import Image from 'next/image'
import {useRouter} from 'next/router'
import {PuttingGameState, useCheckinApi} from '@/src/api/useCheckinApi'

const RECONNECT_DELAY_MS = 2000

/** Brand header — same in light and nested LED dark theme (see draw-dashboard). */
const DRAW_HEADER_BG = '#313690'
const DRAW_HEADER_FG = '#ffffff'
const MAX_DISPLAYED_LEVELS = 20
/** Match draw / final-game-draw LED wall (1000×600). */
const LED_STAGE_W = 1000
const LED_STAGE_H = 600
/** Scale layout/typography vs original 625px-wide stage */
const LED_SCALE = LED_STAGE_W / 625
const s = (px: number) => Math.round(px * LED_SCALE)
/** Show the last N distance columns; older levels scroll off first */
const LED_MAX_VISIBLE_LEVEL_COLS = 10

/** Stroke crown (Lucide-style); reads clearly on LED walls */
function CrownIcon({sizePx, color}: {sizePx: number; color: string}) {
    return (
        <SvgIcon
            inheritViewBox={false}
            viewBox="0 0 24 24"
            sx={{width: sizePx, height: sizePx, flexShrink: 0, color}}
        >
            <path
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"
            />
        </SvgIcon>
    )
}

const cellPx = s(20)
const nameColMin = s(92)
/** Space between name column and level / circle columns */
const nameToResultsGapPx = s(8)
const nameColMaxPx = s(360)

export default function PuttingGameDashboard() {
    const router = useRouter()
    const darkMode = router.isReady && String(router.query.darkMode ?? '').toLowerCase() === 'true'
    const activeTheme = darkMode ? dashboardLedDarkTheme : theme

    const {subscribeToFinalGamePuttingState, getFinalGamePuttingState} = useCheckinApi()

    const [puttingGame, setPuttingGame] = useState<PuttingGameState | null>(null)
    const unsubscribeRef = useRef<(() => void) | null>(null)
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const subscribeRef = useRef<(() => void) | null>(null)

    const applyState = useCallback((raw: PuttingGameState) => {
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
                subscribeRef.current?.()
            }, RECONNECT_DELAY_MS)
        })
        unsubscribeRef.current = unsub
    }, [subscribeToFinalGamePuttingState, applyState])

    useEffect(() => {
        subscribeRef.current = subscribe
    }, [subscribe])

    useEffect(() => {
        let cancelled = false
        getFinalGamePuttingState()
            .then((s) => {
                if (!cancelled) setPuttingGame(s)
            })
            .catch(() => {})
        return () => {
            cancelled = true
        }
    }, [getFinalGamePuttingState])

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
        if (!puttingGame?.players) return []
        return [...puttingGame.players].sort((a, b) => a.order - b.order)
    }, [puttingGame])

    const {levels} = useMemo(() => {
        if (sortedPlayers.length === 0) {
            return {levels: [1] as number[]}
        }
        const max = Math.min(
            MAX_DISPLAYED_LEVELS,
            Math.max(
                puttingGame?.currentLevel ?? 1,
                ...sortedPlayers.map((p) => p.lastLevel),
                1
            )
        )
        const allLevels = Array.from({length: max}, (_, i) => i + 1)
        const displayedLevels =
            allLevels.length > LED_MAX_VISIBLE_LEVEL_COLS
                ? allLevels.slice(-LED_MAX_VISIBLE_LEVEL_COLS)
                : allLevels
        return {levels: displayedLevels}
    }, [sortedPlayers, puttingGame?.currentLevel])

    const isPuttingRunning = puttingGame?.status === 'running'
    const isPuttingFinished = puttingGame?.status === 'finished'

    const renderContent = () => {
        if (!puttingGame) {
            return (
                <Typography
                    sx={{
                        color: 'text.secondary',
                        fontSize: s(14),
                        fontStyle: 'italic',
                        pl: `${s(16)}px`,
                        pr: `${s(8)}px`,
                    }}
                >
                    Ootan...
                </Typography>
            )
        }
        if (sortedPlayers.length === 0) {
            return (
                <Typography
                    sx={{
                        color: 'text.secondary',
                        fontSize: s(14),
                        fontStyle: 'italic',
                        pl: `${s(16)}px`,
                        pr: `${s(8)}px`,
                    }}
                >
                    Ootan...
                </Typography>
            )
        }
        if (!isPuttingRunning && !isPuttingFinished) {
            return (
                <Typography
                    sx={{
                        fontSize: s(13),
                        fontWeight: 600,
                        color: 'text.primary',
                        lineHeight: 1.45,
                        pl: `${s(16)}px`,
                        pr: `${s(8)}px`,
                        textAlign: 'left',
                    }}
                >
                    {sortedPlayers.map((p) => `${p.order}. ${p.name}`).join(', ')}
                </Typography>
            )
        }
        return (
            <Box
                sx={{
                    display: 'grid',
                    /** `1fr` on names was eating free space and pinned level columns to the right */
                    gridTemplateColumns: `auto ${nameToResultsGapPx}px repeat(${levels.length}, ${cellPx}px)`,
                    alignItems: 'center',
                    justifyContent: 'start',
                    gap: `${s(2)}px ${s(2)}px`,
                    width: '100%',
                    pl: `${s(16)}px`,
                    pr: `${s(8)}px`,
                    boxSizing: 'border-box',
                }}
            >
                <Box key="h-empty" />
                <Box key="h-gap" aria-hidden sx={{minWidth: nameToResultsGapPx}} />
                {levels.map((lvl) => (
                    <Typography
                        key={`h-${lvl}`}
                        sx={{
                            fontSize: s(12),
                            fontWeight: 700,
                            color: 'text.secondary',
                            justifySelf: 'center',
                            textAlign: 'center',
                        }}
                    >
                        {lvl}
                    </Typography>
                ))}
                {sortedPlayers.map((p) => {
                    const isRowWinner =
                        isPuttingFinished &&
                        (puttingGame.winnerId != null
                            ? p.finalParticipantId === puttingGame.winnerId
                            : !!(puttingGame.winnerName?.trim() && p.name === puttingGame.winnerName))
                    const strikeOut = !isRowWinner && p.status === 'out'
                    const nameBold = isRowWinner || p.status === 'active'
                    return (
                    <Box key={p.finalParticipantId} sx={{display: 'contents'}}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: `${s(6)}px`,
                                minWidth: nameColMin,
                                maxWidth: nameColMaxPx,
                                minHeight: 0,
                            }}
                        >
                            {isRowWinner && (
                                <CrownIcon sizePx={s(18)} color={darkMode ? '#ffd54f' : '#f9a825'} />
                            )}
                            <Typography
                                component="span"
                                sx={{
                                    fontSize: isPuttingFinished ? s(17) : s(16),
                                    fontWeight: nameBold ? 700 : 500,
                                    color:
                                        isRowWinner || p.status === 'active'
                                            ? 'text.primary'
                                            : 'text.secondary',
                                    textDecoration: strikeOut ? 'line-through' : 'none',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    flex: 1,
                                    minWidth: 0,
                                }}
                            >
                                {p.order}. {p.name}
                            </Typography>
                        </Box>
                        <Box key={`${p.finalParticipantId}-gap`} aria-hidden sx={{minWidth: nameToResultsGapPx}} />
                        {levels.map((lvl) => {
                            const cleared =
                                (p.lastResult === 'in' && lvl <= p.lastLevel) ||
                                (p.lastResult === 'out' && lvl < p.lastLevel)
                            const missed = p.lastResult === 'out' && lvl === p.lastLevel
                            return (
                                <Box
                                    key={`${p.finalParticipantId}-${lvl}`}
                                    sx={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}
                                >
                                    {cleared ? (
                                        <Box
                                            sx={{
                                                width: cellPx - s(2),
                                                height: cellPx - s(2),
                                                borderRadius: '50%',
                                                backgroundColor: '#4caf50',
                                                flexShrink: 0,
                                            }}
                                        />
                                    ) : missed ? (
                                        <Box
                                            sx={{
                                                width: cellPx - s(2),
                                                height: cellPx - s(2),
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
                    )
                })}
            </Box>
        )
    }

    return (
        <ThemeProvider theme={activeTheme}>
            <Box
                sx={{
                    width: LED_STAGE_W,
                    height: LED_STAGE_H,
                    maxWidth: '100vw',
                    maxHeight: '100dvh',
                    mx: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    justifyContent: 'flex-start',
                    px: 0,
                    py: 0,
                    boxSizing: 'border-box',
                    bgcolor: 'background.default',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        justifyContent: 'flex-start',
                        gap: 0,
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        minHeight: 0,
                    }}
                >
                    <Box
                        component="header"
                        sx={{
                            flexShrink: 0,
                            width: '100%',
                            bgcolor: DRAW_HEADER_BG,
                            color: DRAW_HEADER_FG,
                            py: 0.25,
                            px: 1.5,
                            boxSizing: 'border-box',
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                                flexWrap: 'wrap',
                            }}
                        >
                            <Box sx={{position: 'relative', width: s(44), height: s(38), flexShrink: 0}}>
                                <Image
                                    src="/logo2.webp"
                                    alt="JJ100"
                                    width={s(44)}
                                    height={s(38)}
                                    style={{objectFit: 'contain'}}
                                    priority
                                />
                            </Box>
                            <Typography
                                component="h1"
                                sx={{
                                    fontSize: s(24),
                                    fontWeight: 800,
                                    letterSpacing: '-0.02em',
                                    color: DRAW_HEADER_FG,
                                    lineHeight: 1.15,
                                }}
                            >
                                JJ100 Putimäng
                            </Typography>
                        </Box>
                    </Box>

                    <Box
                        sx={{
                            flexShrink: 0,
                            width: '100%',
                            px: 1,
                            py: 0.5,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            boxSizing: 'border-box',
                        }}
                    >
                        {isPuttingRunning && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'baseline',
                                    justifyContent: 'center',
                                    gap: 1.25,
                                    minWidth: 0,
                                    maxWidth: '100%',
                                    flexWrap: 'nowrap',
                                }}
                            >
                                <Typography
                                    component="span"
                                    sx={{fontSize: s(18), fontWeight: 700, color: 'text.primary', flexShrink: 0}}
                                >
                                    Kaugus: {puttingGame?.currentLevel}m
                                </Typography>
                                {puttingGame?.currentTurnName ? (
                                    <>
                                        <Typography component="span" sx={{fontSize: s(18), color: 'text.secondary', flexShrink: 0}}>
                                            ·
                                        </Typography>
                                        <Typography
                                            component="span"
                                            sx={{
                                                fontSize: s(18),
                                                fontWeight: 600,
                                                color: 'primary.main',
                                                flexShrink: 1,
                                                minWidth: 0,
                                                maxWidth: `min(${nameColMaxPx}px, 100%)`,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            Viskab: {puttingGame.currentTurnName}
                                        </Typography>
                                    </>
                                ) : null}
                            </Box>
                        )}
                        {isPuttingFinished && puttingGame?.winnerName && (
                            <Typography sx={{fontSize: s(18), fontWeight: 800, color: 'primary.main', maxWidth: '100%'}}>
                                Võitja: {puttingGame.winnerName}
                            </Typography>
                        )}
                    </Box>

                    <Box
                        sx={{
                            flex: 1,
                            minHeight: 0,
                            width: '100%',
                            bgcolor: 'background.default',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            justifyContent: 'flex-start',
                            overflow: 'hidden',
                            boxSizing: 'border-box',
                            py: 0.5,
                        }}
                    >
                        {renderContent()}
                    </Box>
                </Box>
            </Box>
        </ThemeProvider>
    )
}
