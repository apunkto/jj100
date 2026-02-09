import {useCallback, useEffect, useRef, useState} from 'react'
import {Box, Typography} from '@mui/material'
import SportsGolfIcon from '@mui/icons-material/SportsGolf'
import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined'
import Confetti from 'react-dom-confetti'
import {useCheckinApi} from '@/src/api/useCheckinApi'
import SlotMachine, {SlotMachineHandle} from '@/src/components/SlotMachine'
import type {FinalGameDrawResponse} from '@/src/api/useCheckinApi'

const RECONNECT_DELAY_MS = 2000

type Phase = 'idle' | 'winner'

export default function FinalGameDrawDashboard() {
    const {getFinalGameDrawState, subscribeToFinalGameDrawState, getCheckins} = useCheckinApi()

    const [state, setState] = useState<FinalGameDrawResponse>({
        finalGameParticipants: [],
        participantCount: 0,
    })
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

    const applyState = useCallback((raw: FinalGameDrawResponse) => {
        const drawActive = raw.winnerName != null && raw.finalGameParticipants.length < 10
        const isNewWinner = lastWinnerRef.current !== raw.winnerName

        if (drawActive && isNewWinner) {
            setFrozenParticipantCount(currentParticipantCountRef.current)
            setIsSlotSpinning(true)
        }

        if (raw.participantCount != null) {
            currentParticipantCountRef.current = raw.participantCount
        }
        setState(raw)

        if (drawActive) {
            lastWinnerRef.current = raw.winnerName!
            setDisplayName(raw.winnerName!)
            setPhase('winner')
            setDrawKey(Date.now())
        } else {
            lastWinnerRef.current = null
            setPhase('idle')
            setDisplayName('')
            setIsSlotSpinning(false)
            setFrozenParticipantCount(null)
        }
    }, [])

    const reconnect = useCallback(() => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current()
            unsubscribeRef.current = null
        }
        const unsub = subscribeToFinalGameDrawState(applyState, () => setTimeout(reconnect, RECONNECT_DELAY_MS))
        unsubscribeRef.current = unsub
    }, [subscribeToFinalGameDrawState, applyState])

    useEffect(() => {
        if (phase !== 'winner' || !displayName) return
        const t = setTimeout(() => {
            slotRef.current?.draw(displayName)
        }, 150)
        return () => clearTimeout(t)
    }, [phase, displayName, drawKey])

    useEffect(() => {
        let cancelled = false
        Promise.all([getFinalGameDrawState(), getCheckins()])
            .then(([drawState, checkins]) => {
                if (cancelled) return
                const inFinal = new Set(drawState.finalGameParticipants.map((p) => p.name))
                const participantNames =
                    drawState.participantNames ??
                    (checkins.length > 0 ? checkins.filter((p) => !inFinal.has(p.player.name)).map((p) => p.player.name) : [])
                applyState({ ...drawState, participantNames })
            })
            .catch(() => {})
        reconnect()
        return () => {
            cancelled = true
            if (unsubscribeRef.current) unsubscribeRef.current()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const participants = state.finalGameParticipants ?? []
    const sortedParticipants = [...participants].sort((a, b) => a.order - b.order)
    const isComplete = sortedParticipants.length >= 10
    const participantCount = state.participantCount ?? 0

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
                background: phase === 'winner'
                    ? 'linear-gradient(180deg, #faf6f0 0%, #f0eae2 50%, #e8e2da 100%)'
                    : 'linear-gradient(180deg, #faf6f0 0%, #f2ede6 50%, #eae5de 100%)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {phase === 'winner' && !isComplete && (
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
                    width: '100%',
                    maxWidth: 1200,
                    display: 'flex',
                    flexDirection: 'column',
                    pt: 6,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    flex: 1,
                    minHeight: 0,
                    mx: 'auto',
                }}
            >
                {/* Title Section - Top */}
                <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <SportsGolfIcon sx={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'primary.main' }} />
                        <Typography
                            component="h1"
                            sx={{ fontSize: 'clamp(2rem, 5.5vw, 3.25rem)', fontWeight: 800, letterSpacing: '-0.02em', color: '#1a1a1a', lineHeight: 1.15 }}
                        >
                            JJ100 Putimäng
                        </Typography>
                    </Box>
                    <Typography sx={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 700, color: '#1a1a1a', mt: 1 }}>
                        Loosis osalejaid: {isSlotSpinning && frozenParticipantCount !== null ? frozenParticipantCount : participantCount}
                    </Typography>
                </Box>

                {/* Content Section - Row layout for slot machine and participants */}
                <Box
                    sx={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 3,
                        flex: 1,
                    }}
                >
                    <Box
                        sx={{
                            flex: 1,
                            textAlign: 'center',
                            px: { xs: 2, sm: 4 },
                            py: 3,
                            borderRadius: 3,
                            boxSizing: 'border-box',
                            background: 'rgba(255, 252, 248, 0.98)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            border: '2px solid rgba(0,0,0,0.08)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
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

                    <Box
                        sx={{
                            width: 280,
                            minWidth: 240,
                            py: 3,
                            px: 2,
                            borderRadius: 3,
                            background: 'rgba(255, 252, 248, 0.98)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            border: '2px solid rgba(0,0,0,0.08)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <CasinoOutlinedIcon sx={{ fontSize: '1.5rem', color: 'primary.main' }} />
                            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#1a1a1a' }}>
                                Loositud
                            </Typography>
                        </Box>
                        {sortedParticipants.length === 0 ? (
                            <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>Loositakse...</Typography>
                        ) : (
                            sortedParticipants.map((p) => (
                                <Typography
                                    key={`${p.order}-${p.name}`}
                                    sx={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', fontWeight: 600, color: '#1a1a1a' }}
                                >
                                    {p.order}. {p.name}
                                </Typography>
                            ))
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}
