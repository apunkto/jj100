import { useEffect, useRef, useState } from 'react'
import { Box, Button, Typography, Stack, TextField } from '@mui/material'
import Layout from '@/src/components/Layout'
import Confetti from 'react-dom-confetti'
import { CheckedInPlayer, useCheckinApi } from '@/src/api/useCheckinApi'

export default function DrawPage() {
    const { getCheckins, drawWinner } = useCheckinApi()

    const [players, setPlayers] = useState<CheckedInPlayer[]>([])
    const [currentName, setCurrentName] = useState('')
    const [winner, setWinner] = useState<CheckedInPlayer | null>(null)
    const [shuffling, setShuffling] = useState(false)
    const [confettiActive, setConfettiActive] = useState(false)

    const [authorized, setAuthorized] = useState(false)  // ✅ NEW
    const [passwordInput, setPasswordInput] = useState('')  // ✅ NEW

    const winnerRef = useRef<HTMLDivElement>(null)

    const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'jj101'  // ✅ Same password

    useEffect(() => {
        fetchPlayers()
    }, [])

    const fetchPlayers = async () => {
        try {
            const allCheckins = await getCheckins()
            setPlayers(allCheckins.filter(p => !p.prize_won))
        } catch (err) {
            console.error('Failed to fetch check-ins:', err)
        }
    }

    const startDraw = async () => {
        if (!authorized) return   // ✅ Secure action
        if (players.length === 0) return

        setShuffling(true)
        setWinner(null)
        setConfettiActive(false)

        const shuffleDuration = 4000
        const intervalSpeed = 100

        let drawnWinner: CheckedInPlayer
        try {
            drawnWinner = await drawWinner()
        } catch (e) {
            console.error('Failed to draw winner:', e)
            setShuffling(false)
            return
        }

        const interval = setInterval(() => {
            const randomPlayer = players[Math.floor(Math.random() * players.length)]
            setCurrentName(randomPlayer.player.name)
        }, intervalSpeed)

        setTimeout(() => {
            clearInterval(interval)

            setWinner(drawnWinner)
            setCurrentName(drawnWinner.player.name)
            setShuffling(false)

            setConfettiActive(true)
            setTimeout(() => setConfettiActive(false), 4000)

            fetchPlayers() // refresh players
        }, shuffleDuration)
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
                            Loosimine
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
                                            colors: ['#ea9627', '#71e669', '#cacaca']
                                        }}
                                    />
                                </div>
                            </Box>
                        )}

                        <Button
                            variant="contained"
                            color="primary"
                            onClick={startDraw}
                            sx={{ mt: 4 }}
                            disabled={shuffling || players.length === 0}
                        >
                            Loosime
                        </Button>

                        {winner && (
                            <Box mt={4}>
                                <Typography variant="h3" fontWeight="bold" color="success.main">
                                    🎉 {winner.player.name} 🎉
                                </Typography>
                            </Box>
                        )}
                    </>
                )}
            </Box>
        </Layout>
    )
}
