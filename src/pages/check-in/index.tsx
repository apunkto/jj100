import React, { useState, useEffect } from 'react'
import LockIcon from '@mui/icons-material/Lock'
import {
    Box,
    Typography,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Autocomplete,
    AutocompleteRenderInputParams,
    CircularProgress,
} from '@mui/material'
import Layout from '@/src/components/Layout'
import usePlayerApi, { Player } from '@/src/api/usePlayerApi'
import { useCheckinApi } from '@/src/api/useCheckinApi'
import { useToast } from '@/src/contexts/ToastContext'
import useConfigApi from '@/src/api/useConfigApi'

export default function CheckInPage() {
    const { getPlayers } = usePlayerApi()
    const { checkIn } = useCheckinApi()
    const { showToast } = useToast()
    const { isCheckinEnabled } = useConfigApi()

    const [players, setPlayers] = useState<Player[]>([])
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [checkedIn, setCheckedIn] = useState(false)

    const [checkinEnabled, setCheckinEnabled] = useState(false)
    const [configLoading, setConfigLoading] = useState(true) // 👈 Add loading state

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [players, enabled] = await Promise.all([
                    getPlayers(),
                    isCheckinEnabled()
                ])
                setPlayers(players)
                setCheckinEnabled(enabled)
            } catch (err) {
                console.error('Failed to fetch players or config', err)
            } finally {
                setConfigLoading(false) // 👈 Only after config is fetched
            }
        }

        fetchData()
    }, [])

    const handleCheckIn = async () => {
        if (!selectedPlayer) return
        try {
            await checkIn(selectedPlayer.id)
            showToast('Registreeritud!', 'success')
            setCheckedIn(true)
        } catch (err: any) {
            if (err.message === 'already_checked_in') {
                showToast('Mängija on juba loosimängu registreeritud!', 'error')
            } else {
                showToast('Registreerimisel tekkis viga!', 'error')
            }
        } finally {
            setConfirmOpen(false)
        }
    }

    const handleSubmit = () => {
        setConfirmOpen(true)
    }

    return (
        <Layout>
            <Box textAlign="center" mt={4}>
                <Typography variant="h4" gutterBottom>
                    Loosimängu registreerimine
                </Typography>

                {configLoading ? (
                    <Box mt={4} display="flex" justifyContent="center">
                        <CircularProgress />
                    </Box>
                ) : !checkinEnabled ? (
                    <Box mt={4} display="flex" alignItems="center" justifyContent={'center'} flexDirection="column">
                        <LockIcon sx={{ fontSize: 50, color: 'grey.500', mb: 2 }} />
                        <Typography variant="body1" color="textSecondary">
                            Registreerumine ei ole veel avatud!
                        </Typography>
                    </Box>
                ) : checkedIn ? (
                    <Box mt={4}>
                        <Typography variant="h5" color="success.main" gutterBottom>
                            ✅ Oled loosimisse registreeritud!
                        </Typography>
                    </Box>
                ) : (
                    <Box mt={4}>
                        <Autocomplete<Player>
                            options={players}
                            getOptionLabel={(option) => option.name}
                            value={selectedPlayer}
                            onChange={(_: React.SyntheticEvent, newValue: Player | null) => setSelectedPlayer(newValue)}
                            renderInput={(params: AutocompleteRenderInputParams) => (
                                <TextField {...params} label="Vali mängija" fullWidth sx={{ mb: 2 }} />
                            )}
                        />

                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit}
                            disabled={!selectedPlayer}
                        >
                            Registreeri
                        </Button>
                    </Box>
                )}
            </Box>

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>Registreeru loosimängu?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Kas oled kindel, et soovid mängija <strong>{selectedPlayer?.name}</strong> loosimängu
                        registreerida? Auhinna kätte saamiseks tuleb loosimise ajal kohal olla!
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>Katkesta</Button>
                    <Button onClick={handleCheckIn} variant="contained" color="primary">
                        Kinnita
                    </Button>
                </DialogActions>
            </Dialog>
        </Layout>
    )
}
