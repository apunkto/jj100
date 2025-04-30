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
import useConfigApi from "@/src/api/useConfigApi"
import LockIcon from "@mui/icons-material/Lock"
import {formatEstonianDateTime} from "@/src/components/Util";

export async function getStaticPaths() {
    const paths = Array.from({length: 100}, (_, i) => ({
        params: {hole: (i + 1).toString()}
    }));

    return {
        paths,
        fallback: false
    };
}

export async function getStaticProps({params}: { params: { hole: string } }) {
    return {
        props: {
            hole: params.hole
        }
    };
}


export default function CtpHolePage({hole}: { hole: string }) {
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
    const [ctpEnabled, setCtpEnabled] = useState(true)

    const bestThrow = holeData?.ctp?.[0] ?? null
    const isValidDistance = distance !== '' && Number(distance) > 0
    const isBetterThrow = !bestThrow || (isValidDistance && Number(distance) < bestThrow.distance_cm)
    const showError = Boolean(bestThrow && isValidDistance && Number(distance) >= bestThrow.distance_cm)

    const noCtpGame = holeData?.hole && !holeData.hole.is_ctp

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await getHole(parseInt(hole as string))
                setHoleData(result)
                const enabled = await isCtpEnabled()
                setCtpEnabled(enabled)
            } catch (err) {
                console.error('Failed to fetch hole or config:', err)
                setHoleData(null)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
        getPlayers().then(setPlayers)
    }, [hole])

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
            <Box textAlign="center" mt={2}>
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

                        {bestThrow ? (
                            <>
                                <Typography variant="h6" sx={{fontWeight: 'bold'}}>
                                    {bestThrow.player.name}
                                </Typography>
                                <Typography variant="h5">{bestThrow.distance_cm} cm</Typography>
                            </>
                        ) : (
                            <Typography>CTP tulemust pole veel sisestatud</Typography>
                        )}

                        {ctpEnabled ? (
                            <Box mt={4}>
                                <Typography variant="h6" gutterBottom>
                                    Kas viskasid lähemale?
                                </Typography>

                                <Autocomplete<Player>
                                    options={players.filter(
                                        (p) => !holeData.ctp.some((ctp) => ctp.player_id === p.id)
                                    )}
                                    getOptionLabel={(option) => option.name}
                                    value={selectedPlayer}
                                    onChange={(_: React.SyntheticEvent, newValue: Player | null) =>
                                        setSelectedPlayer(newValue)
                                    }
                                    renderInput={(params: AutocompleteRenderInputParams) => (
                                        <TextField {...params} label="Mängija nimi" fullWidth sx={{mb: 2}}/>
                                    )}
                                />

                                <TextField
                                    label="Kaugus korvist (cm)"
                                    type="number"
                                    fullWidth
                                    value={distance}
                                    onChange={(e) =>
                                        setDistance(e.target.value === '' ? '' : Number(e.target.value))
                                    }
                                    sx={{mb: 2}}
                                    error={distance !== '' && (!isValidDistance || showError)}
                                    helperText={
                                        distance !== ''
                                            ? !isValidDistance
                                                ? 'CTP peab olema suurem kui 0 cm'
                                                : showError
                                                    ? `CTP peab olema väiksem kui ${bestThrow?.distance_cm ?? '...'} cm`
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

                                {holeData.ctp.length > 0 && (
                                    <Box mt={4} textAlign="left">
                                        <Typography variant="h6" gutterBottom>
                                            CTP Ajalugu
                                        </Typography>

                                        {holeData.ctp.map((entry, idx) => (
                                            <Box
                                                key={entry.id}
                                                display="flex"
                                                justifyContent="space-between"
                                                alignItems="center"
                                                py={1}
                                                borderBottom={1}
                                                borderColor="grey.300"
                                            >
                                                <Typography sx={{ flexBasis: '60%' }}>
                                                    {idx + 1}. {entry.player.name}
                                                </Typography>
                                                <Typography sx={{ flexBasis: '20%', textAlign: 'center' }}>
                                                    {formatEstonianDateTime(entry.created_date)}
                                                </Typography>
                                                <Typography sx={{ flexBasis: '20%', textAlign: 'right' }}>
                                                    {entry.distance_cm} cm
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                )}

                            </Box>
                        ) : (
                            <Box mt={4} display="flex" alignItems="center" justifyContent={'center'}>
                                <LockIcon sx={{fontSize: 25, color: 'grey.500'}}/>
                                <Typography variant="body1" color="textSecondary" sx={{ml: 1}}>
                                    CTP sisestamine ei ole veel avatud!
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
