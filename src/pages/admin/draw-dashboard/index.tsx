import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Box, Typography} from '@mui/material'
import {ThemeProvider} from '@mui/material/styles'
import theme, {dashboardLedDarkTheme} from '@/lib/theme'
import Confetti from 'react-dom-confetti'
import Image from 'next/image'
import {useCheckinApi} from '@/src/api/useCheckinApi'
import {useAuth} from '@/src/contexts/AuthContext'
import {useRouter} from 'next/router'
import SlotMachine, {SlotMachineHandle} from '@/src/components/SlotMachine'

const RECONNECT_DELAY_MS = 2000

/** Brand header bar — fixed so nested LED dark theme does not soften `primary.main`. */
const DRAW_HEADER_BG = '#313690'
const DRAW_HEADER_FG = '#ffffff'

/** Physical LED wall — fixed layout only (no runtime measuring). 1000×600. */
const LED_STAGE_W = 1000
const LED_STAGE_H = 600
/** Row height in px; extra headroom after removing participant count line for 3-line names */
const LED_SLOT_PX = Math.round((80 * LED_STAGE_H) / 375)

type DrawState = {
    participantCount: number
    countdown?: number
    countdownStartedAt?: number
    winnerName?: string
    participantNames?: string[]
}

/** Backend may send countdownStartedAt (broadcast) or precomputed countdown (DO initial state). Normalize so we always have countdown when draw is in progress. */
function normalizeDrawState(raw: DrawState): DrawState {
    if (raw.countdown != null) return raw
    if (raw.countdownStartedAt != null && raw.winnerName != null) {
        const countdown = Math.max(0, 3 - Math.floor((Date.now() - raw.countdownStartedAt) / 1000))
        return { ...raw, countdown }
    }
    return raw
}

type Phase = 'idle' | 'winner'

function applyDrawState(
    raw: DrawState,
    setState: React.Dispatch<React.SetStateAction<DrawState>>,
    setPhase: React.Dispatch<React.SetStateAction<Phase>>,
    setDisplayName: React.Dispatch<React.SetStateAction<string>>,
    setDrawKey: React.Dispatch<React.SetStateAction<number>>,
    refs: { lastWinnerRef: React.MutableRefObject<string | null> }
) {
    const next = normalizeDrawState(raw)
    const drawActive = next.winnerName != null && (next.countdown != null || next.countdownStartedAt != null)

    setState(next)

    if (drawActive) {
        refs.lastWinnerRef.current = next.winnerName!
        setDisplayName(next.winnerName!)
        setPhase('winner')
        // New draw or new winner: new key so slot machine remounts and runs (e.g. when winner comes from SSE)
        setDrawKey(next.countdownStartedAt ?? Date.now())
    } else {
        refs.lastWinnerRef.current = null
        setPhase('idle')
        setDisplayName('')
    }
}

export default function DrawDashboardPage() {
    const {getDrawState, subscribeToDrawState, getCheckins} = useCheckinApi()
    const {user, loading} = useAuth()
    const router = useRouter()
    const darkMode = router.isReady && String(router.query.darkMode ?? '').toLowerCase() === 'true'
    const activeTheme = darkMode ? dashboardLedDarkTheme : theme

    const [state, setState] = useState<DrawState>({ participantCount: 0 })
    const [phase, setPhase] = useState<Phase>('idle')
    const [displayName, setDisplayName] = useState('')
    const [confettiActive, setConfettiActive] = useState(false)
    const [drawKey, setDrawKey] = useState(0)
    const unsubscribeRef = useRef<(() => void) | null>(null)
    const slotRef = useRef<SlotMachineHandle>(null)
    const lastWinnerRef = useRef<string | null>(null)
    const refs = useMemo(() => ({ lastWinnerRef }), [])

    const isAdmin = user?.isAdmin ?? false

    const reconnect = useCallback(() => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current()
            unsubscribeRef.current = null
        }
        const unsub = subscribeToDrawState(
            (raw) => applyDrawState(raw, setState, setPhase, setDisplayName, setDrawKey, refs),
            () => setTimeout(reconnect, RECONNECT_DELAY_MS)
        )
        unsubscribeRef.current = unsub
    }, [subscribeToDrawState, refs])

    // When we have a winner, tell the slot machine to run the draw animation
    useEffect(() => {
        if (phase !== 'winner' || !displayName) return
        const t = setTimeout(() => {
            slotRef.current?.draw(displayName)
        }, 150)
        return () => clearTimeout(t)
    }, [phase, displayName, drawKey])

    // Initial fetch: get draw state and participant names if needed
    useEffect(() => {
        if (loading || !user) return
        if (!isAdmin) {
            router.replace('/')
            return
        }
        const competitionId = user.activeCompetitionId
        if (competitionId == null) return

        let cancelled = false
        Promise.all([getDrawState(), getCheckins()])
            .then(([drawState, checkins]) => {
                if (cancelled) return
                // If draw state doesn't have participant names, fetch them from checkins
                if (!drawState.participantNames && checkins.length > 0) {
                    const names = checkins.filter(p => !p.prize_won).map(p => p.player.name)
                    drawState.participantNames = names
                }
                applyDrawState(drawState, setState, setPhase, setDisplayName, setDrawKey, refs)
            })
            .catch(() => { /* ignore */ })
        reconnect()
        return () => {
            cancelled = true
            if (unsubscribeRef.current) unsubscribeRef.current()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, isAdmin, user?.activeCompetitionId])

    if (loading || !user) {
        return (
            <ThemeProvider theme={activeTheme}>
                <Box
                    sx={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'background.default',
                        color: 'text.primary',
                    }}
                >
                    <Typography variant="h3">Laadimine...</Typography>
                </Box>
            </ThemeProvider>
        )
    }

    if (!isAdmin) {
        return null
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
                            py: 1,
                            px: 1.5,
                            boxSizing: 'border-box',
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1.25,
                                flexWrap: 'wrap',
                            }}
                        >
                            <Box sx={{ position: 'relative', width: 48, height: 42, flexShrink: 0 }}>
                                <Image
                                    src="/logo2.webp"
                                    alt="JJ100"
                                    width={48}
                                    height={42}
                                    style={{ objectFit: 'contain' }}
                                    priority
                                />
                            </Box>
                            <Typography
                                component="h1"
                                sx={{
                                    fontSize: 26,
                                    fontWeight: 800,
                                    letterSpacing: '-0.02em',
                                    color: DRAW_HEADER_FG,
                                    lineHeight: 1.22,
                                }}
                            >
                                JJ100 Loosisauhinnad
                            </Typography>
                        </Box>
                    </Box>

                    <Box
                        sx={{
                            flex: 1,
                            minHeight: 0,
                            width: '100%',
                            bgcolor: 'background.default',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            boxSizing: 'border-box',
                        }}
                    >
                        {phase === 'winner' && (
                            <Box
                                sx={{
                                    position: 'fixed',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    zIndex: 1300,
                                    pointerEvents: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Confetti
                                    active={confettiActive}
                                    config={{
                                        angle: 90,
                                        spread: 160,
                                        startVelocity: 40,
                                        elementCount: 220,
                                        dragFriction: 0.1,
                                        duration: 4500,
                                    }}
                                />
                            </Box>
                        )}
                        <SlotMachine
                            ref={slotRef}
                            key={drawKey}
                            names={state.participantNames ?? []}
                            slotSizePx={LED_SLOT_PX}
                            onStopped={() => {
                                setConfettiActive(true)
                                setTimeout(() => setConfettiActive(false), 500)
                            }}
                        />
                    </Box>
                </Box>
            </Box>
        </ThemeProvider>
    )
}
