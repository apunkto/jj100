import React, {forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState} from 'react'
import {Box, Typography} from '@mui/material'

// Tuned for large LED ~1200x800; can be overridden via props if needed
const REEL_SLOT_SIZE_PX = 140
const REEL_WIDTH_MULTIPLIER = 1.9
const REEL_VISIBLE_ROWS = 3
const REEL_SPIN_ITEMS_BEFORE_WINNER = 40
const REEL_EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'

/** Default idle behaviour: random names in random slots. Empty pool = show nothing (no "?"). */
function buildRandomStrip(names: string[], length: number): string[] {
    if (names.length === 0) {
        return Array(length).fill('')
    }
    const strip: string[] = []
    for (let i = 0; i < length; i++) {
        strip.push(names[Math.floor(Math.random() * names.length)]!)
    }
    return strip
}

/** Idle state: strip of random names; stopIndex 1 so middle visible row is strip[1]. Offset 0 shows first 3. */
function buildIdleStrip(names: string[]): { strip: string[]; stopIndex: number } {
    const strip = buildRandomStrip(names, REEL_SPIN_ITEMS_BEFORE_WINNER + 15)
    return { strip, stopIndex: 1 }
}

/** Spinning outcome: winner at stopIndex so middle visible row shows winner when stopped. */
function buildReelStrip(winner: string, pool: string[]): { strip: string[]; stopIndex: number } {
    const names = pool.length > 0 ? pool : [winner]
    const strip: string[] = []
    for (let i = 0; i < REEL_SPIN_ITEMS_BEFORE_WINNER; i++) {
        strip.push(names[Math.floor(Math.random() * names.length)]!)
    }
    const stopIndex = strip.length
    strip.push(winner)
    for (let i = 0; i < 14; i++) {
        strip.push(names[Math.floor(Math.random() * names.length)]!)
    }
    return { strip, stopIndex }
}

function SingleReel({
    strip,
    stopIndex,
    durationMs,
    startSpinning,
    onStopped,
    slotSizePx,
}: {
    strip: string[]
    stopIndex: number
    durationMs: number
    startSpinning: boolean
    onStopped: () => void
    slotSizePx: number
}) {
    const [offset, setOffset] = useState(0)
    const [stopped, setStopped] = useState(false)
    const onStoppedRef = useRef(onStopped)
    onStoppedRef.current = onStopped

    React.useEffect(() => {
        if (!startSpinning) return
        const targetY = -(stopIndex - 1) * slotSizePx
        setOffset(targetY)
        const t = setTimeout(() => {
            setStopped(true)
            onStoppedRef.current()
        }, durationMs)
        return () => clearTimeout(t)
    }, [stopIndex, durationMs, startSpinning, slotSizePx])

    const viewportHeight = slotSizePx * REEL_VISIBLE_ROWS
    const stripHeight = strip.length * slotSizePx

    return (
        <Box
            sx={{
                overflow: 'hidden',
                height: viewportHeight,
                width: slotSizePx * REEL_WIDTH_MULTIPLIER,
                minWidth: slotSizePx * 1.5,
                borderRadius: 2,
                background: 'linear-gradient(180deg, #ebe8e4 0%, #e0dcd6 100%)',
                border: '3px solid #5a5550',
                boxShadow: '0 3px 12px rgba(0,0,0,0.12)',
            }}
        >
            <Box
                sx={{
                    height: stripHeight,
                    transition: stopped ? 'none' : `transform ${durationMs}ms ${REEL_EASE_OUT}`,
                    transform: `translateY(${offset}px)`,
                    willChange: 'transform',
                }}
            >
                {strip.map((name, i) => (
                    <Box
                        key={`${i}-${name}`}
                        sx={{
                            height: slotSizePx,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            px: 1,
                            boxSizing: 'border-box',
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: 'clamp(1.15rem, 2.2vw, 1.75rem)',
                                fontWeight: 800,
                                textAlign: 'center',
                                color: '#1a1a1a',
                                lineHeight: 1.2,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                wordBreak: 'break-word',
                            }}
                        >
                            {name}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    )
}

export type SlotMachineHandle = {
    /** Start the spin animation; reels will stop with the given winner in the middle row (payline). */
    draw: (winner: string) => void
}

export type SlotMachineProps = {
    /** List of names to show when idle (random) and to use as pool when drawing a winner. */
    names: string[]
    /** Called when all reels have finished spinning. */
    onStopped?: () => void
    /** Slot cell size in px (default 140). */
    slotSizePx?: number
}

const SlotMachine = forwardRef<SlotMachineHandle, SlotMachineProps>(function SlotMachine(
    { names, onStopped, slotSizePx = REEL_SLOT_SIZE_PX },
    ref
) {
    const [phase, setPhase] = useState<'idle' | 'spinning'>('idle')
    const [strips, setStrips] = useState<{ strip: string[]; stopIndex: number }[]>(() => [
        buildIdleStrip(names),
        buildIdleStrip(names),
        buildIdleStrip(names),
    ])
    const onStoppedRef = useRef(onStopped)
    onStoppedRef.current = onStopped
    const stoppedCount = useRef(0)
    const hasSpunRef = useRef(false)
    const initialNamesRef = useRef<string[]>(names)

    // Only rebuild idle strips on initial mount (when names first become available) or when component remounts
    // Don't rebuild when names change after mount - that causes flickering
    React.useEffect(() => {
        // If we haven't spun yet and names just became available (were empty, now have values), initialize strips
        if (phase === 'idle' && !hasSpunRef.current && initialNamesRef.current.length === 0 && names.length > 0) {
            initialNamesRef.current = names
            setStrips([buildIdleStrip(names), buildIdleStrip(names), buildIdleStrip(names)])
        }
    }, [names, phase])

    const spinKeyRef = useRef(0)
    const draw = useCallback(
        (winner: string) => {
            const pool = names.length > 0 ? names : [winner]
            setStrips([
                buildReelStrip(winner, pool),
                buildReelStrip(winner, pool),
                buildReelStrip(winner, pool),
            ])
            stoppedCount.current = 0
            spinKeyRef.current += 1
            hasSpunRef.current = true
            setPhase('spinning')
        },
        [names]
    )

    useImperativeHandle(ref, () => ({ draw }), [draw])

    const handleReelStopped = useCallback(() => {
        stoppedCount.current += 1
        if (stoppedCount.current >= 3) {
            onStoppedRef.current?.()
        }
    }, [])

    const startSpinning = phase === 'spinning'
    const key = spinKeyRef.current

    return (
        <Box
            sx={{
                position: 'relative',
                display: 'flex',
                gap: 2,
                justifyContent: 'center',
                flexWrap: 'nowrap',
                mx: 'auto',
            }}
        >
            <Box sx={{ position: 'relative', display: 'flex', gap: 2 }}>
                <SingleReel
                    key={`${key}-0`}
                    strip={strips[0]!.strip}
                    stopIndex={strips[0]!.stopIndex}
                    durationMs={4000}
                    startSpinning={startSpinning}
                    onStopped={handleReelStopped}
                    slotSizePx={slotSizePx}
                />
                <SingleReel
                    key={`${key}-1`}
                    strip={strips[1]!.strip}
                    stopIndex={strips[1]!.stopIndex}
                    durationMs={4500}
                    startSpinning={startSpinning}
                    onStopped={handleReelStopped}
                    slotSizePx={slotSizePx}
                />
                <SingleReel
                    key={`${key}-2`}
                    strip={strips[2]!.strip}
                    stopIndex={strips[2]!.stopIndex}
                    durationMs={5000}
                    startSpinning={startSpinning}
                    onStopped={handleReelStopped}
                    slotSizePx={slotSizePx}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        top: slotSizePx,
                        left: 0,
                        right: 0,
                        height: slotSizePx,
                        border: '4px solid',
                        borderColor: 'error.main',
                        borderRadius: 2,
                        pointerEvents: 'none',
                        boxSizing: 'border-box',
                    }}
                />
            </Box>
        </Box>
    )
})

export default SlotMachine
