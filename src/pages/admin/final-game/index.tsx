import {useEffect, useState} from 'react'
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Paper,
    Stack,
    Typography,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {CheckedInPlayer, FinalGameParticipant, PuttingGameState, useCheckinApi} from '@/src/api/useCheckinApi'
import {useAuth} from '@/src/contexts/AuthContext'
import {useRouter} from 'next/router'
import usePlayerApi from '@/src/api/usePlayerApi'
import AdminLayout from '@/src/components/AdminLayout'

export default function FinalGameDrawPage() {
    const {
        getCheckins,
        getPuttingGameState,
        startPuttingGame,
        resetPuttingGame,
        recordPuttingResult,
        removeFinalGameParticipant,
        drawWinner,
        deleteCheckin,
        confirmFinalGameCheckin,
    } = useCheckinApi()
    const {user, loading, refreshMe} = useAuth()
    const {setActiveCompetition} = usePlayerApi()
    const router = useRouter()
    const competitionIdParam = router.query.competitionId

    const [finalGameCount, setFinalGameCount] = useState(0)
    const [finalGameParticipants, setFinalGameParticipants] = useState<FinalGameParticipant[]>([])
    const [removeConfirm, setRemoveConfirm] = useState<FinalGameParticipant | null>(null)
    const [resetConfirm, setResetConfirm] = useState(false)
    const [puttingGame, setPuttingGame] = useState<PuttingGameState | null>(null)
    const [isRecordingResult, setIsRecordingResult] = useState(false)
    const [currentName, setCurrentName] = useState('')
    const [winner, setWinner] = useState<CheckedInPlayer | null>(null)

    const isAdmin = user?.isAdmin ?? false

    const applyPuttingState = (state: PuttingGameState | null) => {
        const participants = state?.players ?? []
        setFinalGameCount(participants.length)
        setFinalGameParticipants(participants)
        setPuttingGame(state)
    }

    const fetchData = async () => {
        try {
            const puttingGameState = await getPuttingGameState()
            applyPuttingState(puttingGameState ?? null)
            return puttingGameState
        } catch (err) {
            console.error('Failed to fetch:', err)
            return null
        }
    }

    useEffect(() => {
        if (loading) return
        if (!user) return
        if (!isAdmin) {
            router.replace('/')
            return
        }

        if (competitionIdParam && typeof competitionIdParam === 'string') {
            const compId = parseInt(competitionIdParam, 10)
            if (!isNaN(compId) && user.activeCompetitionId !== compId) {
                setActiveCompetition(compId)
                    .then(() => refreshMe().then(() => fetchData()))
                    .catch(() => fetchData())
                return
            }
        }

        if (user.activeCompetitionId == null) return
        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, user, isAdmin, router, competitionIdParam])

    const startDraw = async () => {
        if (!isAdmin) return
        if (finalGameParticipants.length === 0 || finalGameCount >= 10) return

        setWinner(null)
        setCurrentName('')

        try {
            const drawnWinner = await drawWinner(true)
            setWinner(drawnWinner)
            setCurrentName(drawnWinner.player.name)
            await fetchData()
        } catch (e) {
            console.error('Failed to draw winner:', e)
        }
    }

    const handleConfirmPresent = async () => {
        if (!isAdmin || !winner) return
        try {
            await confirmFinalGameCheckin(winner.id)
            const fgState = await fetchData()
            setWinner(null)
            setCurrentName('')
            const newCount = fgState?.players?.length ?? 0
            if (newCount < 10) {
                const drawnWinner = await drawWinner(true)
                setWinner(drawnWinner)
                setCurrentName(drawnWinner.player.name)
            }
        } catch (e) {
            console.error('Failed to confirm player:', e)
        }
    }

    const handleNotPresent = async () => {
        if (!isAdmin || !winner) return
        try {
            await deleteCheckin(winner.id)
            await fetchData()
            setWinner(null)
            setCurrentName('')
            startDraw()
        } catch (e) {
            console.error('Failed to delete player:', e)
        }
    }

    if (loading || !user) {
        return (
            <AdminLayout>
                <Box textAlign="center" mt={6}>
                    <Typography variant="h4">Laadimine...</Typography>
                </Box>
            </AdminLayout>
        )
    }

    if (!isAdmin) {
        return (
            <AdminLayout>
                <Box textAlign="center">
                    <Typography variant="h4">Puudub juurdepääs</Typography>
                    <Typography variant="body1" mt={2}>
                        Ainult administraatoritel on juurdepääs sellele lehele.
                    </Typography>
                </Box>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <Box sx={{maxWidth: 400, mx: 'auto', px: 2, py: 3}}>
                <Typography variant="h4" fontWeight="bold" mb={2}>
                    Putimäng
                </Typography>

                {(puttingGame == null || puttingGame?.status === 'not_started') && (
                    <>
                        <Paper variant="outlined" sx={{p: 2, mb: 3, textAlign: 'center'}}>
                            <Typography variant="body2" color="text.secondary">
                                Loosis osalejaid
                            </Typography>
                            <Typography variant="h4" fontWeight="700">
                                {finalGameParticipants.length }
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mt={1}>
                                Valitud: {finalGameCount} / 10
                            </Typography>
                        </Paper>

                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.5}}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={startDraw}
                                disabled={finalGameParticipants.length  === 0 || finalGameCount >= 10 || !!(currentName && winner)}
                                fullWidth
                            >
                                {finalGameCount >= 10 ? '10 mängijat valitud' : 'Loosime'}
                            </Button>
                        </Box>
                    </>
                )}

                {currentName && winner && (
                    <Box sx={{mt: 3, pt: 3, borderTop: 1, borderColor: 'divider', textAlign: 'center'}}>
                        <Typography variant="body2" color="text.secondary">
                            Loositud
                        </Typography>
                        <Typography variant="h6" fontWeight="600" my={2}>
                            {currentName}
                        </Typography>
                        <Stack direction="row" spacing={2} justifyContent="center">
                            <Button variant="contained" color="success" onClick={handleConfirmPresent}>
                                Kohal
                            </Button>
                            <Button variant="contained" color="error" onClick={handleNotPresent}>
                                Pole kohal
                            </Button>
                        </Stack>
                    </Box>
                )}

                {finalGameCount >= 10 && (puttingGame == null || puttingGame?.status === 'not_started') && (
                    <Box sx={{mt: 3, pt: 3, borderTop: 1, borderColor: 'divider', textAlign: 'center'}}>
                        <Button variant="contained" color="primary" size="large" onClick={async () => {
                            try {
                                await startPuttingGame()
                                await fetchData()
                            } catch (e) {
                                console.error('Failed to start:', e)
                            }
                        }}>
                            Alusta mängu
                        </Button>
                    </Box>
                )}

                {puttingGame?.status === 'running' && (
                    <Box sx={{mt: 3}}>
                        <Paper variant="outlined" sx={{p: 2, mb: 2, textAlign: 'center'}}>
                            <Typography variant="body2" color="text.secondary">Voor</Typography>
                            <Typography variant="h5" fontWeight="700">{puttingGame.currentLevel}m</Typography>
                            <Typography variant="body2" color="text.secondary" mt={1}>Järgmine</Typography>
                            <Typography variant="h6" fontWeight="600">{puttingGame.currentTurnName ?? '-'}</Typography>
                        </Paper>
                        <Stack direction="row" spacing={2} justifyContent="center" sx={{mb: 2}}>
                            <Button
                                variant="contained"
                                color="success"
                                size="large"
                                disabled={puttingGame.currentTurnParticipantId == null || isRecordingResult}
                                onClick={async () => {
                                    if (puttingGame.currentTurnParticipantId == null || isRecordingResult) return
                                    setIsRecordingResult(true)
                                    try {
                                        const state = await recordPuttingResult(puttingGame.currentTurnParticipantId, 'in')
                                        applyPuttingState(state)
                                    } catch (e) {
                                        console.error('Failed:', e)
                                    } finally {
                                        setIsRecordingResult(false)
                                    }
                                }}
                            >
                                Sisse
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                size="large"
                                disabled={puttingGame.currentTurnParticipantId == null || isRecordingResult}
                                onClick={async () => {
                                    if (puttingGame.currentTurnParticipantId == null || isRecordingResult) return
                                    setIsRecordingResult(true)
                                    try {
                                        const state = await recordPuttingResult(puttingGame.currentTurnParticipantId, 'out')
                                        applyPuttingState(state)
                                    } catch (e) {
                                        console.error('Failed:', e)
                                    } finally {
                                        setIsRecordingResult(false)
                                    }
                                }}
                            >
                                Mööda
                            </Button>
                        </Stack>
                        <Stack direction="row" spacing={2} sx={{mb: 2}}>
                            <Button variant="outlined" color="warning" size="small"
                                    onClick={() => setResetConfirm(true)}>
                                Lähtesta mäng
                            </Button>
                        </Stack>
                    </Box>
                )}

                {puttingGame?.status === 'finished' && puttingGame.winnerName && (
                    <Box sx={{mt: 3, pt: 3, borderTop: 1, borderColor: 'divider', textAlign: 'center'}}>
                        <Typography variant="subtitle1" color="text.secondary">Võitja</Typography>
                        <Typography variant="h5" fontWeight="700">{puttingGame.winnerName}</Typography>
                        <Button variant="outlined" color="warning" size="small" onClick={() => setResetConfirm(true)}
                                sx={{mt: 2}}>
                            Lähtesta mäng
                        </Button>
                    </Box>
                )}

                {finalGameParticipants.length > 0 && (
                    <Box sx={{mt: 3, pt: 3, borderTop: 1, borderColor: 'divider'}}>
                        <Typography variant="subtitle1" fontWeight="600" mb={1}>
                            Putimängus osalevad
                        </Typography>
                        <List dense disablePadding>
                            {finalGameParticipants.map((p) => {
                                const puttingPlayer = puttingGame?.players?.find((pl) => pl.finalParticipantId === p.finalParticipantId)
                                const threwThisRound = puttingGame?.status === 'running' && puttingPlayer != null && puttingPlayer.lastLevel === puttingGame.currentLevel && puttingPlayer.lastResult != null
                                const resultIcon = threwThisRound
                                    ? puttingPlayer!.lastResult === 'in'
                                        ? <CheckIcon sx={{fontSize: 18, color: 'success.main', ml: 0.5}} aria-hidden/>
                                        : <CloseIcon sx={{fontSize: 18, color: 'error.main', ml: 0.5}} aria-hidden/>
                                    : null
                                return (
                                    <ListItem
                                        key={p.finalParticipantId}
                                        sx={{px: 0, py: 0.5}}
                                        secondaryAction={
                                            (puttingGame == null || puttingGame?.status === 'not_started') ? (
                                                <IconButton
                                                    edge="end"
                                                    size="small"
                                                    onClick={() => setRemoveConfirm(p)}
                                                    aria-label="Eemalda"
                                                >
                                                    <DeleteOutlineIcon fontSize="small"/>
                                                </IconButton>
                                            ) : undefined
                                        }
                                    >
                                        <ListItemText
                                            primary={
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        ...(p.status === 'out' && {
                                                            textDecoration: 'line-through',
                                                            color: 'text.secondary'
                                                        }),
                                                    }}
                                                >
                                                    {`${p.order}. ${p.name}`}
                                                    {resultIcon}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                )
                            })}
                        </List>
                    </Box>
                )}

                <Dialog open={!!removeConfirm} onClose={() => setRemoveConfirm(null)}>
                    <DialogTitle>Eemalda mängija?</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Oled kindel, et soovid{' '}
                            <Box component="span" sx={{fontWeight: 700}}>{removeConfirm?.name}</Box>
                            {' '}putimängust eemaldada?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setRemoveConfirm(null)}>Katkesta</Button>
                        <Button
                            color="error"
                            variant="contained"
                            onClick={async () => {
                                if (!removeConfirm) return
                                try {
                                    await removeFinalGameParticipant(removeConfirm.finalParticipantId)
                                    setRemoveConfirm(null)
                                    await fetchData()
                                } catch (e) {
                                    console.error('Failed to remove:', e)
                                }
                            }}
                        >
                            Eemalda
                        </Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={resetConfirm} onClose={() => setResetConfirm(false)}>
                    <DialogTitle>Lähtesta mäng?</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Osalejad jäävad alles. Kõik katsed kustutatakse ja mäng algab esimesest viskest. Jätkan?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setResetConfirm(false)}>Katkesta</Button>
                        <Button
                            color="warning"
                            variant="contained"
                            onClick={async () => {
                                try {
                                    await resetPuttingGame()
                                    setResetConfirm(false)
                                    await fetchData()
                                } catch (e) {
                                    console.error('Failed to reset:', e)
                                }
                            }}
                        >
                            Lähtesta
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </AdminLayout>
    )
}
