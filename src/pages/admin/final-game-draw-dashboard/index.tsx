import {useCallback, useEffect, useRef, useState} from 'react'
import {Box, Link as MuiLink, Typography} from '@mui/material'
import {ThemeProvider} from '@mui/material/styles'
import theme, {dashboardLedDarkTheme} from '@/lib/theme'
import Confetti from 'react-dom-confetti'
import Image from 'next/image'
import NextLink from 'next/link'
import {useRouter} from 'next/router'
import type {FinalGameDrawResponse, PuttingGameState} from '@/src/api/useCheckinApi'
import {useCheckinApi} from '@/src/api/useCheckinApi'
import {isDashboardLedDarkMode, useLedDashboardChrome} from '@/src/utils/dashboardDarkMode'
import SlotMachine, {SlotMachineHandle} from '@/src/components/SlotMachine'

const RECONNECT_DELAY_MS = 2000

/** Brand header — same in light and nested LED dark theme. */
const DRAW_HEADER_BG = '#313690'
const DRAW_HEADER_FG = '#ffffff'

/** Match draw-dashboard LED wall (1000×600). */
const LED_STAGE_W = 1000
const LED_STAGE_H = 600
const LED_SLOT_PX = Math.round((80 * LED_STAGE_H) / 375)
/** Footer strip on coarse-pitch LED — keep body text at readable physical size (≥25px). */
const LED_FOOTER_FONT_PX = 25

type Phase = 'idle' | 'winner'

export default function FinalGameDrawDashboard() {
    const router = useRouter()
    const darkMode = !router.isReady || isDashboardLedDarkMode(router.query.darkMode)
    const activeTheme = darkMode ? dashboardLedDarkTheme : theme
    useLedDashboardChrome(darkMode)

    const {
        getFinalGameDrawState,
        subscribeToFinalGameDrawState,
        getCheckins,
        getFinalGamePuttingState,
        subscribeToFinalGamePuttingState,
    } = useCheckinApi()

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

    /** When 10 participants are locked, SSE to putting game — redirect once admin starts («Alusta mängu» → `running`). */
    useEffect(() => {
        if (!router.isReady || sortedParticipants.length < 10) {
            return undefined
        }

        let cancelled = false
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null
        let puttingUnsub: (() => void) | null = null
        let redirected = false

        const clearReconnectTimer = () => {
            if (reconnectTimer) {
                clearTimeout(reconnectTimer)
                reconnectTimer = null
            }
        }

        const cleanupPuttingSocket = () => {
            puttingUnsub?.()
            puttingUnsub = null
        }

        const goToPuttingIfRunning = (data: PuttingGameState) => {
            if (cancelled || redirected || data.status !== 'running') return
            redirected = true
            clearReconnectTimer()
            cleanupPuttingSocket()
            const qs = darkMode ? '' : '?darkMode=false'
            void router.replace(`/admin/final-game-putting-dashboard${qs}`)
        }

        const connectPuttingSse = () => {
            if (cancelled || redirected) return
            cleanupPuttingSocket()
            puttingUnsub = subscribeToFinalGamePuttingState(
                goToPuttingIfRunning,
                () => {
                    if (cancelled || redirected) return
                    reconnectTimer = setTimeout(connectPuttingSse, RECONNECT_DELAY_MS)
                },
            )
        }

        void (async () => {
            try {
                const initial = await getFinalGamePuttingState()
                if (!cancelled) goToPuttingIfRunning(initial)
            } catch {
                /* SSE will catch up when game starts */
            }
            if (cancelled || redirected) return
            connectPuttingSse()
        })()

        return () => {
            cancelled = true
            clearReconnectTimer()
            cleanupPuttingSocket()
        }
    }, [
        router,
        router.isReady,
        darkMode,
        sortedParticipants.length,
        getFinalGamePuttingState,
        subscribeToFinalGamePuttingState,
    ])

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
                            position: 'relative',
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1.25,
                                flexWrap: 'wrap',
                                pr: isComplete ? 16 : 0,
                                boxSizing: 'border-box',
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
                                JJ100 Putimäng
                            </Typography>
                        </Box>
                        {isComplete && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    right: 12,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                }}
                            >
                                <NextLink
                                    href={
                                        darkMode
                                            ? '/admin/final-game-putting-dashboard'
                                            : '/admin/final-game-putting-dashboard?darkMode=false'
                                    }
                                    passHref
                                    legacyBehavior
                                >
                                    <MuiLink
                                        sx={{
                                            fontSize: 20,
                                            fontWeight: 700,
                                            color: DRAW_HEADER_FG,
                                            textDecoration: 'none',
                                            textAlign: 'right',
                                            display: 'block',
                                            lineHeight: 1.2,
                                            wordBreak: 'break-word',
                                            '&:hover': { textDecoration: 'underline' },
                                        }}
                                    >
                                        Puttima →
                                    </MuiLink>
                                </NextLink>
                            </Box>
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
                                px: 2,
                                py: 1.5,
                                borderTop: '1px solid',
                                borderColor: 'divider',
                                boxSizing: 'border-box',
                                textAlign: 'left',
                            }}
                        >
                            <Typography
                                component="div"
                                sx={{
                                    fontSize: LED_FOOTER_FONT_PX,
                                    lineHeight: 1.4,
                                    wordBreak: 'break-word',
                                    hyphens: 'auto',
                                }}
                            >
                                <Box
                                    component="span"
                                    sx={{
                                        fontWeight: 800,
                                        color: 'primary.main',
                                        letterSpacing: '0.02em',
                                    }}
                                >
                                    Putivad:{' '}
                                </Box>
                                {sortedParticipants.length === 0 ? (
                                    <Box
                                        component="span"
                                        sx={{
                                            color: 'text.secondary',
                                            fontStyle: 'italic',
                                            fontWeight: 500,
                                        }}
                                    >
                                        Loositakse...
                                    </Box>
                                ) : (
                                    <Box
                                        component="span"
                                        sx={{
                                            fontWeight: 600,
                                            color: 'text.primary',
                                        }}
                                    >
                                        {sortedParticipants.map((p) => p.name).join(', ')}
                                    </Box>
                                )}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </ThemeProvider>
    )
}
