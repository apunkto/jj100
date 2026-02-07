import {useEffect, useRef, useState} from 'react'
import {Box, Button, Stack, Typography} from '@mui/material'
import Confetti from 'react-dom-confetti'
import {CheckedInPlayer, useCheckinApi} from '@/src/api/useCheckinApi'
import Image from "next/image"
import {useAuth} from '@/src/contexts/AuthContext'
import {useRouter} from 'next/router'
import usePlayerApi from '@/src/api/usePlayerApi'
import AdminLayout from '@/src/components/AdminLayout'

export default function FinalGameDrawPage() {
    const { getCheckins, drawWinner, deleteCheckin, confirmFinalGameCheckin } = useCheckinApi()
    const {user, loading, refreshMe} = useAuth()
    const {setActiveCompetition} = usePlayerApi()
    const router = useRouter()
    const competitionIdParam = router.query.competitionId

    const [players, setPlayers] = useState<CheckedInPlayer[]>([])
    const [currentName, setCurrentName] = useState('')
    const [winner, setWinner] = useState<any>(null)
    const [shuffling, setShuffling] = useState(false)
    const [confettiActive, setConfettiActive] = useState(false)

    const winnerRef = useRef<HTMLDivElement>(null)
    const isAdmin = user?.isAdmin ?? false

    const fetchPlayers = async () => {
        try {
            const allCheckins = await getCheckins()
            setPlayers(allCheckins)
            return allCheckins // ✅ return updated data
        } catch (err) {
            console.error('Failed to fetch check-ins:', err)
            return []
        }
    }

    useEffect(() => {
        // Wait for auth to finish loading
        if (loading) return
        
        // Wait for user data to be loaded (user might be null initially even after loading is false)
        if (!user) return
        
        // If user is loaded but not admin, redirect
        if (!isAdmin) {
            router.replace('/')
            return
        }

        // If competitionId query param is provided, set it as active competition (optional override)
        if (competitionIdParam && typeof competitionIdParam === 'string') {
            const compId = parseInt(competitionIdParam, 10)
            if (!isNaN(compId) && user.activeCompetitionId !== compId) {
                setActiveCompetition(compId).then(() => {
                    refreshMe().then(() => {
                        fetchPlayers()
                    })
                }).catch((err) => {
                    console.error('Failed to set active competition:', err)
                    fetchPlayers()
                })
                return
            }
        }

        // Check if user has active competition
        if (!user.activeCompetitionId) {
            return
        }
        
        // User is admin, fetch players
        fetchPlayers()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, user, isAdmin, router, competitionIdParam])

    const startDraw = async () => {
        if (!isAdmin) return
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
        if (!isAdmin || !winner) return
        try {
            await confirmFinalGameCheckin(winner.id)
            const updatedPlayers = await fetchPlayers() // ✅ wait for updated list
            setWinner(null)
            setCurrentName('')

            // ✅ Check final game players from the updated list directly
            const newFinalists = updatedPlayers.filter(p => p.final_game)
            if (newFinalists.length < 10) {
                startDraw()
            }
        } catch (e) {
            console.error('Failed to confirm player for final game:', e)
        }
    }

    const handleNotPresent = async () => {
        if (!isAdmin || !winner) return
        try {
            await deleteCheckin(winner.id)
            await fetchPlayers()
            setWinner(null)
            setCurrentName('')
            startDraw()
        } catch (e) {
            console.error('Failed to delete player:', e)
        }
    }

    // Show loading while auth is loading or user data is not yet available
    if (loading || !user) {
        return (
            <AdminLayout>
                <Box textAlign="center" mt={6}>
                    <Typography variant="h4">Laadimine...</Typography>
                </Box>
            </AdminLayout>
        )
    }

    // If user is loaded but not admin, show access denied
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
            <Box textAlign="center" mt={4} position="relative">
            <Box display="flex" justifyContent="center" alignItems="center" mt={0}>
                        <Image
                            src="/novatours.jpg"
                            alt="Logo"
                            width={586}
                            height={200}
                            priority
                            style={{ maxWidth: '100%', height: 'auto' }}
                        />
                    </Box>

                    {currentName && (
                        <Box mt={6} ref={winnerRef} position="relative">
                            <Typography variant="h2" fontWeight="bold">
                                {currentName}
                            </Typography>

                            <div style={{ position: 'absolute', left: '50%', top: '50%', zIndex: 100 }}>
                                <Confetti
                                    active={confettiActive}
                                    config={{
                                        angle: 90,
                                        spread: 180,
                                        startVelocity: 70,
                                        elementCount: 300,
                                        decay: 0.9,
                                        duration: 5000,
                                        colors: ['#ea9627', '#71e669', '#cacaca'],
                                    }}
                                />
                            </div>

                            {!shuffling && winner && (
                                <Stack direction="row" spacing={6} justifyContent="center" mt={3}>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        onClick={handleConfirmPresent}
                                        sx={{ fontSize: '2rem', px: 6, py: 2 }}
                                    >
                                        Kohal
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        onClick={handleNotPresent}
                                        sx={{ fontSize: '2rem', px: 6, py: 2 }}
                                    >
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
                            sx={{ mt: 4, fontSize: '2rem', px: 6, py: 2 }}
                            disabled={availablePlayers().length === 0 || finalGamePlayers().length >= 10}
                        >
                            {finalGamePlayers().length >= 10 ? '10 mängijat valitud' : 'Loosi osaleja!'}
                        </Button>
                    )}

                    {finalGamePlayers().length > 0 && (
                        <Box mt={5}>

                            <Typography variant="h3" fontWeight="bold" gutterBottom>
                                🎯 Putimängus osalevad:
                            </Typography>

                            <Box display="flex" justifyContent="center" gap={12} mt={4}>
                                {/* Left Column: Players 1-5 */}
                                <Box display="flex" flexDirection="column" gap={2} minWidth="300px" alignItems="flex-end">
                                    {sortedFinalGamePlayers()
                                        .slice(0, 5)
                                        .map((p, index) => (
                                            <Typography key={p.id} fontSize="2.5rem" fontWeight={600}>
                                                {index + 1}. {p.player.name}
                                            </Typography>
                                        ))}
                                </Box>

                                {/* Right Column: Players 6-10 */}
                                <Box display="flex" flexDirection="column" gap={2} minWidth="300px" alignItems="flex-start">
                                    {sortedFinalGamePlayers()
                                        .slice(5, 10)
                                        .map((p, index) => (
                                            <Typography key={p.id} fontSize="2.5rem" fontWeight={600}>
                                                {index + 6}. {p.player.name}
                                            </Typography>
                                        ))}
                                </Box>
                            </Box>
                        </Box>
                    )}

        </Box>
        </AdminLayout>
    )
}
