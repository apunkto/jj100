import {useEffect, useRef, useState} from 'react'
import {Box, Button, Typography, Stack, TextField} from '@mui/material'
import Confetti from 'react-dom-confetti'
import Image from 'next/image'
import {CheckedInPlayer, useCheckinApi} from '@/src/api/useCheckinApi'

export default function DrawPage() {
    const {getCheckins, drawWinner} = useCheckinApi()

    const [players, setPlayers] = useState<CheckedInPlayer[]>([])
    const [currentName, setCurrentName] = useState('')
    const [winner, setWinner] = useState<CheckedInPlayer | null>(null)
    const [shuffling, setShuffling] = useState(false)
    const [confettiActive, setConfettiActive] = useState(false)

    const [authorized, setAuthorized] = useState(false)
    const [passwordInput, setPasswordInput] = useState('')

    const winnerRef = useRef<HTMLDivElement>(null)
    const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'jj101'

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
        if (!authorized) return
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
            fetchPlayers()
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
        <Box textAlign="center" mt={6} position="relative">
            {!authorized ? (
                <>
                    <Typography variant="h3" fontWeight="bold" mb={4}>
                        Sisesta salasõna
                    </Typography>
                    <Stack direction="column" spacing={4} alignItems="center">
                        <TextField
                            type="password"
                            label="Salasõna"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            sx={{
                                width: 500,
                                fontSize: '2rem',
                                input: {fontSize: '2rem'},
                                label: {fontSize: '2rem'},
                            }}
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handlePasswordSubmit}
                            sx={{fontSize: '2rem', px: 6, py: 2}}
                        >
                            Kinnita
                        </Button>
                    </Stack>
                </>
            ) : (
                <>
                    <Box display="flex" justifyContent="center" alignItems="center" mt={2}>
                        <Image
                            src="/white_logo.webp"
                            alt="Logo"
                            width={300}
                            height={255}
                            priority
                            style={{maxWidth: '100%', height: 'auto'}}
                        />
                    </Box>

                    {currentName && (
                        <Box mt={6} ref={winnerRef} position="relative">
                            <Typography variant="h2" fontWeight="bold">
                                {shuffling ? currentName : `🎉🎉 ${currentName} 🎉🎉`}
                            </Typography>
                            <div style={{ position: 'absolute', left: '50%', top: '50%', zIndex: 100 }}>
                                <Confetti
                                    active={confettiActive}
                                    config={{
                                        angle: 90,
                                        spread: 150,
                                        startVelocity: 50,
                                        elementCount: 200,
                                        decay: 0.9,
                                        duration: 4000,
                                        colors: ['#ea9627', '#71e669', '#cacaca'],
                                    }}
                                />
                            </div>
                        </Box>
                    )}


                    <Button
                        variant="contained"
                        color="primary"
                        onClick={startDraw}
                        sx={{mt: 6, fontSize: '2.5rem', px: 8, py: 3}}
                        disabled={shuffling || players.length === 0}
                    >
                        Loosime!
                    </Button>


                </>
            )}
        </Box>
    )
}
