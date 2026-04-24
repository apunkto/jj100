import React from 'react'
import {Box, Typography, useMediaQuery, useTheme} from '@mui/material'
import {CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis,} from 'recharts'

export type ParProgressPoint = { hole: number; toPar: number }

export type ParProgressSeries = {
    id: string
    name: string
    color: string
    points: ParProgressPoint[]
}

export type StatsParProgressChartProps = {
    series: ParProgressSeries[]
    xAxisLabel: string
    /** When true and more than one series, show color/name legend under the chart. */
    showLegend?: boolean
}

/** Fewer `target` ticks on narrow screens = less crowding on the X axis. */
function buildIntegerXTicks(maxHole: number, target: number): number[] {
    if (maxHole <= 0) return []
    if (maxHole <= 9) return Array.from({ length: maxHole }, (_, i) => i + 1)
    const step = Math.max(1, Math.ceil(maxHole / target))
    const ticks: number[] = [1]
    for (let h = step; h < maxHole; h += step) ticks.push(h)
    if (ticks[ticks.length - 1] !== maxHole) ticks.push(maxHole)
    return [...new Set(ticks)].sort((a, b) => a - b)
}

function buildUniformYTicks(yMin: number, yMax: number): number[] {
    if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMin > yMax) return []
    const span = yMax - yMin
    if (span === 0) return [yMin]
    const maxTicks = 8
    const stepCandidates = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]
    let step = 1
    for (const s of stepCandidates) {
        if (span / s <= maxTicks) {
            step = s
            break
        }
        step = s
    }
    if (span / step > maxTicks) {
        step = Math.pow(10, Math.ceil(Math.log10(span / maxTicks)))
    }
    const start = Math.floor(yMin / step) * step
    const end = Math.ceil(yMax / step) * step
    const ticks: number[] = []
    for (let v = start; v <= end; v += step) ticks.push(v)
    return ticks
}

function mergeSeriesForRecharts(series: ParProgressSeries[]): Array<Record<string, number | null>> {
    const maxHole = Math.max(
        1,
        ...series.map((s) => (s.points.length > 0 ? s.points[s.points.length - 1]!.hole : 0)),
    )
    const rows: Array<Record<string, number | null>> = []
    for (let h = 1; h <= maxHole; h++) {
        const row: Record<string, number | null> = { hole: h }
        for (const s of series) {
            const pt = s.points.find((p) => p.hole === h)
            row[s.id] = pt != null ? pt.toPar : null
        }
        rows.push(row)
    }
    return rows
}

export function StatsParProgressChart({ series, xAxisLabel, showLegend }: StatsParProgressChartProps) {
    const theme = useTheme()
    const isNarrow = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true })
    const axis = theme.palette.text.secondary
    const grid = theme.palette.divider
    const chartHeight = isNarrow ? 268 : 220
    const xTickTarget = isNarrow ? 4 : 6
    const tickFont = isNarrow ? 10 : 11
    const yAxisWidth = isNarrow ? 34 : 36
    const lineStroke = isNarrow ? 2.5 : 2
    const dotR = isNarrow ? 2 : 1.25
    const chartBottom = isNarrow ? 22 : 4

    const chartData = React.useMemo(() => mergeSeriesForRecharts(series), [series])

    const allY = React.useMemo(() => {
        const ys: number[] = []
        for (const s of series) {
            for (const p of s.points) ys.push(p.toPar)
        }
        return ys
    }, [series])

    const minY = allY.length ? Math.min(0, ...allY) : 0
    const maxY = allY.length ? Math.max(0, ...allY) : 0
    const span = maxY - minY || 1
    const pad = Math.max(1, Math.ceil(span * 0.12))
    const yDomainMin = Math.floor(minY - pad)
    const yDomainMax = Math.ceil(maxY + pad)

    const maxHole = chartData.length > 0 ? (chartData[chartData.length - 1]!.hole as number) : 1
    const xTicks = React.useMemo(() => buildIntegerXTicks(maxHole, xTickTarget), [maxHole, xTickTarget])
    const yTicks = React.useMemo(() => buildUniformYTicks(yDomainMin, yDomainMax), [yDomainMin, yDomainMax])
    const yDomainForAxis: [number, number] =
        yTicks.length >= 2 ? [yTicks[0]!, yTicks[yTicks.length - 1]!] : [yDomainMin, yDomainMax]

    if (series.length === 0 || chartData.length === 0) return null

    return (
        <Box>
            <Box sx={{ pointerEvents: 'none', touchAction: 'none', userSelect: 'none' }}>
                <ResponsiveContainer width="100%" height={chartHeight}>
                    <LineChart data={chartData} margin={{ top: 10, right: 4, left: 0, bottom: chartBottom }}>
                        <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="hole"
                            type="number"
                            domain={[1, maxHole]}
                            ticks={xTicks}
                            allowDecimals={false}
                            stroke={axis}
                            interval={0}
                            tick={{ fill: axis, fontSize: tickFont }}
                            label={{
                                value: xAxisLabel,
                                position: 'insideBottom',
                                offset: isNarrow ? -14 : -2,
                                fill: axis,
                                fontSize: tickFont,
                            }}
                        />
                        <YAxis
                            domain={yDomainForAxis}
                            ticks={yTicks}
                            reversed
                            allowDecimals={false}
                            stroke={axis}
                            tick={{ fill: axis, fontSize: tickFont }}
                            width={yAxisWidth}
                            tickFormatter={(v: number) => {
                                const n = Math.round(Number(v))
                                return n > 0 ? `+${n}` : String(n)
                            }}
                        />
                        <ReferenceLine y={0} stroke={axis} strokeWidth={isNarrow ? 1.5 : 1} />
                        {series.map((s) => (
                            <Line
                                key={s.id}
                                type="linear"
                                dataKey={s.id}
                                name={s.name}
                                stroke={s.color}
                                strokeWidth={lineStroke}
                                connectNulls={false}
                                dot={{ r: dotR, fill: s.color, stroke: s.color, strokeWidth: 0 }}
                                activeDot={false}
                                isAnimationActive={false}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </Box>
            {showLegend && series.length > 1 && (
                <Box
                    component="ul"
                    sx={{
                        mt: 1.5,
                        pl: 0,
                        mb: 0,
                        listStyle: 'none',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1.5,
                        rowGap: 0.75,
                    }}
                >
                    {series.map((s) => (
                        <Box
                            component="li"
                            key={s.id}
                            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}
                        >
                            <Box
                                sx={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    bgcolor: s.color,
                                    flexShrink: 0,
                                }}
                            />
                            <Typography variant="caption" color="text.secondary">
                                {s.name}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    )
}
