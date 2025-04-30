import React, {useEffect, useState} from 'react';
import {
    Autocomplete,
    TextField,
    Typography,
    Box,
    CircularProgress,
    Paper,
    Divider,
} from '@mui/material';
import Layout from '@/src/components/Layout';

type HoleResult = {
    Diff: number;
};

type PlayerResult = {
    UserID: number;
    Name: string;
    OrderNumber: number;
    Diff: string;
    ClassName: string;
    Sum: number;
    Dnf?: boolean | null;
    PlayerResults?: HoleResult[];
};

type MetrixAPIResponse = {
    Competition: {
        Results: PlayerResult[];
    };
};

export default function CtpStatsPage() {
    const [results, setResults] = useState<PlayerResult[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<PlayerResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const res = await fetch(
                    'https://discgolfmetrix.com/api.php?content=result&id=2834664'
                );
                const data = (await res.json()) as MetrixAPIResponse;
                setResults(data.Competition.Results);
            } catch (err) {
                console.error('Failed to fetch Metrix results:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, []);

    const getDelta = () => {
        if (!selectedPlayer) return null;
        const sameClassPlayers = results.filter(
            (p) => p.ClassName === selectedPlayer.ClassName
        );
        const leader = sameClassPlayers.reduce((min, p) =>
            p.Sum < min.Sum ? p : min
        );
        return selectedPlayer.Sum - leader.Sum;
    };

    const getOverallPlace = () => {
        if (!selectedPlayer) return null;
        const validPlayers = results.filter((p) => p.Dnf !== true);
        const sorted = [...validPlayers].sort((a, b) => a.Sum - b.Sum);
        const index = sorted.findIndex((p) => p.UserID === selectedPlayer.UserID);
        return index >= 0 ? index + 1 : null;
    };

    const getScoreBreakdown = () => {
        if (!selectedPlayer?.PlayerResults) return null;
        let eagles = 0,
            birdies = 0,
            pars = 0,
            bogeys = 0,
            doubleBogeys = 0,
            tripleOrWorse = 0;

        for (const hole of selectedPlayer.PlayerResults) {
            const diff = hole.Diff;
            if (diff <= -2) eagles++;
            else if (diff === -1) birdies++;
            else if (diff === 0) pars++;
            else if (diff === 1) bogeys++;
            else if (diff === 2) doubleBogeys++;
            else if (diff >= 3) tripleOrWorse++;
        }

        return {eagles, birdies, pars, bogeys, doubleBogeys, tripleOrWorse};
    };

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
                            onChange={(_, newValue) => setSelectedPlayer(newValue)}
                            renderInput={(params) => (
                                <TextField {...params} label="Mängija nimi" fullWidth sx={{mb: 2}}/>
                            )}
                        />

                        {selectedPlayer && (
                            <Paper elevation={3} sx={{mt: 4, p: 3, textAlign: 'left'}}>
                                <Box display="flex" justifyContent="space-between" >
                                    <Typography variant="h6" gutterBottom>
                                        {selectedPlayer.Name}
                                    </Typography>
                                    <Typography  variant="h6" fontWeight={700}>{selectedPlayer.Diff}</Typography>
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
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography fontWeight="bold">Üldjärjestus:</Typography>
                                    <Typography>{getOverallPlace()}. koht</Typography>
                                </Box>

                                <Divider sx={{my: 2}}/>
                                {(() => {
                                    const breakdown = getScoreBreakdown();
                                    if (!breakdown) return null;

                                    const scoreBoxes = [
                                        {label: 'Eagle', value: breakdown.eagles, color: '#f8c600'},
                                        {label: 'Birdie', value: breakdown.birdies, color: '#7bc87f'},
                                        {label: 'Par', value: breakdown.pars, color: '#ffffff'},
                                        {label: 'Bogey', value: breakdown.bogeys, color: '#ffc6c6'},
                                        {label: 'Double', value: breakdown.doubleBogeys, color: '#f86969'},
                                        {label: 'Triple+', value: breakdown.tripleOrWorse, color: '#ff2121'},
                                    ];

                                    return (
                                        <>
                                            <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                                                {scoreBoxes.map((item) => (
                                                    <Box
                                                        key={item.label}
                                                        sx={{
                                                            backgroundColor: item.color,
                                                            borderRadius: 2,
                                                            px: 2,
                                                            py: 1,
                                                            color: 'black',
                                                            minWidth: 80,
                                                            textAlign: 'center',
                                                            flex: '1 1 100px',
                                                            border: '1px solid rgba(0,0,0,0.2)', // thin neutral border
                                                            boxShadow: 'inset 0 0 3px rgba(0,0,0,0.1)', // subtle depth
                                                        }}
                                                    >
                                                        <Typography fontWeight="bold">{item.value}</Typography>
                                                        <Typography fontSize="0.85rem">{item.label}</Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </>
                                    );
                                })()}

                            </Paper>
                        )}
                    </Box>
                )}
            </Box>
        </Layout>
    );
}
