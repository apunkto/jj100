import React from 'react'
import {Box, Card, CardContent, Chip, Typography,} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import type {Prediction} from '@/src/api/usePredictionApi'

// Helper functions to calculate points
function calculateNumericScore(predicted: number | null, actual: number | null, baseScore: number = 100): {points: number; maxPoints: number} {
    if (predicted === null || predicted === undefined) {
        return {points: 0, maxPoints: baseScore}
    }
    const actualValue = actual ?? 0 // Treat null as 0
    const points = baseScore - Math.abs(actualValue - predicted)
    return {points: Math.max(0, points), maxPoints: baseScore}
}

function calculateBooleanScore(predicted: boolean | null, actual: boolean | null): {points: number; maxPoints: number} {
    if (predicted === null || predicted === undefined) {
        return {points: 0, maxPoints: 15}
    }
    if (actual === null || actual === undefined) {
        return {points: 0, maxPoints: 15}
    }
    return {points: predicted === actual ? 15 : 0, maxPoints: 15}
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

    const categories: Array<{
        label: string
        predicted: number | boolean | null
        actual: number | boolean | null
        score: {points: number; maxPoints: number}
        formatValue: (val: number | boolean | null) => string | React.ReactNode
        isNumeric: boolean
    }> = []

    // Best overall score
    if (predictionData.best_overall_score !== null) {
        const score = calculateNumericScore(
            predictionData.best_overall_score,
            predictionData.actual_results?.best_overall_score ?? null
        )
        categories.push({
            label: 'Parim üldtulemus',
            predicted: predictionData.best_overall_score,
            actual: predictionData.actual_results?.best_overall_score ?? null,
            score,
            isNumeric: true,
            formatValue: (val) => {
                if (val === null || typeof val !== 'number') return '-'
                return val > 0 ? `+${val}` : String(val)
            },
        })
    }

    // Best female score
    if (predictionData.best_female_score !== null) {
        const score = calculateNumericScore(
            predictionData.best_female_score,
            predictionData.actual_results?.best_female_score ?? null
        )
        categories.push({
            label: 'Parim naismängija tulemus',
            predicted: predictionData.best_female_score,
            actual: predictionData.actual_results?.best_female_score ?? null,
            score,
            isNumeric: true,
            formatValue: (val) => {
                if (val === null || typeof val !== 'number') return '-'
                return val > 0 ? `+${val}` : String(val)
            },
        })
    }

    // Player own score
    if (predictionData.player_own_score !== null) {
        const score = calculateNumericScore(
            predictionData.player_own_score,
            predictionData.actual_results?.player_own_score ?? null
        )
        categories.push({
            label: 'Mängija enda tulemus',
            predicted: predictionData.player_own_score,
            actual: predictionData.actual_results?.player_own_score ?? null,
            score,
            isNumeric: true,
            formatValue: (val) => {
                if (val === null || typeof val !== 'number') return '-'
                return val > 0 ? `+${val}` : String(val)
            },
        })
    }

    // Will rain
    if (predictionData.will_rain !== null || predictionData.actual_results?.will_rain !== null || predictionData.actual_results?.will_rain !== undefined) {
        const score = calculateBooleanScore(
            predictionData.will_rain,
            predictionData.actual_results?.will_rain ?? null
        )
        categories.push({
            label: 'Sajab võistluse ajal',
            predicted: predictionData.will_rain,
            actual: predictionData.actual_results?.will_rain ?? null,
            score,
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
        const score = calculateNumericScore(
            predictionData.hole_in_ones_count,
            predictionData.actual_results?.hole_in_ones_count ?? null,
            100 // baseScore = 100 for HIO
        )
        categories.push({
            label: 'Hole-in-one\'ide arv',
            predicted: predictionData.hole_in_ones_count,
            actual: predictionData.actual_results?.hole_in_ones_count ?? null,
            score,
            isNumeric: true,
            formatValue: (val) => val !== null && typeof val === 'number' ? String(val) : '-',
        })
    }

    // Water discs
    if (predictionData.water_discs_count !== null) {
        const score = calculateNumericScore(
            predictionData.water_discs_count,
            predictionData.actual_results?.water_discs_count ?? null,
            400 // baseScore = 400 for water throwers
        )
        categories.push({
            label: 'Vette visanud mängijate arv',
            predicted: predictionData.water_discs_count,
            actual: predictionData.actual_results?.water_discs_count ?? null,
            score,
            isNumeric: true,
            formatValue: (val) => val !== null && typeof val === 'number' ? String(val) : '-',
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
                                    const pct = category.score.points / category.score.maxPoints
                                    const pointsColor = pct > 0.9 ? 'success.main' : pct >= 0.75 ? 'warning.main' : 'error.main'
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
                                                {category.score.points} / {category.score.maxPoints}
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
