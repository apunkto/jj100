import React, {useMemo} from 'react'
import {Box, Card, CardContent, Divider, LinearProgress, Typography} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import type {Prediction} from '@/src/api/usePredictionApi'
import {useTranslation} from 'react-i18next'

/** Table column headers — shared with previous-year dialog */
export const predictionResultsColumnHeaderSx = {
    fontSize: '0.6875rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: 'text.secondary',
    textAlign: 'center' as const,
    lineHeight: "1.2rem",
} as const

/** Numeric values in prediction result cards / 2025 dialog */
export const predictionResultsNumericValueSx = {
    fontWeight: 600,
    color: 'text.primary',
    fontVariantNumeric: 'tabular-nums' as const,
    letterSpacing: '-0.02em',
} as const

export const predictionResultCardContentSx = {
    p: 2.25,
    pb: '18px !important',
    '&:last-child': {pb: '18px !important'},
} as const

export const predictionResultCardTitleSx = {
    fontWeight: 700,
    color: 'text.primary',
    letterSpacing: '0.01em',
    lineHeight: "1.35rem",
    pr: 1,
} as const

// Helper functions to calculate points
function calculateNumericScore(predicted: number | null, actual: number | null, baseScore: number = 100): {points: number; maxPoints: number; pending: boolean} {
    if (predicted === null || predicted === undefined) {
        return {points: 0, maxPoints: baseScore, pending: false}
    }
    if (actual === null || actual === undefined) {
        return {points: 0, maxPoints: baseScore, pending: true}
    }
    const points = baseScore - Math.abs(actual - predicted)
    return {points: Math.max(0, points), maxPoints: baseScore, pending: false}
}

function calculateBooleanScore(predicted: boolean | null, actual: boolean | null): {points: number; maxPoints: number; pending: boolean} {
    if (predicted === null || predicted === undefined) {
        return {points: 0, maxPoints: 15, pending: false}
    }
    if (actual === null || actual === undefined) {
        return {points: 0, maxPoints: 15, pending: true}
    }
    return {points: predicted === actual ? 15 : 0, maxPoints: 15, pending: false}
}

function pointsBarColor(pending: boolean, pct: number): 'text.secondary' | 'success.main' | 'warning.main' | 'error.main' {
    if (pending) return 'text.secondary'
    if (pct > 0.9) return 'success.main'
    if (pct >= 0.75) return 'warning.main'
    return 'error.main'
}

function cardAccentColor(pending: boolean, maxPoints: number, pct: number): string {
    if (pending || maxPoints <= 0) return 'divider'
    if (pct > 0.9) return 'success.main'
    if (pct >= 0.75) return 'warning.main'
    return 'error.main'
}

interface PredictionCardsProps {
    predictionData: Prediction | null
}

export function PredictionCards({predictionData}: PredictionCardsProps) {
    const {t} = useTranslation('prediction')

    const formatSignedNumber = (val: number | boolean | null): string => {
        if (val === null || typeof val !== 'number') return '-'
        return val > 0 ? `+${val}` : String(val)
    }

    const formatPlainNumber = (val: number | boolean | null): string =>
        val !== null && typeof val === 'number' ? String(val) : '-'

    const categories = useMemo(() => {
        if (!predictionData) return []
        type Cat = {
            label: string
            predicted: number | boolean | null
            actual: number | boolean | null
            score: {points: number; maxPoints: number; pending: boolean}
            formatValue: (val: number | boolean | null) => string | React.ReactNode
            isNumeric: boolean
        }
        const out: Cat[] = []

        if (predictionData.best_overall_score !== null) {
            out.push({
                label: t('cards_cat_best_overall'),
                predicted: predictionData.best_overall_score,
                actual: predictionData.actual_results?.best_overall_score ?? null,
                score: calculateNumericScore(
                    predictionData.best_overall_score,
                    predictionData.actual_results?.best_overall_score ?? null,
                ),
                isNumeric: true,
                formatValue: formatSignedNumber,
            })
        }

        if (predictionData.best_female_score !== null) {
            out.push({
                label: t('cards_cat_best_female'),
                predicted: predictionData.best_female_score,
                actual: predictionData.actual_results?.best_female_score ?? null,
                score: calculateNumericScore(
                    predictionData.best_female_score,
                    predictionData.actual_results?.best_female_score ?? null,
                ),
                isNumeric: true,
                formatValue: formatSignedNumber,
            })
        }

        if (predictionData.player_own_score !== null) {
            out.push({
                label: t('cards_cat_own'),
                predicted: predictionData.player_own_score,
                actual: predictionData.actual_results?.player_own_score ?? null,
                score: calculateNumericScore(
                    predictionData.player_own_score,
                    predictionData.actual_results?.player_own_score ?? null,
                ),
                isNumeric: true,
                formatValue: formatSignedNumber,
            })
        }

        if (predictionData.will_rain != null || predictionData.actual_results?.will_rain != null) {
            out.push({
                label: t('cards_cat_rain'),
                predicted: predictionData.will_rain,
                actual: predictionData.actual_results?.will_rain ?? null,
                score: calculateBooleanScore(predictionData.will_rain, predictionData.actual_results?.will_rain ?? null),
                isNumeric: false,
                formatValue: (val) => {
                    if (val === null || val === undefined) {
                        return (
                            <Typography variant="body2" color="text.secondary" sx={{py: 0.5}}>
                                –
                            </Typography>
                        )
                    }
                    if (typeof val !== 'boolean') {
                        return (
                            <Typography variant="body2" color="text.secondary">
                                –
                            </Typography>
                        )
                    }
                    return (
                        <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.35, py: 0.25}}>
                            {val ? (
                                <CheckIcon sx={{color: 'success.main', fontSize: 22}} />
                            ) : (
                                <CloseIcon sx={{color: 'error.main', fontSize: 22}} />
                            )}
                            <Typography variant="caption" color="text.secondary" sx={{fontWeight: 600, lineHeight: "1.2rem"}}>
                                {val ? t('cards_rain_yes') : t('cards_rain_no')}
                            </Typography>
                        </Box>
                    )
                },
            })
        }

        if (predictionData.hole_in_ones_count !== null) {
            out.push({
                label: t('cards_cat_hio'),
                predicted: predictionData.hole_in_ones_count,
                actual: predictionData.actual_results?.hole_in_ones_count ?? null,
                score: calculateNumericScore(
                    predictionData.hole_in_ones_count,
                    predictionData.actual_results?.hole_in_ones_count ?? null,
                    100,
                ),
                isNumeric: true,
                formatValue: formatPlainNumber,
            })
        }

        if (predictionData.water_discs_count !== null) {
            out.push({
                label: t('cards_cat_water'),
                predicted: predictionData.water_discs_count,
                actual: predictionData.actual_results?.water_discs_count ?? null,
                score: calculateNumericScore(
                    predictionData.water_discs_count,
                    predictionData.actual_results?.water_discs_count ?? null,
                    400,
                ),
                isNumeric: true,
                formatValue: formatPlainNumber,
            })
        }

        return out
    }, [predictionData, t])

    if (!predictionData) {
        return (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                {t('cards_noPrediction')}
            </Typography>
        )
    }

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
            {categories.map((category, index) => {
                const {points, maxPoints, pending} = category.score
                const pct = maxPoints > 0 ? points / maxPoints : 0
                const barColor = pointsBarColor(pending, pct)
                const accent = cardAccentColor(pending, maxPoints, pct)

                return (
                    <Box key={index} sx={{width: '100%'}}>
                        <Card
                            variant="outlined"
                            elevation={0}
                            sx={{
                                borderRadius: 2,
                                borderLeftWidth: 4,
                                borderLeftStyle: 'solid',
                                borderLeftColor: accent,
                                boxShadow: (theme) => theme.shadows[1],
                                overflow: 'hidden',
                            }}
                        >
                            <CardContent sx={predictionResultCardContentSx}>
                                <Typography component="h3" variant="subtitle1" sx={predictionResultCardTitleSx}>
                                    {category.label}
                                </Typography>
                                <Divider sx={{my: 1.5}} />

                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                                        columnGap: {xs: 1, sm: 2},
                                        rowGap: 1.25,
                                        alignItems: 'start',
                                    }}
                                >
                                    <Typography sx={{...predictionResultsColumnHeaderSx, gridColumn: 1}}>
                                        {t('cards_predicted')}
                                    </Typography>
                                    <Typography sx={{...predictionResultsColumnHeaderSx, gridColumn: 2}}>
                                        {t('cards_actual')}
                                    </Typography>
                                    <Typography sx={{...predictionResultsColumnHeaderSx, gridColumn: 3}}>
                                        {t('cards_points')}
                                    </Typography>

                                    <Box
                                        sx={{
                                            gridColumn: 1,
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            minHeight: 40,
                                        }}
                                    >
                                        {!category.isNumeric ? (
                                            category.formatValue(category.predicted)
                                        ) : (
                                            <Typography variant="h6" component="span" sx={predictionResultsNumericValueSx}>
                                                {category.formatValue(category.predicted) as string}
                                            </Typography>
                                        )}
                                    </Box>

                                    <Box
                                        sx={{
                                            gridColumn: 2,
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            minHeight: 40,
                                        }}
                                    >
                                        {category.actual !== null && category.actual !== undefined ? (
                                            !category.isNumeric ? (
                                                category.formatValue(category.actual)
                                            ) : (
                                                <Typography variant="h6" component="span" sx={predictionResultsNumericValueSx}>
                                                    {category.formatValue(category.actual) as string}
                                                </Typography>
                                            )
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                                –
                                            </Typography>
                                        )}
                                    </Box>

                                    <Box
                                        sx={{
                                            gridColumn: 3,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minHeight: 40,
                                            width: '100%',
                                            px: 0.5,
                                        }}
                                    >
                                        {category.score.maxPoints > 0 ? (
                                            <>
                                                <Typography variant="body2" fontWeight="bold" color={barColor} sx={{mb: 0.75}}>
                                                    {pending ? `– / ${maxPoints}` : `${points} / ${maxPoints}`}
                                                </Typography>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={pending ? 0 : Math.min(100, (points / maxPoints) * 100)}
                                                    sx={{
                                                        width: '100%',
                                                        maxWidth: 120,
                                                        height: 6,
                                                        borderRadius: 999,
                                                        bgcolor: 'action.selected',
                                                        '& .MuiLinearProgress-bar': {
                                                            borderRadius: 999,
                                                            bgcolor: barColor,
                                                        },
                                                    }}
                                                />
                                            </>
                                        ) : null}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                )
            })}
        </Box>
    )
}
