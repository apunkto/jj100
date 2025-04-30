import React, {useEffect, useState} from 'react'
import {
    Autocomplete,
    TextField,
    Typography,
    Box,
    Container,
    CircularProgress,
    Alert,
    Paper,
    Divider,
} from '@mui/material'
import Layout from '@/src/components/Layout'

type PlayerResult = {
    UserID: number
    Name: string
    OrderNumber: number
    Diff: string
    ClassName: string
    Sum: number
    Dnf?: boolean | null
}

type MetrixAPIResponse = {
    Competition: {
        Results: PlayerResult[]
    }
}

export default function CtpStatsPage() {
    const [results, setResults] = useState<PlayerResult[]>([])
    const [selectedPlayer, setSelectedPlayer] = useState<PlayerResult | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const res = await fetch(
                    'https://discgolfmetrix.com/api.php?content=result&id=2834664'
                )
                const data = (await res.json()) as MetrixAPIResponse
                setResults(data.Competition.Results)
            } catch (err) {
                console.error('Failed to fetch Metrix results:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchResults()
    }, [])

    const getDelta = () => {
        if (!selectedPlayer) return null
        const sameClassPlayers = results.filter(
            (p) => p.ClassName === selectedPlayer.ClassName
        )
        const leader = sameClassPlayers.reduce((min, p) =>
            p.Sum < min.Sum ? p : min
        )
        return selectedPlayer.Sum - leader.Sum
    }

    const getOverallPlace = () => {
        if (!selectedPlayer) return null
        const validPlayers = results.filter((p) => p.Dnf !== true)

        const sorted = [...validPlayers].sort((a, b) => a.Sum - b.Sum)
        console.log(validPlayers, selectedPlayer.UserID, sorted)
        const index = sorted.findIndex(p => p.UserID === selectedPlayer.UserID)
        return index >= 0 ? index + 1 : null
    }

    return (
        <Layout>
            <Box textAlign="center" mt={2}>
                <Typography variant="h4" gutterBottom>
                    Mängija statistika
                </Typography>

                {loading ? (
                    <Box mt={4} display="flex" justifyContent="center">
                        <CircularProgress/>
                    </Box>
                ) : (
                    <Box mt={4}>

                        <Autocomplete<PlayerResult>
                            options={results}
                            getOptionLabel={(option) => option.Name}
                            value={selectedPlayer}
                            onChange={(_: React.SyntheticEvent, newValue: PlayerResult | null) =>
                                setSelectedPlayer(newValue)
                            }
                            renderInput={(params) => (
                                <TextField {...params} label="Mängija nimi" fullWidth sx={{mb: 2}}/>
                            )}
                        />

                        {selectedPlayer && (
                            <Paper elevation={3} sx={{mt: 4, p: 3, textAlign: 'left'}}>
                                <Box display={'flex'} justifyContent="space-between" fontWeight={600} >
                                    <Typography variant="h6" gutterBottom >
                                        {selectedPlayer.Name}
                                    </Typography>
                                    <Typography variant="h6" gutterBottom fontWeight={700}>
                                        {selectedPlayer.Diff}
                                    </Typography>
                                </Box>
                                <Divider sx={{mb: 2}}/>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography fontWeight="bold">Klass:</Typography>
                                    <Typography>{selectedPlayer.ClassName}</Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography fontWeight="bold">Koht:</Typography>
                                    <Typography>{selectedPlayer.OrderNumber}</Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography fontWeight="bold">Liidrist maas:</Typography>
                                    <Typography>{getDelta()} viset</Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between">
                                    <Typography fontWeight="bold">Üldjärjestus:</Typography>
                                    <Typography>{getOverallPlace()}. koht</Typography>
                                </Box>
                            </Paper>
                        )}
                    </Box>
                )}
            </Box>
        </Layout>
    )
}
