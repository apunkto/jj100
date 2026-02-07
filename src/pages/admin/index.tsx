import {useEffect, useState} from 'react'
import {Box, CircularProgress, Typography} from '@mui/material'
import {useRouter} from 'next/router'
import AdminLayout from '@/src/components/AdminLayout'
import {CompetitionSettings} from '@/src/components/admin/CompetitionSettings'
import {useAuth} from '@/src/contexts/AuthContext'
import useAdminApi, {AdminCompetition} from '@/src/api/useAdminApi'
import {useToast} from '@/src/contexts/ToastContext'

export default function AdminSettingsPage() {
    const {user, loading: authLoading} = useAuth()
    const router = useRouter()
    const {getAdminCompetition, updateCtpEnabled, updateCheckinEnabled, updatePredictionEnabled, updateDidRainEnabled, updateCompetitionStatus} = useAdminApi()
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

    const handleStatusChange = async (status: AdminCompetition['status']) => {
        if (!competition || updating || !user?.activeCompetitionId) return
        if (competition.status === status) return

        try {
            setUpdating(true)
            await updateCompetitionStatus(user.activeCompetitionId, status)
            setCompetition({...competition, status})
            showToast('Võistluse staatus uuendatud', 'success')
        } catch (err) {
            console.error('Failed to update competition status:', err)
            showToast('Staatuse uuendamine ebaõnnestus', 'error')
        } finally {
            setUpdating(false)
        }
    }

    // Show loading while auth is loading or user data is not yet available
    if (authLoading || !user) {
        return (
            <AdminLayout>
                <Box textAlign="center" mt={6}>
                    <CircularProgress />
                    <Typography variant="h6" mt={2}>Laadimine...</Typography>
                </Box>
            </AdminLayout>
        )
    }

    // If user is loaded but not admin, show access denied (will redirect)
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

    // Show message if no active competition
    if (!user.activeCompetitionId) {
        return (
            <AdminLayout>
                <Box px={2} textAlign="center">
                    <Typography variant="h4" fontWeight="bold" mb={2}>
                        Võistluse seaded
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Aktiivset võistlust ei ole valitud. Palun vali võistlus menüüst.
                    </Typography>
                </Box>
            </AdminLayout>
        )
    }

    // Show loading while fetching competition
    if (loading) {
        return (
            <AdminLayout>
                <Box textAlign="center" mt={6}>
                    <CircularProgress />
                    <Typography variant="h6" mt={2}>Võistluse andmete laadimine...</Typography>
                </Box>
            </AdminLayout>
        )
    }

    // Show error if competition not found
    if (!competition) {
        return (
            <AdminLayout>
                <Box px={2} textAlign="center">
                    <Typography variant="h4" fontWeight="bold" mb={2}>
                        Võistluse seaded
                    </Typography>
                    <Typography variant="body1" color="error">
                        Võistlust ei leitud. Palun kontrolli oma aktiivset võistlust.
                    </Typography>
                </Box>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <Box px={2}>
                <CompetitionSettings
                    competition={competition}
                    updating={updating}
                    onStatusChange={handleStatusChange}
                    onCtpToggle={handleCtpToggle}
                    onCheckinToggle={handleCheckinToggle}
                    onPredictionToggle={handlePredictionToggle}
                    onDidRainToggle={handleDidRainToggle}
                />
            </Box>
        </AdminLayout>
    )
}
