import React, {forwardRef, useCallback, useImperativeHandle, useRef, useState} from 'react'
import {Box, Typography} from '@mui/material'

// Defaults tuned for large LED ~1200x800; actual size should be driven by container (narrow walls / P8).
export const SLOT_MACHINE_LAYOUT = {
    defaultSlotSizePx: 140,
    reelWidthMultiplier: 1.9,
    visibleRows: 3,
    /** Horizontal gap between reels; keep in sync with `reelGapPx` prop default */
    reelGapPx: 16,
} as const

const REEL_SLOT_SIZE_PX = SLOT_MACHINE_LAYOUT.defaultSlotSizePx
const REEL_WIDTH_MULTIPLIER = SLOT_MACHINE_LAYOUT.reelWidthMultiplier
const REEL_VISIBLE_ROWS = SLOT_MACHINE_LAYOUT.visibleRows
const REEL_SPIN_ITEMS_BEFORE_WINNER = 40
const REEL_EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'
/** Max wrapped lines per reel cell (ellipsis only if still longer). */
const REEL_NAME_MAX_LINES = 3

/** Thicker frame on coarse-pitch LED; keep in sync with `slotMachineReelOuterHeightPx`. */
function reelFrameBorderPx(slotSizePx: number): number {
    return Math.max(3, Math.round(slotSizePx / 38))
}

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

    React.useEffect(() => {
        onStoppedRef.current = onStopped
    }, [onStopped])

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

    const borderW = reelFrameBorderPx(slotSizePx)
    /** Border is drawn inside border-box; rows total 3×slot so outer height must include vertical borders or the bottom row clips. */
    const viewportContentHeight = slotSizePx * REEL_VISIBLE_ROWS
    const viewportOuterHeight = viewportContentHeight + 2 * borderW
    const stripHeight = strip.length * slotSizePx
    /** Wider leading so wrapped names read at P8 pitch */
    const lineHeightUnitless = 1.34
    const fontPx = Math.min(
        26,
        Math.max(10, Math.round(slotSizePx * 0.2)),
        Math.max(10, Math.floor((slotSizePx - 8) / (REEL_NAME_MAX_LINES * lineHeightUnitless)))
    )

    return (
        <Box
            sx={{
                overflow: 'hidden',
                height: viewportOuterHeight,
                width: slotSizePx * REEL_WIDTH_MULTIPLIER,
                minWidth: slotSizePx * 1.5,
                boxSizing: 'border-box',
                borderRadius: 2,
                background: 'linear-gradient(180deg, #ebe8e4 0%, #e0dcd6 100%)',
                border: `${borderW}px solid #5a5550`,
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
                            overflow: 'hidden',
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: `${fontPx}px`,
                                fontWeight: 800,
                                textAlign: 'center',
                                color: '#1a1a1a',
                                lineHeight: lineHeightUnitless,
                                display: '-webkit-box',
                                WebkitLineClamp: REEL_NAME_MAX_LINES,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere',
                                width: '100%',
                                maxHeight: slotSizePx - 4,
                                boxSizing: 'border-box',
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

/** Pixel height of one reel viewport (border-box outer), matching `SingleReel`. */
export function slotMachineReelOuterHeightPx(slotSizePx: number): number {
    const b = reelFrameBorderPx(slotSizePx)
    return slotSizePx * SLOT_MACHINE_LAYOUT.visibleRows + 2 * b
}

/** Largest slot row size so `slotMachineReelOuterHeightPx(s) <= containerHeight`. */
function maxSlotFitHeight(containerHeight: number): number {
    const h = Math.max(0, containerHeight)
    if (h < 24) return 12
    const absoluteMin = 12
    for (let cand = Math.min(200, Math.floor(h)); cand >= absoluteMin; cand--) {
        if (slotMachineReelOuterHeightPx(cand) <= h - 2) {
            return cand
        }
    }
    for (let cand = absoluteMin - 1; cand >= 1; cand--) {
        if (slotMachineReelOuterHeightPx(cand) <= h - 2) {
            return cand
        }
    }
    return absoluteMin
}

/** Fit three reels inside a box without overflow; also caps by height (three visible rows + borders). */
export function computeSlotSizePx(
    containerWidth: number,
    containerHeight: number,
    opts?: { max?: number; min?: number; reelGapPx?: number }
): number {
    const reelGapPx = opts?.reelGapPx ?? SLOT_MACHINE_LAYOUT.reelGapPx
    const max = opts?.max ?? SLOT_MACHINE_LAYOUT.defaultSlotSizePx
    const min = opts?.min ?? 12
    const w = Math.max(0, containerWidth)
    const h = Math.max(0, containerHeight)
    const byWidth = Math.floor((w - 2 * reelGapPx) / (3 * SLOT_MACHINE_LAYOUT.reelWidthMultiplier))
    const byHeight = maxSlotFitHeight(h)
    const candidates = [byWidth, byHeight].filter((v) => Number.isFinite(v) && v > 0)
    const fit = candidates.length > 0 ? Math.min(...candidates) : min
    return Math.min(max, Math.max(min, fit))
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
    /** Gap between reels in px; must match layout math when sizing from container width. */
    reelGapPx?: number
}

const SlotMachine = forwardRef<SlotMachineHandle, SlotMachineProps>(function SlotMachine(
    { names, onStopped, slotSizePx = REEL_SLOT_SIZE_PX, reelGapPx = SLOT_MACHINE_LAYOUT.reelGapPx },
    ref
) {
    const [phase, setPhase] = useState<'idle' | 'spinning'>('idle')
    const [strips, setStrips] = useState<{ strip: string[]; stopIndex: number }[]>(() => [
        buildIdleStrip(names),
        buildIdleStrip(names),
        buildIdleStrip(names),
    ])
    const onStoppedRef = useRef(onStopped)
    const stoppedCount = useRef(0)
    const hasSpunRef = useRef(false)
    const initialNamesRef = useRef<string[]>(names)

    // Only rebuild idle strips on initial mount (when names first become available) or when component remounts
    // Don't rebuild when names change after mount - that causes flickering
    React.useEffect(() => {
        onStoppedRef.current = onStopped
    }, [onStopped])

    React.useEffect(() => {
        // If we haven't spun yet and names just became available (were empty, now have values), initialize strips
        if (phase === 'idle' && !hasSpunRef.current && initialNamesRef.current.length === 0 && names.length > 0) {
            initialNamesRef.current = names
            setStrips([buildIdleStrip(names), buildIdleStrip(names), buildIdleStrip(names)])
        }
    }, [names, phase])

    const [spinKey, setSpinKey] = useState(0)
    const draw = useCallback(
        (winner: string) => {
            const pool = names.length > 0 ? names : [winner]
            setStrips([
                buildReelStrip(winner, pool),
                buildReelStrip(winner, pool),
                buildReelStrip(winner, pool),
            ])
            stoppedCount.current = 0
            setSpinKey((k) => k + 1)
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
    const key = spinKey
    const reelBorderW = reelFrameBorderPx(slotSizePx)
    /** Middle row starts after top border + one cell (same as SingleReel). */
    const paylineTop = reelBorderW + slotSizePx
    const paylineBorderPx = Math.max(4, Math.round(slotSizePx / 22))

    return (
        <Box
            sx={{
                position: 'relative',
                display: 'flex',
                gap: `${reelGapPx}px`,
                justifyContent: 'center',
                flexWrap: 'nowrap',
                mx: 'auto',
                maxWidth: '100%',
                maxHeight: '100%',
            }}
        >
            <Box sx={{ position: 'relative', display: 'flex', gap: `${reelGapPx}px`, maxWidth: '100%', maxHeight: '100%' }}>
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
                        top: paylineTop,
                        left: 0,
                        right: 0,
                        height: slotSizePx,
                        border: `${paylineBorderPx}px solid`,
                        borderColor: 'primary.main',
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
