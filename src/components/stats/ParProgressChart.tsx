import React from 'react'
import {Box, useTheme} from '@mui/material'
import {CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis,} from 'recharts'

export type ParProgressPoint = { hole: number; toPar: number }

export type StatsParProgressChartProps = {
    data: ParProgressPoint[]
    /** i18n: x-axis label */
    xAxisLabel: string
}

function buildIntegerXTicks(maxHole: number): number[] {
    if (maxHole <= 0) return []
    if (maxHole <= 9) return Array.from({ length: maxHole }, (_, i) => i + 1)
    const target = 6
    const step = Math.max(1, Math.ceil(maxHole / target))
    const ticks: number[] = [1]
    for (let h = step; h < maxHole; h += step) ticks.push(h)
    if (ticks[ticks.length - 1] !== maxHole) ticks.push(maxHole)
    return [...new Set(ticks)].sort((a, b) => a - b)
}

/** Evenly spaced integer ticks (fixed step 1 / 2 / 5 / …) so labels are predictable. */
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

export function StatsParProgressChart({ data, xAxisLabel }: StatsParProgressChartProps) {
    const theme = useTheme()
    const axis = theme.palette.text.secondary
    const grid = theme.palette.divider
    const lineColor = theme.palette.primary.main

    const ys = data.map((d) => d.toPar)
    const minY = Math.min(0, ...ys)
    const maxY = Math.max(0, ...ys)
    const span = maxY - minY || 1
    const pad = Math.max(1, Math.ceil(span * 0.12))
    const yDomainMin = Math.floor(minY - pad)
    const yDomainMax = Math.ceil(maxY + pad)

    const maxHole = data.length > 0 ? data[data.length - 1]!.hole : 1
    const xTicks = React.useMemo(() => buildIntegerXTicks(maxHole), [maxHole])
    const yTicks = React.useMemo(() => buildUniformYTicks(yDomainMin, yDomainMax), [yDomainMin, yDomainMax])
    const yDomainForAxis: [number, number] =
        yTicks.length >= 2 ? [yTicks[0]!, yTicks[yTicks.length - 1]!] : [yDomainMin, yDomainMax]

    if (data.length === 0) return null

    return (
        <Box sx={{ pointerEvents: 'none', touchAction: 'none', userSelect: 'none' }}>
            <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey="hole"
                        type="number"
                        domain={[1, maxHole]}
                        ticks={xTicks}
                        allowDecimals={false}
                        stroke={axis}
                        tick={{ fill: axis, fontSize: 11 }}
                        label={{ value: xAxisLabel, position: 'insideBottom', offset: -2, fill: axis, fontSize: 11 }}
                    />
                    <YAxis
                        domain={yDomainForAxis}
                        ticks={yTicks}
                        reversed
                        allowDecimals={false}
                        stroke={axis}
                        tick={{ fill: axis, fontSize: 11 }}
                        width={36}
                        tickFormatter={(v: number) => {
                            const n = Math.round(Number(v))
                            return n > 0 ? `+${n}` : String(n)
                        }}
                    />
                    <ReferenceLine y={0} stroke={axis} strokeWidth={1} />
                    <Line
                        type="linear"
                        dataKey="toPar"
                        stroke={lineColor}
                        strokeWidth={2}
                        dot={{ r: 1.25, fill: lineColor, stroke: lineColor, strokeWidth: 0 }}
                        activeDot={false}
                        isAnimationActive={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </Box>
    )
}
