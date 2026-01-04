import {alpha, darken, lighten} from '@mui/material/styles'
import {Box, Typography} from '@mui/material'
import Image from 'next/image'
import {Hole} from "@/src/api/useCtpApi";
import {useMemo} from "react";


type Props = {
    number: number
    isPriority?: boolean
    hole?: Hole
    maxWidth: number
}

export default function HoleCard({number, isPriority, hole, maxWidth}: Props) {
    const par = hole?.par ?? 3;
    const length = hole?.length;
    const rules = hole?.rules || "Erireeglid puuduvad";

    const imageNumber = useMemo(() => {
        if ([1, 2, 3].includes(number)) return number;
        return (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3; // 1..3
    }, [number]);

    return (
        <Box
            sx={(theme) => {
                const p = theme.palette.primary.main
                const base1 = darken(p, 0.55)
                const base2 = darken(p, 0.72)
                const hi = lighten(p, 0.62)

                return {
                    position: 'relative',
                    width: '100%',
                    maxWidth: `${maxWidth}px`,
                    mx: 'auto',
                    borderRadius: '6% / 4.3%',
                    overflow: 'hidden',
                    aspectRatio: '5 / 7',
                    outline: `1px solid ${alpha('#000', 0.08)}`,
                    "@media print": {
                        width: "100%",
                        maxWidth: "100%",
                        height: "100%",       // ✅ fill 266mm wrapper height
                        outline: "none",
                    },
                    containerType: 'inline-size',
                    containerName: 'card',

                    /* tokens */
                    '--pad': '3cqw',
                    '--badge': '22cqw',
                    '--gutter': '7.5cqw',
                    '--inner': '3cqw',

                    background: `
  repeating-linear-gradient(45deg,
    ${alpha('#fff', 0.06)} 0px,
    ${alpha('#fff', 0.06)} 4px,
    ${alpha('#000', 0.08)} 4px,
    ${alpha('#000', 0.08)} 8px
  ),
  repeating-linear-gradient(-45deg,
    ${alpha('#fff', 0.04)} 0px,
    ${alpha('#fff', 0.04)} 4px,
    ${alpha('#000', 0.06)} 4px,
    ${alpha('#000', 0.06)} 8px
  ),
  radial-gradient(120% 70% at 50% 0%,
    ${alpha('#fff', 0.16)} 0%,
    ${alpha('#fff', 0.00)} 60%
  ),
  linear-gradient(180deg,
    ${darken(theme.palette.primary.main, 0.30)} 0%,
    ${darken(theme.palette.primary.main, 0.72)} 100%
  )
`,
                }
            }}
        >
            {/* ───────────────── TOP BADGES ───────────────── */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 'var(--pad)',
                    left: 'var(--pad)',
                    right: 'var(--pad)',
                    zIndex: 5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pointerEvents: 'none',
                }}
            >
                {/* Hole number */}
                <Box
                    sx={(theme) => ({
                        width: 'var(--badge)',
                        aspectRatio: '1 / 1',
                        borderRadius: '50%',
                        backgroundColor: '#fff',
                        display: 'grid',
                        placeItems: 'center',
                        boxShadow: `0 6px 14px ${alpha('#000', 0.12)}`,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                    })}
                >
                    <Typography
                        sx={{
                            fontSize: 'calc(var(--badge) * 0.49)',
                            fontWeight: 800,
                            lineHeight: 1,
                        }}
                    >
                        {number}
                    </Typography>
                </Box>

                {/* PAR circle */}
                <Box
                    sx={(theme) => ({
                        width: 'var(--badge)',
                        aspectRatio: '1 / 1',
                        borderRadius: '50%',
                        backgroundColor: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 6px 14px ${alpha('#000', 0.12)}`,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                        gap: 'calc(var(--badge) * 0.03)',
                    })}
                >
                    <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'end'}}>
                        {length ? (
                            <Typography
                                sx={{
                                    fontSize: 'calc(var(--badge) * 0.2)',
                                    fontWeight: 700,
                                    lineHeight: 1,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {length}m
                            </Typography>
                        ) : (
                            <Box sx={{height: 'calc(var(--badge) * 0.2)'}}/>
                        )}

                        <Typography
                            sx={{
                                fontSize: 'calc(var(--badge) * 0.23)',
                                fontWeight: 700,
                                lineHeight: 1,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            PAR {par}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* ───────────────── WHITE CARD WITH IMAGE ───────────────── */}
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 2,
                    px: 'var(--gutter)',
                    pt: 'var(--gutter)',
                    pb: 'var(--gutter)',
                    display: 'flex',
                }}
            >
                <Box
                    sx={(theme) => ({
                        width: '100%',
                        height: '100%',
                        borderRadius: '6% / 4.8%',
                        overflow: 'hidden',
                        backgroundColor: '#fff',
                        boxShadow: `0 12px 24px ${alpha('#000', 0.14)}`,
                        display: 'flex',
                        flexDirection: 'column',
                    })}
                >
                    {/* ✅ IMAGE AREA: full width, fixed ratio 400/425 */}
                    <Box
                        sx={{
                            width: '100%',
                            aspectRatio: '400 / 425',
                            position: 'relative',
                            flexShrink: 0,
                            pt: '7%', // your top padding
                        }}
                    >
                        <Image
                            src={`/cards/${imageNumber}.webp?v=5`}
                            alt={`Rada ${number}`}
                            fill
                            sizes="(max-width: 600px) 80vw, 400px"
                            priority={isPriority}
                            style={{objectFit: 'contain'}}
                        />
                    </Box>

                    {/* ✅ INFO AREA: takes remaining height */}
                    <Box
                        sx={(theme) => ({
                            flex: 1,
                            minHeight: 0,
                            mx: 'var(--inner)',
                            my: 'calc(var(--inner) * 0.8)',
                            borderRadius: '3cqw',
                            px: '3.2cqw',
                            py: '2.2cqw',
                            backgroundColor: alpha(lighten(theme.palette.primary.main, 0.68), 0.9),
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
                            boxShadow: `0 10px 18px ${alpha('#000', 0.1)}`,
                            overflow: 'hidden',
                            position: 'relative',
                        })}
                    >
                        {/* 👇 keeps text from going under the bottom-right logo badge (except first line) */}
                        <Typography
                            sx={{
                                whiteSpace: 'break-spaces',
                                fontSize: '3.0cqw',
                                fontWeight: 500,
                                lineHeight: 1.2,
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: 4,

                                /* reserve space on the right only after the first line */
                                '&::after': {
                                    content: '""',
                                    float: 'right',
                                    width: 'var(--badge)',
                                    height: '100%',
                                },
                                '&::before': {
                                    content: '""',
                                    float: 'right',
                                    width: 0,
                                    height: '1.2em', // ≈ first line height
                                },
                            }}
                        >
                            {rules}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* ───────────────── BOTTOM BADGE ───────────────── */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: 'var(--pad)',
                    left: 'var(--pad)',
                    right: 'var(--pad)',
                    zIndex: 6,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    pointerEvents: 'none',
                }}
            >
                <Box
                    sx={(theme) => ({
                        width: 'var(--badge)',
                        aspectRatio: '1 / 1',
                        borderRadius: '50%',
                        bgcolor: theme.palette.primary.main,
                        display: 'grid',
                        placeItems: 'center',
                        boxShadow: `0 10px 18px ${alpha('#000', 0.18)}`,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                        overflow: 'hidden',
                    })}
                >
                    {/* non-square logo: do NOT use fill; constrain with max sizes */}
                    <Image
                        src="/logo.webp"
                        alt="Logo"
                        width={400}
                        height={400}
                        style={{
                            maxWidth: '85%',
                            maxHeight: '85%',
                            width: 'auto',
                            height: 'auto',
                            objectFit: 'contain',
                        }}
                    />
                </Box>
            </Box>
        </Box>
    )
}
