import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import {
    Box,
    Typography,
    CircularProgress,
    Button,
    TextField,
    Autocomplete,
    AutocompleteRenderInputParams,
    Dialog,
} from '@mui/material'
import Layout from '@/src/components/Layout'
import useCtpApi, { CtpResult } from '@/src/api/useCtpApi'
import usePlayerApi, { Player } from '@/src/api/usePlayerApi'
import { useToast } from '@/src/contexts/ToastContext' // 👈 import toast context

export default function CtpHolePage() {
    const router = useRouter()
    const { hole } = router.query
    const { getCtp, submitCtp } = useCtpApi()
    const { getPlayers } = usePlayerApi()
    const { showToast } = useToast()  // 👈 useToast hook here

    const [ctp, setCtp] = useState<CtpResult | null>(null)
    const [loading, setLoading] = useState(true)
    const [players, setPlayers] = useState<Player[]>([])
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
    const [distance, setDistance] = useState<number | ''>('')
    const [confirmOpen, setConfirmOpen] = useState(false)

    const isValidDistance = distance !== '' && Number(distance) > 0
    const isBetterThrow = !ctp || (isValidDistance && Number(distance) < ctp.distance_cm)
    const showError = Boolean(ctp && isValidDistance && Number(distance) >= ctp.distance_cm)

    useEffect(() => {
        if (!router.isReady || !hole) return

        getCtp(parseInt(hole as string)).then((result) => {
            setCtp(result)
            setLoading(false)
        })

        getPlayers().then(setPlayers)
    }, [router.isReady, hole])

    const handleSubmit = () => {
        setConfirmOpen(true)
    }

    const handleConfirmSubmit = async () => {
        if (!hole || !selectedPlayer || !isValidDistance || !isBetterThrow) return
        try {
            await submitCtp(parseInt(hole as string), selectedPlayer.id, Number(distance))
            const newCtp = await getCtp(parseInt(hole as string))
            setCtp(newCtp)
            setDistance('')
            setSelectedPlayer(null)

            showToast('CTP tulemus sisestatud!', 'success')  // ✅ use global toast
        } catch (err) {
            showToast('CTP sisestamine ebaõnnestus!', 'error')  // ✅ use global toast
        } finally {
            setConfirmOpen(false)
        }
    }

    return (
        <Layout>
            <Box textAlign="center" mt={4}>
                <Box display="flex" justifyContent="center" alignItems="center" mb={2}>
                    <Box
                        sx={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            backgroundColor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', fontSize: '30px' }}>
                            {hole}
                        </Typography>
                    </Box>
                </Box>
                <Typography variant="h5" gutterBottom>
                    CTP tulemus
                </Typography>

                {loading ? (
                    <CircularProgress />
                ) : ctp?.player_name ? (
                    <>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {ctp.player_name}
                        </Typography>
                        <Typography variant="h5">{ctp.distance_cm} cm</Typography>
                    </>
                ) : (
                    <Typography>CTP tulemust pole veel sisestatud</Typography>
                )}

                <Box mt={4}>
                    <Typography variant="h6" gutterBottom>
                        Kas viskasid lähemale?
                    </Typography>

                    <Autocomplete<Player>
                        options={players.filter((p) => p.id !== ctp?.player_id)}
                        getOptionLabel={(option) => option.name}
                        value={selectedPlayer}
                        onChange={(_: React.SyntheticEvent, newValue: Player | null) => setSelectedPlayer(newValue)}
                        renderInput={(params: AutocompleteRenderInputParams) => (
                            <TextField {...params} label="Otsi mängijat" fullWidth sx={{ mb: 2 }} />
                        )}
                    />

                    <TextField
                        label="Kaugus korvist (cm)"
                        type="number"
                        fullWidth
                        value={distance}
                        onChange={(e) => setDistance(e.target.value === '' ? '' : Number(e.target.value))}
                        sx={{ mb: 2 }}
                        error={distance !== '' && (!isValidDistance || showError)}
                        helperText={
                            distance !== ''
                                ? !isValidDistance
                                    ? 'CTP peab olema suurem kui 0 cm'
                                    : showError
                                        ? `CTP peab olema väiksem kui ${ctp?.distance_cm ?? '...'} cm`
                                        : ''
                                : ''
                        }
                    />

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit}
                        disabled={!selectedPlayer || !isValidDistance || showError}
                    >
                        Kinnita
                    </Button>
                </Box>
            </Box>

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <Box p={3}>
                    <Typography variant="h6" gutterBottom>
                        Kinnita CTP tulemus
                    </Typography>
                    <Typography>
                        Kas kinnitad, et <strong>{selectedPlayer?.name}</strong> tulemus on{' '}
                        <strong>{distance} cm</strong>?
                    </Typography>
                    <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
                        <Button onClick={() => setConfirmOpen(false)}>Katkesta</Button>
                        <Button onClick={handleConfirmSubmit} variant="contained" color="primary">
                            Kinnitan
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        </Layout>
    )
}
