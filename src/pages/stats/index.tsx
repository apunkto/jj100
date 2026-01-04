import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {Box, CircularProgress, Divider, Paper, Typography} from '@mui/material'
import Layout from '@/src/components/Layout'
import useMetrixApi, {MetrixPlayerStats} from '@/src/api/useMetrixApi'

export default function CtpStatsPage() {
    const { getMetrixPlayerStats } = useMetrixApi()

    const [stats, setStats] = useState<MetrixPlayerStats | null>(null)

    const [loadingStats, setLoadingStats] = useState(false)

    const loadStats = useCallback(async () => {
        setLoadingStats(true)
        try {
            const data = await getMetrixPlayerStats()
            setStats(data) // can be null if user didn't participate
        } catch (err) {
            console.error('Failed to load metrix player stats:', err)
            setStats(null)
        } finally {
            setLoadingStats(false)
        }
    }, [getMetrixPlayerStats])

    useEffect(() => {
        loadStats()
    }, [loadStats])

    const breakdownCategories = useMemo(() => {
        const breakdown = stats?.scoreBreakdown
        if (!breakdown) return null

        const categories = [
            { key: 'eagles', color: '#f8c600', label: 'Eagle', value: breakdown.eagles },
            { key: 'birdies', color: 'rgba(62,195,0,.34)', label: 'Birdie', value: breakdown.birdies },
            { key: 'pars', color: '#ECECECFF', label: 'Par', value: breakdown.pars },
            { key: 'bogeys', color: 'rgba(244,43,3,.12)', label: 'Bogey', value: breakdown.bogeys },
            { key: 'doubleBogeys', color: 'rgba(244,43,3,.26)', label: 'Double', value: breakdown.doubleBogeys },
            { key: 'tripleOrWorse', color: 'rgba(244,43,3,.42)', label: 'Triple+', value: breakdown.tripleOrWorse },
        ]

        const total = categories.reduce((sum, c) => sum + c.value, 0)
        if (total === 0) return null

        return { categories, total }
    }, [stats?.scoreBreakdown])

    return (
        <Layout>
            <Box display="flex"  flexDirection="column" alignItems="center">
                <Typography variant="h4" fontWeight="bold">
                Mängija statistika
                </Typography>

                <Box mt={2}>
                    {loadingStats ? (
                        <Box mt={4} display="flex" justifyContent="center">
                            <CircularProgress />
                        </Box>
                    ) : !stats ? (
                        <Paper elevation={3} sx={{ mt: 2, p: 3, textAlign: 'center' }}>
                            <Typography variant="h6" fontWeight={700}>
                                Sa ei osalenud sellel võistlusel.
                            </Typography>
                        </Paper>
                    ) : (
                        <Paper elevation={3} sx={{ mt: 2, p: 3, textAlign: 'left' }}>
                            <Box display="flex" justifyContent="space-between">
                                <Typography variant="h6" gutterBottom>
                                    {stats.player.name}
                                </Typography>
                                <Typography variant="h6" fontWeight={700}>
                                    {Number(stats.player.diff) > 0 ? `+${stats.player.diff}` : stats.player.diff}
                                </Typography>
                            </Box>

                            <Divider sx={{ mb: 2 }} />

                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography fontWeight="bold">Klass:</Typography>
                                <Typography>{stats.player.className}</Typography>
                            </Box>

                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography fontWeight="bold">Koht:</Typography>
                                <Typography>{stats.player.orderNumber}</Typography>
                            </Box>

                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography fontWeight="bold">Liidrist maas:</Typography>
                                <Typography>
                                    {stats.deltaToClassLeader === null ? '-' : `${stats.deltaToClassLeader} viset`}
                                </Typography>
                            </Box>

                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography fontWeight="bold">Üldjärjestus:</Typography>
                                <Typography>{stats.overallPlace === null ? '-' : `${stats.overallPlace}. koht`}</Typography>
                            </Box>

                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography fontWeight="bold">Läbitud rajad:</Typography>
                                <Typography>
                                    {stats.holes.played}/{stats.holes.total}
                                    {stats.holes.playedPct !== null ? ` (${stats.holes.playedPct.toFixed(0)}%)` : ''}
                                </Typography>
                            </Box>

                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography fontWeight="bold">OB radu:</Typography>
                                <Typography>
                                    {stats.obHoles}
                                    {stats.holes.played > 0 ? ` (${Math.round((stats.obHoles / stats.holes.played) * 100)}%)` : ''}
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {breakdownCategories && (
                                <>
                                    <Box
                                        display="flex"
                                        height={10}
                                        borderRadius={2}
                                        overflow="hidden"
                                        width="100%"
                                        mt={2}
                                    >
                                        {breakdownCategories.categories.map(({ key, color, value }) => {
                                            const percent = (value / breakdownCategories.total) * 100
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
                                            )
                                        })}
                                    </Box>

                                    <Box mt={1} display="flex" flexWrap="wrap" justifyContent="center" gap={1}>
                                        {breakdownCategories.categories.map(({ key, label, color, value }) => {
                                            if (!value) return null
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
                                            )
                                        })}
                                    </Box>
                                </>
                            )}
                        </Paper>
                    )}
                </Box>
            </Box>
        </Layout>
    )
}
