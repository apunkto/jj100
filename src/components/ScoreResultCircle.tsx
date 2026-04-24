import React from 'react'
import {Box} from '@mui/material'

/** Same fills as course page / stats score breakdown. */
const SCORE_FILL = {
    eagleOrBetter: '#f8c600',
    birdie: 'rgba(62,195,0,.34)',
    par: '#ECECECFF',
    bogey: 'rgba(244,43,3,.12)',
    doubleBogey: 'rgba(244,43,3,.26)',
    tripleOrWorse: 'rgba(244,43,3,.42)',
} as const

/** Keys match stats breakdown / Metrix buckets. */
export const SCORE_CATEGORY_COLORS = {
    eagles: SCORE_FILL.eagleOrBetter,
    birdies: SCORE_FILL.birdie,
    pars: SCORE_FILL.par,
    bogeys: SCORE_FILL.bogey,
    doubleBogeys: SCORE_FILL.doubleBogey,
    tripleOrWorse: SCORE_FILL.tripleOrWorse,
} as const

/** VS-par `diff` → circle background (same thresholds as course `result - par`). */
export function scoreColorFromDiff(diff: number): string {
    if (diff <= -2) return SCORE_FILL.eagleOrBetter
    if (diff === -1) return SCORE_FILL.birdie
    if (diff === 0) return SCORE_FILL.par
    if (diff === 1) return SCORE_FILL.bogey
    if (diff === 2) return SCORE_FILL.doubleBogey
    return SCORE_FILL.tripleOrWorse
}

export function scoreColorFromResultPar(result: number, par: number): string {
    return scoreColorFromDiff(result - par)
}

function scoreFillFromProps(
    strokes: number | undefined,
    par: number | undefined,
    diffVsPar: number | undefined,
    backgroundColor: string | null | undefined,
): string {
    if (
        strokes != null &&
        par != null &&
        Number.isFinite(strokes) &&
        Number.isFinite(par)
    ) {
        return scoreColorFromResultPar(strokes, par)
    }
    if (diffVsPar != null && Number.isFinite(diffVsPar)) {
        return scoreColorFromDiff(diffVsPar)
    }
    return backgroundColor ?? 'action.hover'
}

export type ScoreResultCircleProps = {
    value: React.ReactNode
    /** Gross strokes + hole par → fill (preferred when both finite). */
    strokes?: number
    par?: number
    /** vs-par (strokes − par); used when strokes+par are not both finite. */
    diffVsPar?: number
    /** Explicit fill when score props omitted or for overrides. */
    backgroundColor?: string | null
    hasPenalty?: boolean
    /** Default 32 to match course footer. */
    size?: number
}

/** Compact disc-style score badge (strokes or vs-par label). */
export function ScoreResultCircle({
    value,
    strokes,
    par,
    diffVsPar,
    backgroundColor,
    hasPenalty = false,
    size = 32,
}: ScoreResultCircleProps) {
    const fill = scoreFillFromProps(strokes, par, diffVsPar, backgroundColor)

    return (
        <Box
            sx={{
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: fill,
                fontSize: '0.95rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
                color: 'text.primary',
                flexShrink: 0,
                ...(hasPenalty && {
                    border: '2px solid',
                    borderColor: 'error.main',
                }),
            }}
        >
            {value}
        </Box>
    )
}
