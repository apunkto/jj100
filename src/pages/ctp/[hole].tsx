import {useRouter} from 'next/router'
import React, {useEffect, useState} from 'react'
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
import useCtpApi, {HoleResult} from '@/src/api/useCtpApi'
import usePlayerApi, {Player} from '@/src/api/usePlayerApi'
import {useToast} from '@/src/contexts/ToastContext'
import useConfigApi from "@/src/api/useConfigApi";

export default function CtpHolePage() {
    const router = useRouter()
    const {hole} = router.query
    const {getHole, submitCtp} = useCtpApi()
    const {isCtpEnabled} = useConfigApi()

    const {getPlayers} = usePlayerApi()
    const {showToast} = useToast()

    const [holeData, setHoleData] = useState<HoleResult | null>(null)
    const [loading, setLoading] = useState(true)
    const [players, setPlayers] = useState<Player[]>([])
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
    const [distance, setDistance] = useState<number | ''>('')
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [ctpEnabled, setCtpEnabled] = useState(true) // 👈 new

    const isValidDistance = distance !== '' && Number(distance) > 0
    const isBetterThrow = !holeData?.ctp || (isValidDistance && Number(distance) < holeData.ctp.distance_cm)
    const showError = Boolean(holeData?.ctp && isValidDistance && Number(distance) >= holeData.ctp.distance_cm)

    const noCtpGame = holeData?.hole && !holeData.hole.is_ctp

    useEffect(() => {
        if (!router.isReady || !hole) return

        const fetchData = async () => {
            try {
                const result = await getHole(parseInt(hole as string))
                setHoleData(result)
                const enabled = await isCtpEnabled()
                setCtpEnabled(enabled) // 👈 store config
            } catch (err) {
                console.error('Failed to fetch hole or config:', err)
                setHoleData(null)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
        getPlayers().then(setPlayers)
    }, [router.isReady, hole])

    const handleSubmit = () => {
        setConfirmOpen(true)
    }

    const handleConfirmSubmit = async () => {
        if (!holeData?.hole || !selectedPlayer || !isValidDistance || !isBetterThrow) return
        try {
            await submitCtp(holeData.hole.id, selectedPlayer.id, Number(distance))
            const newHole = await getHole(holeData.hole.number)
            setHoleData(newHole)
            setDistance('')
            setSelectedPlayer(null)
            showToast('CTP tulemus sisestatud!', 'success')
        } catch (err) {
            showToast('CTP sisestamine ebaõnnestus!', 'error')
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
                        <Typography variant="h5" sx={{color: 'white', fontWeight: 'bold', fontSize: '30px'}}>
                            {hole}
                        </Typography>
                    </Box>
                </Box>

                {loading ? (
                    <CircularProgress/>
                ) : !holeData?.hole ? (
                    <Typography>Korvi {hole} ei leitud</Typography>
                ) : noCtpGame ? (
                    <Typography variant="h5" gutterBottom>
                        Korvil {hole} ei toimu CTP mängu
                    </Typography>
                ) : (
                    <>
                        <Typography variant="h5" gutterBottom>
                            CTP tulemus
                        </Typography>

                        {holeData.ctp ? (
                            <>
                                <Typography variant="h6" sx={{fontWeight: 'bold'}}>
                                    {holeData.ctp?.player?.name}
                                </Typography>
                                <Typography variant="h5">{holeData.ctp.distance_cm} cm</Typography>
                            </>
                        ) : (
                            <Typography>CTP tulemust pole veel sisestatud</Typography>
                        )}

                        {/* 👇 Only show the form if CTP is enabled */}
                        {ctpEnabled ? (
                            <Box mt={4}>
                                <Typography variant="h6" gutterBottom>
                                    Kas viskasid lähemale?
                                </Typography>

                                <Autocomplete<Player>
                                    options={players.filter((p) => p.id !== holeData?.ctp?.player_id)}
                                    getOptionLabel={(option) => option.name}
                                    value={selectedPlayer}
                                    onChange={(_: React.SyntheticEvent, newValue: Player | null) =>
                                        setSelectedPlayer(newValue)
                                    }
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
                                                    ? `CTP peab olema väiksem kui ${holeData?.ctp?.distance_cm ?? '...'} cm`
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
                        ) : (
                            <Box mt={4}>
                                <Typography variant="body1" color="textSecondary">
                                    CTP tulemuste sisestamine ei ole veel avatud!
                                </Typography>
                            </Box>
                        )}
                    </>
                )}
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
