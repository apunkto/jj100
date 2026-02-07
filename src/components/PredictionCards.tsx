import React from 'react'
import {Box, Card, CardContent, Chip, Typography,} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import type {Prediction} from '@/src/api/usePredictionApi'

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

interface PredictionCardsProps {
    predictionData: Prediction | null
}

export function PredictionCards({predictionData}: PredictionCardsProps) {
    if (!predictionData) {
        return (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                Mängijal pole ennustust
            </Typography>
        )
    }

    const formatSignedNumber = (val: number | boolean | null): string => {
        if (val === null || typeof val !== 'number') return '-'
        return val > 0 ? `+${val}` : String(val)
    }

    const formatPlainNumber = (val: number | boolean | null): string =>
        val !== null && typeof val === 'number' ? String(val) : '-'

    const categories: Array<{
        label: string
        predicted: number | boolean | null
        actual: number | boolean | null
        score: {points: number; maxPoints: number; pending: boolean}
        formatValue: (val: number | boolean | null) => string | React.ReactNode
        isNumeric: boolean
    }> = []

    // Best overall score
    if (predictionData.best_overall_score !== null) {
        categories.push({
            label: 'Parim üldtulemus',
            predicted: predictionData.best_overall_score,
            actual: predictionData.actual_results?.best_overall_score ?? null,
            score: calculateNumericScore(predictionData.best_overall_score, predictionData.actual_results?.best_overall_score ?? null),
            isNumeric: true,
            formatValue: formatSignedNumber,
        })
    }

    // Best female score
    if (predictionData.best_female_score !== null) {
        categories.push({
            label: 'Parim naismängija tulemus',
            predicted: predictionData.best_female_score,
            actual: predictionData.actual_results?.best_female_score ?? null,
            score: calculateNumericScore(predictionData.best_female_score, predictionData.actual_results?.best_female_score ?? null),
            isNumeric: true,
            formatValue: formatSignedNumber,
        })
    }

    // Player own score
    if (predictionData.player_own_score !== null) {
        categories.push({
            label: 'Mängija enda tulemus',
            predicted: predictionData.player_own_score,
            actual: predictionData.actual_results?.player_own_score ?? null,
            score: calculateNumericScore(predictionData.player_own_score, predictionData.actual_results?.player_own_score ?? null),
            isNumeric: true,
            formatValue: formatSignedNumber,
        })
    }

    // Will rain
    if (predictionData.will_rain != null || predictionData.actual_results?.will_rain != null) {
        categories.push({
            label: 'Sajab võistluse ajal',
            predicted: predictionData.will_rain,
            actual: predictionData.actual_results?.will_rain ?? null,
            score: calculateBooleanScore(predictionData.will_rain, predictionData.actual_results?.will_rain ?? null),
            isNumeric: false,
            formatValue: (val) => {
                if (val === null || val === undefined || typeof val !== 'boolean') return '-'
                return val ? (
                    <CheckIcon sx={{color: 'success.main', fontSize: 24}} />
                ) : (
                    <CloseIcon sx={{color: 'error.main', fontSize: 24}} />
                )
            },
        })
    }

    // Hole in ones
    if (predictionData.hole_in_ones_count !== null) {
        categories.push({
            label: 'Hole-in-one\'ide arv',
            predicted: predictionData.hole_in_ones_count,
            actual: predictionData.actual_results?.hole_in_ones_count ?? null,
            score: calculateNumericScore(predictionData.hole_in_ones_count, predictionData.actual_results?.hole_in_ones_count ?? null, 100),
            isNumeric: true,
            formatValue: formatPlainNumber,
        })
    }

    // Water discs
    if (predictionData.water_discs_count !== null) {
        categories.push({
            label: 'Vette visanud mängijate arv',
            predicted: predictionData.water_discs_count,
            actual: predictionData.actual_results?.water_discs_count ?? null,
            score: calculateNumericScore(predictionData.water_discs_count, predictionData.actual_results?.water_discs_count ?? null, 400),
            isNumeric: true,
            formatValue: formatPlainNumber,
        })
    }

    return (
        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 2}}>
            {categories.map((category, index) => (
                <Box key={index} sx={{width: {xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(33.333% - 22px)'}}}>
                    <Card
                        variant="outlined"
                        sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <CardContent sx={{flexGrow: 1, pb: '16px !important'}}>
                            <Typography variant="subtitle2" fontWeight="bold" mb={1.5} color="text.secondary">
                                {category.label}
                            </Typography>

                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr 1fr 1fr', sm: '1fr 1fr' },
                                    gridTemplateRows: { xs: 'auto', sm: 'auto auto' },
                                    gap: 1.5,
                                    alignItems: 'flex-start',
                                }}
                            >
                                <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                                        Ennustus
                                    </Typography>
                                    <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                        {!category.isNumeric ? (
                                            category.formatValue(category.predicted)
                                        ) : (
                                            <Chip
                                                label={category.formatValue(category.predicted)}
                                                variant="outlined"
                                                size="small"
                                                sx={{
                                                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                                    color: 'primary.main',
                                                    fontWeight: 'bold',
                                                    borderColor: 'primary.light',
                                                }}
                                            />
                                        )}
                                    </Box>
                                </Box>

                                <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                                        Tegelik
                                    </Typography>
                                    <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                        {category.actual !== null && category.actual !== undefined ? (
                                            !category.isNumeric ? (
                                                category.formatValue(category.actual)
                                            ) : (
                                                <Chip
                                                    label={category.formatValue(category.actual)}
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: 'rgba(156, 39, 176, 0.08)',
                                                        color: 'secondary.main',
                                                        fontWeight: 'bold',
                                                        borderColor: 'secondary.light',
                                                    }}
                                                />
                                            )
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                -
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>

                                {category.score.maxPoints > 0 && (() => {
                                    const { points, maxPoints, pending } = category.score
                                    const pct = points / maxPoints
                                    const pointsColor = pending ? 'text.secondary' : pct > 0.9 ? 'success.main' : pct >= 0.75 ? 'warning.main' : 'error.main'
                                    return (
                                        <Box
                                            sx={{
                                                gridColumn: { xs: 3, sm: '1 / -1' },
                                                gridRow: { sm: 2 },
                                                pt: { sm: 1.5 },
                                                borderTop: { xs: 'none', sm: '1px solid' },
                                                borderColor: 'divider',
                                                display: 'flex',
                                                flexDirection: { xs: 'column', sm: 'row' },
                                                alignItems: { xs: 'center', sm: 'center' },
                                                justifyContent: { sm: 'space-between' },
                                            }}
                                        >
                                            <Typography variant="caption" color="text.secondary" sx={{ mb: { xs: 0.5, sm: 0 } }}>
                                                Punktid
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                fontWeight="bold"
                                                color={pointsColor}
                                            >
                                                {pending ? `- / ${maxPoints}` : `${points} / ${maxPoints}`}
                                            </Typography>
                                        </Box>
                                    )
                                })()}
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            ))}
        </Box>
    )
}
