import {useRouter} from 'next/router'
import {useEffect, useState} from 'react'
import {
    Box,
    Typography,
    CircularProgress,
    Button,
    TextField, Autocomplete,
} from '@mui/material'
import Layout from '@/src/components/Layout'
import useCtpApi, {CtpResult} from '@/src/api/useCtpApi'
import usePlayerApi, {Player} from "@/src/api/usePlayerApi";

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

    useEffect(() => {
        if (!hole) return

        getCtp(parseInt(hole as string)).then((result) => {
            setCtp(result)
            setLoading(false)
        })

        getPlayers().then(setPlayers)
    }, [hole])

    const handleSubmit = async () => {
        if (!hole || !selectedPlayer || !distance) return
        try {
            await submitCtp(parseInt(hole as string), selectedPlayer.id, Number(distance))
            const newCtp = await getCtp(parseInt(hole as string))
            setCtp(newCtp)
            setDistance('')
            setSelectedPlayer(null)
        } catch (err) {
            alert('Failed to submit CTP')
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
                        <Typography variant="h6">{ctp.player_name}</Typography>
                        <Typography variant="h5">{ctp.distance_cm} cm</Typography>
                    </>
                ) : (
                    <Typography>No one has submitted a result for this hole yet.</Typography>
                )}

                <Box mt={4}>
                    <Typography variant="h6" gutterBottom>
                        Think you threw closer?
                    </Typography>

                    <Autocomplete
                        options={players.filter((p) => p.id !== ctp?.player_id)}
                        getOptionLabel={(option) => option.name}
                        value={selectedPlayer}
                        disabled={!ctp}
                        onChange={(_, newValue) => setSelectedPlayer(newValue)}
                        renderInput={(params) => (
                            <TextField {...params} label="Select player" fullWidth sx={{ mb: 2 }} />
                        )}
                    />


                    <TextField
                        label="Distance (cm)"
                        type="number"
                        fullWidth
                        value={distance}
                        onChange={(e) => setDistance(e.target.value === '' ? '' : Number(e.target.value))}
                        sx={{mb: 2}}
                    />

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit}
                        disabled={!selectedPlayer || distance === ''}
                    >
                        Submit CTP
                    </Button>
                </Box>
            </Box>
        </Layout>
    )
}
