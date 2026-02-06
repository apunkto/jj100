import {useEffect, useState} from 'react'
import {Box, Button, Card, CardContent, CircularProgress, FormControlLabel, Switch, Typography,} from '@mui/material'
import {useRouter} from 'next/router'
import Layout from '@/src/components/Layout'
import {useAuth} from '@/src/contexts/AuthContext'
import useAdminApi, {AdminCompetition} from '@/src/api/useAdminApi'
import {useToast} from '@/src/contexts/ToastContext'
import CasinoIcon from '@mui/icons-material/Casino'
import SportsGolfIcon from '@mui/icons-material/SportsGolf'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import {decodeHtmlEntities} from '@/src/utils/textUtils'
import {formatDate} from '@/src/utils/dateUtils'

export default function AdminDashboard() {
    const {user, loading: authLoading} = useAuth()
    const router = useRouter()
    const {getAdminCompetition, updateCtpEnabled, updateCheckinEnabled, updatePredictionEnabled, updateDidRainEnabled} = useAdminApi()
    const {showToast} = useToast()

    const [competition, setCompetition] = useState<AdminCompetition | null>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)

    const isAdmin = user?.isAdmin ?? false

    // Fetch competition using activeCompetitionId
    useEffect(() => {
        if (authLoading) return
        if (!isAdmin) return
        const activeCompetitionId = user?.activeCompetitionId ?? null
        if (!activeCompetitionId) {
            setLoading(false)
            return
        }

        const fetchData = async () => {
            try {
                setLoading(true)
                const comp = await getAdminCompetition(activeCompetitionId)
                if (comp) {
                    setCompetition(comp)
                } else {
                    showToast('Võistlust ei leitud', 'error')
                }
            } catch (err) {
                console.error('Failed to fetch competition:', err)
                showToast('Võistluse laadimine ebaõnnestus', 'error')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, isAdmin, user?.activeCompetitionId])

    // Redirect non-admin users
    useEffect(() => {
        if (authLoading) return
        if (!user) return
        if (!isAdmin) {
            router.replace('/')
        }
    }, [authLoading, user, isAdmin, router])

    const handleCtpToggle = async (enabled: boolean) => {
        if (!competition || updating || !user?.activeCompetitionId) return

        try {
            setUpdating(true)
            await updateCtpEnabled(user.activeCompetitionId, enabled)
            setCompetition({...competition, ctp_enabled: enabled})
            showToast(`CTP ${enabled ? 'lubatud' : 'keelatud'}`, 'success')
        } catch (err) {
            console.error('Failed to update CTP setting:', err)
            showToast('CTP seadistuse uuendamine ebaõnnestus', 'error')
        } finally {
            setUpdating(false)
        }
    }

    const handleCheckinToggle = async (enabled: boolean) => {
        if (!competition || updating || !user?.activeCompetitionId) return

        try {
            setUpdating(true)
            await updateCheckinEnabled(user.activeCompetitionId, enabled)
            setCompetition({...competition, checkin_enabled: enabled})
            showToast(`Loosimise registreerimine ${enabled ? 'lubatud' : 'keelatud'}`, 'success')
        } catch (err) {
            console.error('Failed to update checkin setting:', err)
            showToast('Registreerimise seadistuse uuendamine ebaõnnestus', 'error')
        } finally {
            setUpdating(false)
        }
    }

    const handlePredictionToggle = async (enabled: boolean) => {
        if (!competition || updating || !user?.activeCompetitionId) return

        try {
            setUpdating(true)
            await updatePredictionEnabled(user.activeCompetitionId, enabled)
            setCompetition({...competition, prediction_enabled: enabled})
            showToast(`Ennustusmäng ${enabled ? 'lubatud' : 'keelatud'}`, 'success')
        } catch (err) {
            console.error('Failed to update prediction setting:', err)
            showToast('Ennustusmängu seadistuse uuendamine ebaõnnestus', 'error')
        } finally {
            setUpdating(false)
        }
    }

    const handleDidRainToggle = async (enabled: boolean) => {
        if (!competition || updating || !user?.activeCompetitionId) return

        try {
            setUpdating(true)
            await updateDidRainEnabled(user.activeCompetitionId, enabled)
            setCompetition({...competition, did_rain: enabled})
            showToast(`Vihm ${enabled ? 'märgitud' : 'eemaldatud'}`, 'success')
        } catch (err) {
            console.error('Failed to update did rain setting:', err)
            showToast('Vihma seadistuse uuendamine ebaõnnestus', 'error')
        } finally {
            setUpdating(false)
        }
    }

    // Show loading while auth is loading or user data is not yet available
    if (authLoading || !user) {
        return (
            <Layout>
                <Box textAlign="center" mt={6}>
                    <CircularProgress />
                    <Typography variant="h6" mt={2}>Laadimine...</Typography>
                </Box>
            </Layout>
        )
    }

    // If user is loaded but not admin, show access denied (will redirect)
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

    // Show message if no active competition
    if (!user.activeCompetitionId) {
        return (
            <Layout>
                <Box mt={4} px={2} textAlign="center">
                    <Typography variant="h4" fontWeight="bold" mb={2}>
                        Administraatori juhtpaneel
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Aktiivset võistlust ei ole valitud. Palun vali võistlus oma profiilis.
                    </Typography>
                </Box>
            </Layout>
        )
    }

    // Show loading while fetching competition
    if (loading) {
        return (
            <Layout>
                <Box textAlign="center" mt={6}>
                    <CircularProgress />
                    <Typography variant="h6" mt={2}>Võistluse andmete laadimine...</Typography>
                </Box>
            </Layout>
        )
    }

    // Show error if competition not found
    if (!competition) {
        return (
            <Layout>
                <Box mt={4} px={2} textAlign="center">
                    <Typography variant="h4" fontWeight="bold" mb={2}>
                        Administraatori juhtpaneel
                    </Typography>
                    <Typography variant="body1" color="error">
                        Võistlust ei leitud. Palun kontrolli oma aktiivset võistlust.
                    </Typography>
                </Box>
            </Layout>
        )
    }

    // Dashboard View
    return (
        <Layout>
            <Box mt={4} px={2}>
                <Box mb={3} textAlign="center">
                    <Typography variant="h5" fontWeight="bold">
                        {decodeHtmlEntities(competition.name) || `Võistlus #${competition.id}`}
                    </Typography>
                    {competition.competition_date && (
                        <Typography variant="body2" color="text.secondary" mt={1}>
                            {formatDate(competition.competition_date)}
                        </Typography>
                    )}
                </Box>

                <Card sx={{maxWidth: 800, mx: 'auto', mb: 3}}>
                    <CardContent>
                        <Typography variant="h6" fontWeight="bold" mb={3}>
                            Võistluse seaded
                        </Typography>

                        <Box display="flex" flexDirection="column" gap={3}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={competition.ctp_enabled}
                                        onChange={(e) => handleCtpToggle(e.target.checked)}
                                        disabled={updating}
                                    />
                                }
                                label="CTP lubatud"
                            />

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={competition.checkin_enabled}
                                        onChange={(e) => handleCheckinToggle(e.target.checked)}
                                        disabled={updating}
                                    />
                                }
                                label="Luba loosimängud"
                            />

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={competition.prediction_enabled}
                                        onChange={(e) => handlePredictionToggle(e.target.checked)}
                                        disabled={updating}
                                    />
                                }
                                label="Luba ennustusmäng"
                            />

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={competition.did_rain}
                                        onChange={(e) => handleDidRainToggle(e.target.checked)}
                                        disabled={updating}
                                    />
                                }
                                label="Sadas vihma"
                            />
                        </Box>
                    </CardContent>
                </Card>

                <Box display="flex" flexDirection="column" gap={2} maxWidth={800} mx="auto">
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<CasinoIcon />}
                        onClick={() => router.push('/admin/draw')}
                        sx={{py: 1.5}}
                    >
                        Loosiauhindade loosimine
                    </Button>

                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<SportsGolfIcon />}
                        onClick={() => router.push('/admin/final-game')}
                        sx={{py: 1.5}}
                    >
                        Putimäng
                    </Button>

                    <Button
                        variant="contained"
                        color="secondary"
                        size="large"
                        startIcon={<EmojiEventsIcon />}
                        onClick={() => router.push('/admin/results')}
                        sx={{py: 1.5}}
                    >
                        Tulemused
                    </Button>
                </Box>
            </Box>
        </Layout>
    )
}
