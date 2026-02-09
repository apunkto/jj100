import {useCallback, useEffect, useRef, useState} from 'react'
import {Box, Typography} from '@mui/material'
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'
import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined'
import Confetti from 'react-dom-confetti'
import {useCheckinApi} from '@/src/api/useCheckinApi'
import {useAuth} from '@/src/contexts/AuthContext'
import {useRouter} from 'next/router'
import SlotMachine, {SlotMachineHandle} from '@/src/components/SlotMachine'

const RECONNECT_DELAY_MS = 2000

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
    setFrozenParticipantCount: React.Dispatch<React.SetStateAction<number | null>>,
    setIsSlotSpinning: React.Dispatch<React.SetStateAction<boolean>>,
    refs: { lastWinnerRef: React.MutableRefObject<string | null>; currentParticipantCountRef: React.MutableRefObject<number> }
) {
    const next = normalizeDrawState(raw)
    const drawActive = next.winnerName != null && (next.countdown != null || next.countdownStartedAt != null)
    const isNewWinner = refs.lastWinnerRef.current !== next.winnerName
    
    if (drawActive && isNewWinner) {
        // Freeze CURRENT participant count BEFORE updating state - capture the count before winner is drawn
        setFrozenParticipantCount(refs.currentParticipantCountRef.current)
        setIsSlotSpinning(true)
    }
    
    // Update ref with new count
    refs.currentParticipantCountRef.current = next.participantCount
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
        setIsSlotSpinning(false)
        setFrozenParticipantCount(null)
    }
}

export default function DrawDashboardPage() {
    const {getDrawState, subscribeToDrawState, getCheckins} = useCheckinApi()
    const {user, loading} = useAuth()
    const router = useRouter()

    const [state, setState] = useState<DrawState>({ participantCount: 0 })
    // Keep ref in sync with state
    useEffect(() => {
        currentParticipantCountRef.current = state.participantCount
    }, [state.participantCount])
    const [phase, setPhase] = useState<Phase>('idle')
    const [displayName, setDisplayName] = useState('')
    const [confettiActive, setConfettiActive] = useState(false)
    const [drawKey, setDrawKey] = useState(0)
    const [isSlotSpinning, setIsSlotSpinning] = useState(false)
    const [frozenParticipantCount, setFrozenParticipantCount] = useState<number | null>(null)
    const unsubscribeRef = useRef<(() => void) | null>(null)
    const slotRef = useRef<SlotMachineHandle>(null)
    const lastWinnerRef = useRef<string | null>(null)
    const currentParticipantCountRef = useRef<number>(0)
    const refs = { lastWinnerRef, currentParticipantCountRef }

    const isAdmin = user?.isAdmin ?? false

    const reconnect = useCallback(() => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current()
            unsubscribeRef.current = null
        }
        const unsub = subscribeToDrawState(
            (raw) => applyDrawState(raw, setState, setPhase, setDisplayName, setDrawKey, setFrozenParticipantCount, setIsSlotSpinning, refs),
            () => setTimeout(reconnect, RECONNECT_DELAY_MS)
        )
        unsubscribeRef.current = unsub
    }, [subscribeToDrawState])

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
                applyDrawState(drawState, setState, setPhase, setDisplayName, setDrawKey, setFrozenParticipantCount, setIsSlotSpinning, refs)
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
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
                <Typography variant="h3">Laadimine...</Typography>
            </Box>
        )
    }

    if (!isAdmin) {
        return null
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                height: '100vh',
                maxHeight: '100dvh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'start',
                px: 2,
                py: 2,
                boxSizing: 'border-box',
                // Solid-ish background for LED: reads well at low resolution
                background: phase === 'winner'
                    ? 'linear-gradient(180deg, #faf6f0 0%, #f0eae2 50%, #e8e2da 100%)'
                    : 'linear-gradient(180deg, #faf6f0 0%, #f2ede6 50%, #eae5de 100%)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <Box
                sx={{
                    width: '100%',
                    maxWidth: 1100,
                    display: 'flex',
                    flexDirection: 'column',
                    pt: 10,
                    alignItems: 'center',
                    justifyContent: 'start',
                    gap: phase === 'winner' ? 2 : 3,
                    flex: 1,
                    minHeight: 0,
                }}
            >
                {/* Header: large text/icons for LED / viewing distance */}
                <Box
                    sx={{
                        flexShrink: 0,
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0.5,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <CasinoOutlinedIcon sx={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'primary.main' }} />
                        <Typography
                            component="h1"
                            sx={{
                                fontSize: 'clamp(2rem, 5.5vw, 3.25rem)',
                                fontWeight: 800,
                                letterSpacing: '-0.02em',
                                color: '#1a1a1a',
                                lineHeight: 1.15,
                            }}
                        >
                            JJ100 Loosisuhinnad
                        </Typography>
                          </Box>
      
                    <Typography sx={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 700, color: '#1a1a1a', mt: 1 }}>
                        Loosis osalejaid: {isSlotSpinning && frozenParticipantCount !== null ? frozenParticipantCount : state.participantCount}
                    </Typography>
                </Box>

                {phase === 'winner' && (
                    <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

                <Box
                    sx={{
                        textAlign: 'center',
                        px: { xs: 2, sm: 4 },
                        py: 3,
                        borderRadius: 3,
                        width: '100%',
                        maxWidth: 900,
                        boxSizing: 'border-box',
                        background: 'rgba(255, 252, 248, 0.98)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        border: '2px solid rgba(0,0,0,0.08)',
                    }}
                >
                    {phase === 'winner' && displayName && (
                        <Typography
                            component="div"
                            sx={{
                                fontSize: 'clamp(1rem, 2.5vw, 1.35rem)',
                                fontWeight: 800,
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                color: 'primary.main',
                                mb: 2,
                            }}
                        >
                            Võitja
                        </Typography>
                    )}
                    <SlotMachine
                        ref={slotRef}
                        key={drawKey}
                        names={state.participantNames ?? []}
                        onStopped={() => {
                            setIsSlotSpinning(false)
                            setFrozenParticipantCount(null)
                            setConfettiActive(true)
                            setTimeout(() => setConfettiActive(false), 500)
                        }}
                    />
                </Box>
            </Box>
        </Box>
    )
}
