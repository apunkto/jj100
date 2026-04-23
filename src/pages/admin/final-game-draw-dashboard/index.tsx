import {useCallback, useEffect, useRef, useState} from 'react'
import {Box, Link as MuiLink, Typography} from '@mui/material'
import Confetti from 'react-dom-confetti'
import Image from 'next/image'
import NextLink from 'next/link'
import type {FinalGameDrawResponse} from '@/src/api/useCheckinApi'
import {useCheckinApi} from '@/src/api/useCheckinApi'
import SlotMachine, {SlotMachineHandle} from '@/src/components/SlotMachine'

const RECONNECT_DELAY_MS = 2000

/** Match draw-dashboard LED wall (1000×600). */
const LED_STAGE_W = 1000
const LED_STAGE_H = 600
const LED_SLOT_PX = Math.round((80 * LED_STAGE_H) / 375)

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
    const unsubscribeRef = useRef<(() => void) | null>(null)
    const slotRef = useRef<SlotMachineHandle>(null)
    const lastWinnerRef = useRef<string | null>(null)

    const applyState = useCallback((raw: FinalGameDrawResponse) => {
        const drawActive = raw.winnerName != null && raw.finalGameParticipants.length < 10

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

    return (
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
                bgcolor: 'common.white',
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
                        bgcolor: 'primary.main',
                        color: 'common.white',
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
                                color: 'common.white',
                                lineHeight: 1.22,
                            }}
                        >
                            JJ100 Putimäng
                        </Typography>
                    </Box>
                </Box>

                <Box
                    sx={{
                        flex: 1,
                        minHeight: 0,
                        width: '100%',
                        bgcolor: 'common.white',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        overflow: 'hidden',
                        boxSizing: 'border-box',
                    }}
                >
                    <Box
                        sx={{
                            flex: 1,
                            minHeight: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            position: 'relative',
                        }}
                    >
                        {phase === 'winner' && !isComplete && (
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

                    <Box
                        sx={{
                            flexShrink: 0,
                            width: '100%',
                            px: 1,
                            py: 0.75,
                            borderTop: '1px solid',
                            borderColor: 'divider',
                            boxSizing: 'border-box',
                            textAlign: 'left',
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: 12,
                                fontWeight: 800,
                                color: 'primary.main',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                mb: 0.35,
                            }}
                        >
                            Loositud
                        </Typography>
                        {sortedParticipants.length === 0 ? (
                            <Typography sx={{ color: 'text.secondary', fontSize: 12, fontStyle: 'italic' }}>Loositakse...</Typography>
                        ) : (
                            <Typography
                                component="div"
                                sx={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: '#1a1a1a',
                                    lineHeight: 1.45,
                                    wordBreak: 'break-word',
                                    hyphens: 'auto',
                                }}
                            >
                                {sortedParticipants.map((p) => `${p.order}. ${p.name}`).join(', ')}
                            </Typography>
                        )}
                        {isComplete && (
                            <Box sx={{ mt: 0.75 }}>
                                <NextLink href="/admin/final-game-putting-dashboard" passHref legacyBehavior>
                                    <MuiLink
                                        sx={{
                                            fontSize: 12,
                                            fontWeight: 700,
                                            color: 'primary.main',
                                            textDecoration: 'none',
                                            '&:hover': { textDecoration: 'underline' },
                                        }}
                                    >
                                        Putimäng →
                                    </MuiLink>
                                </NextLink>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}
