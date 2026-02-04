import {useEffect} from 'react'
import {useRouter} from 'next/router'

export default function DrawPage() {
    const router = useRouter()
    
    useEffect(() => {
        router.replace('/admin/draw')
    }, [router])
    
    return null
    const {getCheckins, drawWinner} = useCheckinApi()
    const {user, loading, refreshMe} = useAuth()
    const {setActiveCompetition} = usePlayerApi()
    const router = useRouter()
    const competitionIdParam = router.query.competitionId

    const [players, setPlayers] = useState<CheckedInPlayer[]>([])
    const [currentName, setCurrentName] = useState('')
    const [winner, setWinner] = useState<CheckedInPlayer | null>(null)
    const [shuffling, setShuffling] = useState(false)
    const [confettiActive, setConfettiActive] = useState(false)

    const winnerRef = useRef<HTMLDivElement>(null)
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

    // Show loading while auth is loading or user data is not yet available
    if (loading || !user) {
        return (
            <Layout>
                <Box textAlign="center" mt={6}>
                    <Typography variant="h4">Laadimine...</Typography>
                </Box>
            </Layout>
        )
    }

    // If user is loaded but not admin, show access denied
    if (!isAdmin) {
        return (
            <Layout>
                <Box textAlign="center" mt={6}>
                    <Typography variant="h4">Puudub juurdepääs</Typography>
                    <Typography variant="body1" mt={2}>
                        Ainult administraatoritel on juurdepääs sellele lehele.
                    </Typography>
                </Box>
            </Layout>
        )
    }

    return (
        <Layout>
            <Box textAlign="center" mt={6} position="relative">
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
        </Box>
        </Layout>
    )
}
