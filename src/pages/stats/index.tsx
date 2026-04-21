import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {Box, CircularProgress, Typography} from '@mui/material'
import Layout from '@/src/components/Layout'
import useMetrixApi, {MetrixPlayerStats} from '@/src/api/useMetrixApi'
import {useTranslation} from 'react-i18next'

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <Box display="flex" justifyContent="space-between" alignItems="baseline" py={1.25} gap={2}>
            <Typography variant="body1" color="text.secondary">
                {label}
            </Typography>
            <Typography variant="body1" fontWeight={600} sx={{ textAlign: 'right' }}>
                {value}
            </Typography>
        </Box>
    )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>
            {children}
        </Typography>
    )
}

export default function PlayerStatsPage() {
    const { getMetrixPlayerStats } = useMetrixApi()
    const { t } = useTranslation('pages')
    const [stats, setStats] = useState<MetrixPlayerStats | null>(null)
    const [loadingStats, setLoadingStats] = useState(false)

    const breakdownCategories = useMemo(
        () =>
            [
                { key: 'eagles' as const, color: '#f8c600', labelKey: 'stats.scoreEagle' as const },
                { key: 'birdies' as const, color: 'rgba(62,195,0,.34)', labelKey: 'stats.scoreBirdie' as const },
                { key: 'pars' as const, color: '#ECECECFF', labelKey: 'stats.scorePar' as const },
                { key: 'bogeys' as const, color: 'rgba(244,43,3,.12)', labelKey: 'stats.scoreBogey' as const },
                { key: 'doubleBogeys' as const, color: 'rgba(244,43,3,.26)', labelKey: 'stats.scoreDouble' as const },
                { key: 'tripleOrWorse' as const, color: 'rgba(244,43,3,.42)', labelKey: 'stats.scoreTriple' as const },
            ] as const,
        [],
    )

    const loadStats = useCallback(async () => {
        setLoadingStats(true)
        try {
            const data = await getMetrixPlayerStats()
            setStats(data)
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

    const breakdown = useMemo(() => {
        const b = stats?.scoreBreakdown
        if (!b) return null
        const categories = breakdownCategories.map((c) => ({
            ...c,
            label: t(c.labelKey),
            value: (b as Record<string, number>)[c.key] ?? 0,
        }))
        const total = categories.reduce((sum, c) => sum + c.value, 0)
        if (total === 0) return null
        return { categories, total }
    }, [stats?.scoreBreakdown, breakdownCategories, t])

    return (
        <Layout>
            <Box
                sx={{
                    maxWidth: 560,
                    px: 2,
                    py: 3,
                }}
            >
                <Typography variant="h4" fontWeight="bold" textAlign="center" gutterBottom>
                    {t('stats.title')}
                </Typography>

                {loadingStats ? (
                    <Box display="flex" justifyContent="center" py={6}>
                        <CircularProgress />
                    </Box>
                ) : !stats ? (
                    <Typography
                        variant="body1"
                        color="text.secondary"
                        textAlign="center"
                        sx={{ py: 6, px: 2 }}
                    >
                        {t('stats.notPlayed')}
                    </Typography>
                ) : (
                    <>
                        {/* Name + total score */}
                        <Box
                            sx={{
                                mt: 3,
                                mb: 3,
                                py: 2,
                                px: 2,
                                borderRadius: 2,
                                bgcolor: 'action.hover',
                            }}
                        >
                            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                                <Typography variant="h6" fontWeight={700}>
                                    {stats.player.name}
                                </Typography>
                                <Typography
                                    variant="h5"
                                    fontWeight={700}
                                    color={Number(stats.player.diff) > 0 ? 'error.main' : Number(stats.player.diff) < 0 ? 'success.main' : 'text.primary'}
                                >
                                    {Number(stats.player.diff) > 0 ? `+${stats.player.diff}` : stats.player.diff}
                                </Typography>
                            </Box>
                            {stats.player.className && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    {stats.player.className}
                                </Typography>
                            )}
                        </Box>

                        <Box sx={{ mb: 3 }}>
                            <SectionTitle>{t('stats.overview')}</SectionTitle>
                            <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, px: 2, py: 0 }}>
                                <StatRow label={t('stats.placeInClass')} value={stats.player.orderNumber ?? '–'} />
                                <StatRow
                                    label={t('stats.behindLeader')}
                                    value={stats.deltaToClassLeader === null ? '–' : `${stats.deltaToClassLeader} ${t('stats.throws')}`}
                                />
                                <StatRow
                                    label={t('stats.holesPlayed')}
                                    value={
                                        <>
                                            {stats.holes.played}/{stats.holes.total}
                                            {stats.holes.playedPct != null && ` (${stats.holes.playedPct.toFixed(0)}%)`}
                                        </>
                                    }
                                />
                                <StatRow
                                    label={t('stats.obHoles')}
                                    value={
                                        stats.holes.played > 0
                                            ? `${stats.obHoles} (${Math.round((stats.obHoles / stats.holes.played) * 100)}%)`
                                            : String(stats.obHoles)
                                    }
                                />
                            </Box>
                        </Box>

                        {/* Score distribution */}
                        {breakdown && (
                            <Box sx={{ mb: 2 }}>
                                <SectionTitle>{t('stats.scoreDistribution')}</SectionTitle>
                                <Box
                                    sx={{
                                        height: 12,
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        display: 'flex',
                                        width: '100%',
                                        bgcolor: 'action.hover',
                                    }}
                                >
                                    {breakdown.categories.map(({ key, color, value }) => {
                                        const percent = (value / breakdown.total) * 100
                                        return (
                                            <Box
                                                key={key}
                                                sx={{
                                                    width: `${percent}%`,
                                                    backgroundColor: color,
                                                    display: percent > 0 ? 'block' : 'none',
                                                    minWidth: percent > 0 ? 4 : 0,
                                                }}
                                            />
                                        )
                                    })}
                                </Box>
                                <Box display="flex" flexWrap="wrap" gap={1} sx={{ mt: 1.5 }}>
                                    {breakdown.categories
                                        .filter((c) => c.value > 0)
                                        .map(({ label, color, value }) => (
                                            <Box
                                                key={label}
                                                component="span"
                                                sx={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    px: 1.5,
                                                    py: 0.5,
                                                    borderRadius: '9999px',
                                                    backgroundColor: color,
                                                    fontSize: '0.8125rem',
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {label}: {value}
                                            </Box>
                                        ))}
                                </Box>
                            </Box>
                        )}
                    </>
                )}
            </Box>
        </Layout>
    )
}
