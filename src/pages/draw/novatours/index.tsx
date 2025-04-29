import { useEffect, useRef, useState } from 'react'
import { Box, Button, Typography, Stack, TextField } from '@mui/material'
import Layout from '@/src/components/Layout'
import Confetti from 'react-dom-confetti'
import { CheckedInPlayer, useCheckinApi } from '@/src/api/useCheckinApi'

export default function FinalGameDrawPage() {
    const { getCheckins, drawWinner, deleteCheckin, confirmFinalGameCheckin } = useCheckinApi()

    const [players, setPlayers] = useState<CheckedInPlayer[]>([])
    const [currentName, setCurrentName] = useState('')
    const [winner, setWinner] = useState<any>(null)
    const [shuffling, setShuffling] = useState(false)
    const [confettiActive, setConfettiActive] = useState(false)

    const [authorized, setAuthorized] = useState(false)   // ✅ new
    const [passwordInput, setPasswordInput] = useState('') // ✅ new

    const winnerRef = useRef<HTMLDivElement>(null)

    const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'jj101'  // you can set in env

    useEffect(() => {
        fetchPlayers()
    }, [])

    const fetchPlayers = async () => {
        try {
            const allCheckins = await getCheckins()
            setPlayers(allCheckins)
        } catch (err) {
            console.error('Failed to fetch check-ins:', err)
        }
    }

    const startDraw = async () => {
        if (!authorized) return  // ✅ Secure
        if (availablePlayers().length === 0 || finalGamePlayers().length >= 10) return

        setShuffling(true)
        setWinner(null)
        setConfettiActive(false)

        const shuffleDuration = 3000
        const intervalSpeed = 100

        let drawnWinner: CheckedInPlayer
        try {
            drawnWinner = await drawWinner(true)
        } catch (e) {
            console.error('Failed to draw winner:', e)
            setShuffling(false)
            return
        }

        const interval = setInterval(() => {
            const randomPlayer = availablePlayers()[Math.floor(Math.random() * availablePlayers().length)]
            setCurrentName(randomPlayer.player.name)
        }, intervalSpeed)

        setTimeout(() => {
            clearInterval(interval)
            setWinner(drawnWinner)
            setCurrentName(drawnWinner.player.name)
            setShuffling(false)
            setConfettiActive(true)
            setTimeout(() => setConfettiActive(false), 4000)
        }, shuffleDuration)
    }

    const availablePlayers = () => players.filter(p => !p.final_game)
    const finalGamePlayers = () => players.filter(p => p.final_game)
    const sortedFinalGamePlayers = () => finalGamePlayers().sort((a, b) => (a.final_game_order || 0) - (b.final_game_order || 0))

    const handleConfirmPresent = async () => {
        if (!authorized) return  // ✅ Secure
        if (winner) {
            try {
                await confirmFinalGameCheckin(winner.id)
                await fetchPlayers()
                setWinner(null)
                setCurrentName('')
            } catch (e) {
                console.error('Failed to confirm player for final game:', e)
            }
        }
    }

    const handleNotPresent = async () => {
        if (!authorized) return  // ✅ Secure
        if (winner) {
            try {
                await deleteCheckin(winner.id)
                await fetchPlayers()
                setWinner(null)
                setCurrentName('')
                startDraw() // draw new one
            } catch (e) {
                console.error('Failed to delete player:', e)
            }
        }
    }

    const handlePasswordSubmit = () => {
        if (passwordInput === ADMIN_PASSWORD) {
            setAuthorized(true)
        } else {
            alert('Vale salasõna!')
        }
    }

    return (
        <Layout>
            <Box textAlign="center" mt={6} position="relative">

                {!authorized ? (
                    <>
                        <Typography variant="h5" fontWeight="bold" mb={2}>
                            Sisesta salasõna
                        </Typography>
                        <Stack direction="column" spacing={2} alignItems="center">
                            <TextField
                                type="password"
                                label="Salasõna"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                sx={{ width: 300 }}
                            />
                            <Button variant="contained" color="primary" onClick={handlePasswordSubmit}>
                                Kinnita
                            </Button>
                        </Stack>
                    </>
                ) : (
                    <>
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            Putimängu loosimine
                        </Typography>

                        {currentName && (
                            <Box mt={4} ref={winnerRef} position="relative">
                                <Typography variant="h5" fontWeight="bold">
                                    {currentName}
                                </Typography>

                                <div style={{ position: 'absolute', left: '50%', top: '50%', zIndex: 100 }}>
                                    <Confetti
                                        active={confettiActive}
                                        config={{
                                            angle: 90,
                                            spread: 150,
                                            startVelocity: 50,
                                            elementCount: 150,
                                            decay: 0.9,
                                            duration: 4000,
                                            colors: ['#ea9627', '#71e669', '#cacaca'],
                                        }}
                                    />
                                </div>

                                {!shuffling && winner && (
                                    <Stack direction="row" spacing={2} justifyContent="center" mt={3}>
                                        <Button variant="contained" color="success" onClick={handleConfirmPresent}>
                                            Kohal
                                        </Button>
                                        <Button variant="contained" color="error" onClick={handleNotPresent}>
                                            Pole kohal
                                        </Button>
                                    </Stack>
                                )}
                            </Box>
                        )}

                        {!shuffling && !winner && (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={startDraw}
                                sx={{ mt: 6 }}
                                disabled={availablePlayers().length === 0 || finalGamePlayers().length >= 10}
                            >
                                {finalGamePlayers().length >= 10 ? '10 mängijat valitud' : 'Loosi osaleja!'}
                            </Button>
                        )}

                        {finalGamePlayers().length > 0 && (
                            <Box mt={8}>
                                <Typography variant="h5" fontWeight="bold" gutterBottom>
                                    🎯 Putimängus osalevad:
                                </Typography>
                                <Stack spacing={1} mt={2}>
                                    {sortedFinalGamePlayers().map((p, index) => (
                                        <Typography key={p.id}>
                                            {index + 1}. {p.player.name}
                                        </Typography>
                                    ))}
                                </Stack>
                            </Box>
                        )}
                    </>
                )}
            </Box>
        </Layout>
    )
}
