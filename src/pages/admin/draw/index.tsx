import {useEffect, useState} from 'react'
import {Box, Button, Paper, Typography} from '@mui/material'
import {CheckedInPlayer, useCheckinApi} from '@/src/api/useCheckinApi'
import {useAuth} from '@/src/contexts/AuthContext'
import {useRouter} from 'next/router'
import usePlayerApi from '@/src/api/usePlayerApi'
import AdminLayout from '@/src/components/AdminLayout'

export default function DrawPage() {
    const {getCheckins, drawWinner, resetDraw} = useCheckinApi()
    const {user, loading, refreshMe} = useAuth()
    const {setActiveCompetition} = usePlayerApi()
    const router = useRouter()
    const competitionIdParam = router.query.competitionId

    const [players, setPlayers] = useState<CheckedInPlayer[]>([])
    const [currentName, setCurrentName] = useState('')
    const [winner, setWinner] = useState<CheckedInPlayer | null>(null)

    const isAdmin = user?.isAdmin ?? false

    const fetchPlayers = async () => {
        try {
            const allCheckins = await getCheckins()
            setPlayers(allCheckins.filter(p => !p.prize_won))
        } catch (err) {
            console.error('Failed to fetch check-ins:', err)
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
        if (players.length === 0) return

        setWinner(null)
        setCurrentName('')

        let drawnWinner: CheckedInPlayer
        try {
            drawnWinner = await drawWinner()
        } catch (e) {
            console.error('Failed to draw winner:', e)
            return
        }

        setWinner(drawnWinner)
        setCurrentName(drawnWinner.player.name)
        fetchPlayers()
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
            <Box sx={{ maxWidth: 400, mx: 'auto', px: 2, py: 3 }}>
                <Typography variant="h4" fontWeight="bold" mb={2}>
                    Loosiauhinnad
                </Typography>

                <Paper variant="outlined" sx={{ p: 2, mb: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        Loosis osalejaid
                    </Typography>
                    <Typography variant="h4" fontWeight="700">
                        {players.length}
                    </Typography>
                </Paper>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={startDraw}
                        disabled={players.length === 0}
                        fullWidth
                    >
                        Loosime
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={async () => {
                            try {
                                await resetDraw()
                                setWinner(null)
                                setCurrentName('')
                                await fetchPlayers()
                            } catch (e) {
                                console.error('Reset failed:', e)
                            }
                        }}
                        fullWidth
                    >
                        Lähtesta loos
                    </Button>
                </Box>

                {currentName && (
                    <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                        <Typography variant="body2" color="text.secondary">
                            Viimane võitja
                        </Typography>
                        <Typography variant="body1" fontWeight="600">
                            {currentName}
                        </Typography>
                    </Box>
                )}
            </Box>
        </AdminLayout>
    )
}
