import {useRouter} from 'next/router'
import React, {useEffect, useState} from 'react'
import {
    Box,
    Typography,
    CircularProgress,
    Button,
    TextField,
    Snackbar,
    Alert, AutocompleteRenderInputParams, Autocomplete,
} from '@mui/material'
import Layout from '@/src/components/Layout'
import useCtpApi, {CtpResult} from '@/src/api/useCtpApi'
import usePlayerApi, {Player} from '@/src/api/usePlayerApi'

export default function CtpHolePage() {
    const router = useRouter()
    const {hole} = router.query
    const {getCtp, submitCtp} = useCtpApi()
    const {getPlayers} = usePlayerApi()

    const [ctp, setCtp] = useState<CtpResult | null>(null)
    const [loading, setLoading] = useState(true)
    const [players, setPlayers] = useState<Player[]>([])

    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
    const [distance, setDistance] = useState<number | ''>('')

    const [toast, setToast] = useState<{
        open: boolean
        message: string
        severity: 'success' | 'error'
    }>({
        open: false,
        message: '',
        severity: 'success',
    })

    const isBetterThrow =
        !ctp || (distance !== '' && Number(distance) < ctp.distance_cm)

    useEffect(() => {
        if (!hole) return

        getCtp(parseInt(hole as string)).then((result) => {
            setCtp(result)
            setLoading(false)
        })

        getPlayers().then(setPlayers)
    }, [hole])

    const handleSubmit = async () => {
        if (!hole || !selectedPlayer || distance === '' || !isBetterThrow) return
        try {
            await submitCtp(
                parseInt(hole as string),
                selectedPlayer.id,
                Number(distance)
            )
            const newCtp = await getCtp(parseInt(hole as string))
            setCtp(newCtp)
            setDistance('')
            setSelectedPlayer(null)

            setToast({
                open: true,
                message: 'CTP submitted successfully!',
                severity: 'success',
            })
        } catch (err) {
            setToast({
                open: true,
                message: 'Failed to submit CTP',
                severity: 'error',
            })
        }
    }

    return (
        <Layout>
            <Box textAlign="center" mt={4}>
                <Typography variant="h4" gutterBottom>
                    CTP #{hole}
                </Typography>

                {loading ? (
                    <CircularProgress/>
                ) : ctp?.player_name ? (
                    <>
                        <Typography variant="h6" sx={{fontWeight: 'bold'}}>
                            {ctp.player_name}
                        </Typography>
                        <Typography variant="h5">{ctp.distance_cm} cm</Typography>
                    </>
                ) : (
                    <Typography>
                        No one has submitted a result for this hole yet.
                    </Typography>
                )}

                <Box mt={4}>
                    <Typography variant="h6" gutterBottom>
                        Think you threw closer?
                    </Typography>

                    <Autocomplete<Player>
                        options={players.filter((p) => p.id !== ctp?.player_id)}
                        getOptionLabel={(option: Player) => option.name}
                        value={selectedPlayer}
                        disabled={!ctp}
                        onChange={(_: React.SyntheticEvent, newValue: Player | null) =>
                            setSelectedPlayer(newValue)
                        }
                        renderInput={(params: AutocompleteRenderInputParams) => (
                            <TextField {...params} label="Select player" fullWidth sx={{ mb: 2 }} />
                        )}

                    />

                    <TextField
                        label="Distance (cm)"
                        type="number"
                        fullWidth
                        value={distance}
                        onChange={(e) =>
                            setDistance(
                                e.target.value === '' ? '' : Number(e.target.value)
                            )
                        }
                        sx={{mb: 2}}
                        error={distance !== '' && !isBetterThrow}
                        helperText={
                            distance !== '' && !isBetterThrow
                                ? `Must be less than ${ctp?.distance_cm ?? '...'} cm`
                                : ''
                        }
                    />

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit}
                        disabled={!selectedPlayer || distance === '' || !isBetterThrow}
                    >
                        Submit CTP
                    </Button>
                </Box>
            </Box>

            <Snackbar
                open={toast.open}
                autoHideDuration={3000}
                onClose={() => setToast({...toast, open: false})}
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
            >
                <Alert
                    severity={toast.severity}
                    onClose={() => setToast({...toast, open: false})}
                >
                    {toast.message}
                </Alert>
            </Snackbar>
        </Layout>
    )
}
