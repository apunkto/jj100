import React, { useEffect, useState } from 'react';
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
    Diff: number;
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

const LOCAL_STORAGE_KEY = 'selectedPlayerId';

export default function CtpStatsPage() {
    const [results, setResults] = useState<PlayerResult[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<PlayerResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const res = await fetch(
                    'https://discgolfmetrix.com/api.php?content=result&id=3204901'
                );
                const data = (await res.json()) as MetrixAPIResponse;
                const players = data.Competition.Results;
                setResults(players);

                const savedPlayerId = localStorage.getItem(LOCAL_STORAGE_KEY);
                if (savedPlayerId) {
                    const player = players.find(
                        (p) => p.UserID.toString() === savedPlayerId
                    );
                    if (player) setSelectedPlayer(player);
                }
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
            p.Diff < min.Diff ? p : min
        );
        return selectedPlayer.Diff - leader.Diff;
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

        return { eagles, birdies, pars, bogeys, doubleBogeys, tripleOrWorse };
    };

    return (
        <Layout>
            <Box textAlign="center" mt={2}>
                <Typography variant="h4" gutterBottom>
                    Mängija statistika
                </Typography>

                {loading ? (
                    <Box mt={4} display="flex" justifyContent="center">
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box mt={4}>
                        <Autocomplete<PlayerResult>
                            options={results}
                            getOptionLabel={(option) => option.Name}
                            value={selectedPlayer}
                            onChange={(_, newValue) => {
                                setSelectedPlayer(newValue);
                                if (newValue) {
                                    localStorage.setItem(LOCAL_STORAGE_KEY, newValue.UserID.toString());
                                } else {
                                    localStorage.removeItem(LOCAL_STORAGE_KEY);
                                }
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Mängija nimi" fullWidth sx={{ mb: 2 }} />
                            )}
                        />

                        {selectedPlayer && (
                            <Paper elevation={3} sx={{ mt: 2, p: 3, textAlign: 'left' }}>
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="h6" gutterBottom>
                                        {selectedPlayer.Name}
                                    </Typography>
                                    <Typography variant="h6" fontWeight={700}>
                                        {Number(selectedPlayer.Diff) > 0 ? `+${selectedPlayer.Diff}` : selectedPlayer.Diff}
                                    </Typography>
                                </Box>
                                <Divider sx={{ mb: 2 }} />
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

                                <Divider sx={{ my: 2 }} />

                                {/* Score breakdown bar and chips */}
                                {(() => {
                                    const breakdown = getScoreBreakdown();
                                    if (!breakdown) return null;

                                    const categories = [
                                        { key: 'eagles', color: '#f8c600', label: 'Eagle', value: breakdown.eagles },
                                        { key: 'birdies', color: 'rgba(62,195,0,.34)', label: 'Birdie', value: breakdown.birdies },
                                        { key: 'pars', color: '#ECECECFF', label: 'Par', value: breakdown.pars },
                                        { key: 'bogeys', color: 'rgba(244,43,3,.12)', label: 'Bogey', value: breakdown.bogeys },
                                        { key: 'doubleBogeys', color: 'rgba(244,43,3,.26)', label: 'Double', value: breakdown.doubleBogeys },
                                        { key: 'tripleOrWorse', color: 'rgba(244,43,3,.42)', label: 'Triple+', value: breakdown.tripleOrWorse },
                                    ];

                                    const total = categories.reduce((sum, cat) => sum + cat.value, 0);
                                    if (total === 0) return null;

                                    return (
                                        <>
                                            <Box display="flex" height={10} borderRadius={2} overflow="hidden" width="100%" mt={2}>
                                                {categories.map(({ key, color, value }) => {
                                                    const percent = (value / total) * 100;
                                                    return (
                                                        <Box
                                                            key={key}
                                                            sx={{
                                                                width: `${percent}%`,
                                                                backgroundColor: color,
                                                                display: percent > 0 ? 'block' : 'none',
                                                                minWidth: '2px',
                                                                height: '100%',
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </Box>

                                            <Box mt={1} display="flex" flexWrap="wrap" justifyContent="center" gap={1}>
                                                {categories.map(({ key, label, color, value }) => {
                                                    if (!value) return null;
                                                    return (
                                                        <Box
                                                            key={key}
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 0.5,
                                                                px: 1,
                                                                py: 0.5,
                                                                borderRadius: '20px',
                                                                backgroundColor: color,
                                                                color: '#000',
                                                                fontWeight: 400,
                                                                fontSize: '12px',
                                                            }}
                                                        >
                                                            {label}: {value}
                                                        </Box>
                                                    );
                                                })}
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
