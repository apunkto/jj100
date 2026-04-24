import React, {useCallback, useEffect, useMemo, useState} from 'react'
import dynamic from 'next/dynamic'
import {Box, CircularProgress, FormControlLabel, Switch, Typography, useTheme} from '@mui/material'
import Layout from '@/src/components/Layout'
import useMetrixApi, {MetrixPlayerStats, PoolParProgressPayload} from '@/src/api/useMetrixApi'
import {SCORE_CATEGORY_COLORS, scoreColorFromDiff, ScoreResultCircle} from '@/src/components/ScoreResultCircle'
import type {ParProgressSeries} from '@/src/components/stats/ParProgressChart'
import {useTranslation} from 'react-i18next'

const StatsParProgressChartLazy = dynamic(
    () => import('@/src/components/stats/ParProgressChart').then((m) => m.StatsParProgressChart),
    { ssr: false, loading: () => <Box sx={{ height: 220 }} /> },
)

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <Box display="flex" justifyContent="space-between" alignItems="baseline" py={1.25} gap={2}>
            <Typography variant="body1" color="text.secondary">
                {label}
            </Typography>
            <Box sx={{ typography: 'body1', fontWeight: 600, textAlign: 'right', minWidth: 0 }}>
                {value}
            </Box>
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

function WorstResultStatValue({ stats }: { stats: MetrixPlayerStats }) {
    const { t } = useTranslation('pages')
    const w = stats.worstResult
    if (w == null) {
        return '–'
    }
    const diffLabel = w.diff > 0 ? `+${w.diff}` : String(w.diff)
    const wrap = (circle: React.ReactNode, text: React.ReactNode) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
            {circle}
            <Typography component="span" variant="body1" fontWeight={600}>
                {text}
            </Typography>
        </Box>
    )
    if (w.kind === 'single') {
        if (w.strokes != null) {
            return wrap(
                <ScoreResultCircle value={w.strokes} diffVsPar={w.diff} />,
                t('stats.worstResultSingleHoleSuffix', { hole: w.holeNumber }),
            )
        }
        return wrap(
            <ScoreResultCircle value={diffLabel} diffVsPar={w.diff} />,
            t('stats.worstResultSingleHoleSuffix', { hole: w.holeNumber }),
        )
    }
    if (w.strokesWhenUniform != null) {
        return wrap(
            <ScoreResultCircle value={w.strokesWhenUniform} diffVsPar={w.diff} />,
            t('stats.worstResultTiedCountSuffix', { count: w.count }),
        )
    }
    return wrap(
        <ScoreResultCircle value={diffLabel} diffVsPar={w.diff} />,
        t('stats.worstResultTiedCountSuffix', { count: w.count }),
    )
}

/** Course hole 1..N → display order starting at `startGroup` (1-based Metrix pool hole). */
function orderHoleDiffsForStartGroup(
    holeDiffs: (number | null)[],
    totalHoles: number,
    startGroup: number | null,
): (number | null)[] {
    const n = totalHoles
    if (n <= 0) return []
    let s = startGroup != null && Number.isFinite(startGroup) ? Math.floor(Number(startGroup)) : 1
    if (s < 1 || s > n) s = 1
    const out: (number | null)[] = []
    for (let i = 0; i < n; i++) {
        const courseHole = ((s - 1 + i) % n) + 1
        out.push(holeDiffs[courseHole - 1] ?? null)
    }
    return out
}

/** After theme primary: red → green → yellow → brown (max 5 in a pool). */
const POOL_CHART_COLORS = ['#D32F2F', '#2E7D32', '#F9A825', '#5D4037'] as const

export default function PlayerStatsPage() {
    const theme = useTheme()
    const { getMetrixPlayerStats, getMetrixPoolParProgress } = useMetrixApi()
    const { t } = useTranslation('pages')
    const [stats, setStats] = useState<MetrixPlayerStats | null>(null)
    const [loadingStats, setLoadingStats] = useState(false)
    const [showPoolmates, setShowPoolmates] = useState(false)
    const [poolProgress, setPoolProgress] = useState<PoolParProgressPayload | null>(null)
    const [loadingPool, setLoadingPool] = useState(false)

    const breakdownCategories = useMemo(
        () =>
            [
                { key: 'eagles' as const, color: SCORE_CATEGORY_COLORS.eagles, labelKey: 'stats.scoreEagle' as const },
                { key: 'birdies' as const, color: SCORE_CATEGORY_COLORS.birdies, labelKey: 'stats.scoreBirdie' as const },
                { key: 'pars' as const, color: SCORE_CATEGORY_COLORS.pars, labelKey: 'stats.scorePar' as const },
                { key: 'bogeys' as const, color: SCORE_CATEGORY_COLORS.bogeys, labelKey: 'stats.scoreBogey' as const },
                { key: 'doubleBogeys' as const, color: SCORE_CATEGORY_COLORS.doubleBogeys, labelKey: 'stats.scoreDouble' as const },
                { key: 'tripleOrWorse' as const, color: SCORE_CATEGORY_COLORS.tripleOrWorse, labelKey: 'stats.scoreTriple' as const },
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

    /** After screen lock / backgrounding, reload so numbers are not stale on return. */
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState !== 'visible') return
            void loadStats()
        }
        const onPageShow = (e: PageTransitionEvent) => {
            if (e.persisted) void loadStats()
        }
        document.addEventListener('visibilitychange', onVisible)
        window.addEventListener('pageshow', onPageShow)
        return () => {
            document.removeEventListener('visibilitychange', onVisible)
            window.removeEventListener('pageshow', onPageShow)
        }
    }, [loadStats])

    useEffect(() => {
        if (!showPoolmates || !stats) {
            setPoolProgress(null)
            setLoadingPool(false)
            return
        }
        let cancelled = false
        setLoadingPool(true)
        getMetrixPoolParProgress()
            .then((data) => {
                if (!cancelled) setPoolProgress(data)
            })
            .catch(() => {
                if (!cancelled) setPoolProgress(null)
            })
            .finally(() => {
                if (!cancelled) setLoadingPool(false)
            })
        return () => {
            cancelled = true
        }
    }, [showPoolmates, stats, getMetrixPoolParProgress])

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

    const progressOrderedDiffs = useMemo(() => {
        if (!stats?.holes.total) return []
        const diffs = stats.holeDiffs ?? []
        return orderHoleDiffsForStartGroup(diffs, stats.holes.total, stats.startGroup)
    }, [stats?.holeDiffs, stats?.holes.total, stats?.startGroup])

    const progressPlayedDiffsOnly = useMemo(
        () => progressOrderedDiffs.filter((d): d is number => d !== null),
        [progressOrderedDiffs],
    )

    /** One point per scored hole (playing order); x = 1..played, y = cumulative vs par. */
    const parProgressChartData = useMemo(() => {
        let cum = 0
        let played = 0
        const out: { hole: number; toPar: number }[] = []
        for (const d of progressOrderedDiffs) {
            if (d === null) continue
            cum += d
            played += 1
            out.push({ hole: played, toPar: cum })
        }
        return out
    }, [progressOrderedDiffs])

    const parChartSeries: ParProgressSeries[] = useMemo(() => {
        const primary = theme.palette.primary.main
        if (showPoolmates && poolProgress?.players?.length) {
            return poolProgress.players.map((p, i) => ({
                id: `u${p.userId}`,
                name: p.name,
                color: i === 0 ? primary : POOL_CHART_COLORS[(i - 1) % POOL_CHART_COLORS.length]!,
                points: p.points,
            }))
        }
        if (!stats) return []
        return [
            {
                id: 'self',
                name: stats.player.name,
                color: primary,
                points: parProgressChartData,
            },
        ]
    }, [showPoolmates, poolProgress, stats, parProgressChartData, theme.palette.primary.main])

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
                                <StatRow label={t('stats.worstResult')} value={<WorstResultStatValue stats={stats} />} />
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

                        {progressPlayedDiffsOnly.length > 0 && (
                            <Box sx={{ mt: 3, mb: 2 }} aria-label={t('stats.progress')}>
                                <SectionTitle>{t('stats.progress')}</SectionTitle>
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(20, minmax(0, 1fr))',
                                        columnGap: 0.5,
                                        rowGap: 0.75,
                                        width: '100%',
                                    }}
                                >
                                    {progressPlayedDiffsOnly.map((diff, idx) => (
                                        <Box
                                            key={idx}
                                            sx={{
                                                width: '100%',
                                                maxWidth: 14,
                                                aspectRatio: '1',
                                                justifySelf: 'center',
                                                borderRadius: '50%',
                                                boxSizing: 'border-box',
                                                bgcolor: scoreColorFromDiff(diff),
                                            }}
                                        />
                                    ))}
                                </Box>
                                {parProgressChartData.length > 0 && (
                                    <>
                                        <Box
                                            sx={{
                                                mt: 2,
                                                mb: 0.5,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: 1,
                                                flexWrap: 'wrap',
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ flex: '1 1 140px', minWidth: 0 }}
                                            >
                                                {t('stats.progressToParChart')}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
                                                {loadingPool && <CircularProgress size={18} thickness={5} />}
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={showPoolmates}
                                                            onChange={(_, c) => setShowPoolmates(c)}
                                                            size="small"
                                                        />
                                                    }
                                                    label={
                                                        <Typography variant="body2" component="span">
                                                            {t('stats.showPoolmates')}
                                                        </Typography>
                                                    }
                                                    sx={{ mr: 0, ml: 0 }}
                                                />
                                            </Box>
                                        </Box>
                                        <Box sx={{ width: '100%', minHeight: { xs: 272, sm: 220 }, mt: 0.5 }}>
                                            <StatsParProgressChartLazy
                                                series={parChartSeries}
                                                xAxisLabel={t('stats.chartHoleAxis')}
                                                showLegend={showPoolmates && parChartSeries.length > 1}
                                            />
                                        </Box>
                                    </>
                                )}
                            </Box>
                        )}
                    </>
                )}
            </Box>
        </Layout>
    )
}
