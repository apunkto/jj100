import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Box, Button, CircularProgress, Typography} from '@mui/material'
import {useRouter} from 'next/router'
import AdminLayout from '@/src/components/AdminLayout'
import {useAuth} from '@/src/contexts/AuthContext'
import {useToast} from '@/src/contexts/ToastContext'
import {useTopPlayersByDivision} from '@/src/api/useTopPlayersByDivision'
import {type LedScreenBoard, type LedScreenState, useLedScreenApi,} from '@/src/api/useLedScreenApi'

const RECONNECT_DELAY_MS = 2000

const PREDICTION_LABEL = 'Ennustusmäng'

const BOARD_ORDER: LedScreenBoard[] = [
    'main',
    'leaderboard',
    'draw',
    'finalDraw',
    'finalPutting',
]

const BOARD_LABEL: Record<LedScreenBoard, string> = {
    main: 'Peaekraan',
    leaderboard: 'Edetabel',
    draw: 'Loos',
    finalDraw: 'Putimängu loos',
    finalPutting: 'Putimäng',
}

export default function LedControlPage() {
    const router = useRouter()
    const {user, loading: authLoading} = useAuth()
    const {showToast} = useToast()
    const {getLedScreenState, subscribeToLedScreen, selectLedScreen} = useLedScreenApi()

    const competitionId = user?.activeCompetitionId ?? null
    const {topPlayersByDivision, loading: divLoading} = useTopPlayersByDivision(competitionId ?? 0)

    const divisions = useMemo(
        () => Object.keys(topPlayersByDivision).sort((a, b) => a.localeCompare(b)),
        [topPlayersByDivision]
    )

    const [remote, setRemote] = useState<LedScreenState | null>(null)
    const [pending, setPending] = useState(false)

    const unsubscribeRef = useRef<(() => void) | null>(null)
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const isAdmin = user?.isAdmin ?? false

    const reconnect = useCallback(() => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current()
            unsubscribeRef.current = null
        }
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current)
            reconnectTimerRef.current = null
        }
        const unsub = subscribeToLedScreen(
            (state) => setRemote(state),
            () => {
                reconnectTimerRef.current = setTimeout(() => reconnect(), RECONNECT_DELAY_MS)
            }
        )
        unsubscribeRef.current = unsub
    }, [subscribeToLedScreen])

    useEffect(() => {
        if (authLoading || !user || !isAdmin || competitionId == null) return

        let cancelled = false
        getLedScreenState()
            .then((s) => {
                if (!cancelled) setRemote(s)
            })
            .catch(() => {})
        reconnect()

        return () => {
            cancelled = true
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current)
                reconnectTimerRef.current = null
            }
            if (unsubscribeRef.current) {
                unsubscribeRef.current()
                unsubscribeRef.current = null
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, isAdmin, competitionId])

    useEffect(() => {
        if (!authLoading && user && !isAdmin) {
            void router.replace('/')
        }
    }, [authLoading, user, isAdmin, router])

    const handleBoard = async (board: LedScreenBoard) => {
        setPending(true)
        try {
            if (board === 'leaderboard') {
                const panel = remote?.leaderboardPanel ?? 'division'
                if (divisions.length === 0) {
                    const data = await selectLedScreen({
                        board,
                        leaderboardPanel: 'prediction',
                    })
                    setRemote(data)
                } else if (panel === 'prediction') {
                    const data = await selectLedScreen({
                        board,
                        leaderboardPanel: 'prediction',
                    })
                    setRemote(data)
                } else {
                    const div =
                        remote?.leaderboardDivision && divisions.includes(remote.leaderboardDivision)
                            ? remote.leaderboardDivision
                            : divisions[0]!
                    const data = await selectLedScreen({
                        board,
                        leaderboardPanel: 'division',
                        leaderboardDivision: div,
                    })
                    setRemote(data)
                }
            } else {
                const data = await selectLedScreen({board})
                setRemote(data)
            }
            showToast('Ekraan uuendatud', 'success')
        } catch (e) {
            showToast(e instanceof Error ? e.message : 'Viga', 'error')
        } finally {
            setPending(false)
        }
    }

    const handlePredictionView = async () => {
        setPending(true)
        try {
            const data = await selectLedScreen({
                board: 'leaderboard',
                leaderboardPanel: 'prediction',
            })
            setRemote(data)
            showToast('Ekraan uuendatud', 'success')
        } catch (e) {
            showToast(e instanceof Error ? e.message : 'Viga', 'error')
        } finally {
            setPending(false)
        }
    }

    const handleDivisionView = async (division: string) => {
        setPending(true)
        try {
            const data = await selectLedScreen({
                board: 'leaderboard',
                leaderboardPanel: 'division',
                leaderboardDivision: division,
            })
            setRemote(data)
            showToast('Ekraan uuendatud', 'success')
        } catch (e) {
            showToast(e instanceof Error ? e.message : 'Viga', 'error')
        } finally {
            setPending(false)
        }
    }

    if (authLoading || !user) {
        return (
            <AdminLayout>
                <Box textAlign="center" mt={6}>
                    <CircularProgress />
                    <Typography variant="h6" mt={2}>
                        Laadimine...
                    </Typography>
                </Box>
            </AdminLayout>
        )
    }

    if (!isAdmin) {
        return (
            <AdminLayout>
                <Box textAlign="center">
                    <Typography variant="h4">Puudub juurdepääs</Typography>
                </Box>
            </AdminLayout>
        )
    }

    if (competitionId == null) {
        return (
            <AdminLayout>
                <Box px={2} textAlign="center">
                    <Typography color="text.secondary">Vali võistlus menüüst.</Typography>
                </Box>
            </AdminLayout>
        )
    }

    const leaderboardPanel = remote?.leaderboardPanel ?? 'division'
    const predictionActive =
        remote?.board === 'leaderboard' && leaderboardPanel === 'prediction'

    return (
        <AdminLayout>
            <Box sx={{maxWidth: 480, mx: 'auto', px: 2, py: 2}}>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                    LED ekraan
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                    Ava võistluse ekraanil:{' '}
                    <Typography component="span" variant="body2" fontWeight={600}>
                        /admin/led-screen
                    </Typography>
                </Typography>

                {remote && (
                    <Typography variant="body2" sx={{mb: 2}}>
                        Praegu:{' '}
                        <strong>{BOARD_LABEL[remote.board]}</strong>
                        {remote.board === 'leaderboard' &&
                            (predictionActive ? ` · ${PREDICTION_LABEL}` : remote.leaderboardDivision
                                  ? ` · ${remote.leaderboardDivision}`
                                  : '')}
                    </Typography>
                )}

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.5}}>
                    {BOARD_ORDER.map((board) => (
                        <Button
                            key={board}
                            variant={remote?.board === board ? 'contained' : 'outlined'}
                            size="large"
                            fullWidth
                            disabled={pending}
                            onClick={() => void handleBoard(board)}
                        >
                            {BOARD_LABEL[board]}
                        </Button>
                    ))}
                </Box>

                {remote?.board === 'leaderboard' && (
                    <Box sx={{mt: 3}}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{mb: 1}}>
                            Edetabel — vaade
                        </Typography>

                        <Button
                            fullWidth
                            size="medium"
                            variant={predictionActive ? 'contained' : 'outlined'}
                            disabled={pending}
                            onClick={() => void handlePredictionView()}
                            sx={{mb: 2, py: 1.25}}
                        >
                            {PREDICTION_LABEL}
                        </Button>

                        {divLoading ? (
                            <Box display="flex" alignItems="center" gap={1}>
                                <CircularProgress size={22} />
                                <Typography variant="body2" color="text.secondary">
                                    Laen klasse...
                                </Typography>
                            </Box>
                        ) : divisions.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                                Klassid puuduvad (ainult ennustus).
                            </Typography>
                        ) : (
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 1,
                                }}
                            >
                                {divisions.map((d) => {
                                    const active =
                                        !predictionActive &&
                                        leaderboardPanel === 'division' &&
                                        remote.leaderboardDivision === d
                                    return (
                                        <Button
                                            key={d}
                                            size="small"
                                            variant={active ? 'contained' : 'outlined'}
                                            disabled={pending}
                                            onClick={() => void handleDivisionView(d)}
                                            sx={{
                                                flex: '1 1 calc(50% - 8px)',
                                                minWidth: 'calc(50% - 8px)',
                                                minHeight: 44,
                                                py: 1,
                                                fontSize: '0.9rem',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {d}
                                        </Button>
                                    )
                                })}
                            </Box>
                        )}
                    </Box>
                )}
            </Box>
        </AdminLayout>
    )
}
