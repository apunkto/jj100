import {alpha} from '@mui/material/styles'
import {Box, Typography} from '@mui/material'
import Image from 'next/image'
import {Hole} from "@/src/api/useCtpApi";
import {useMemo} from "react";

/** Shared color style for smaller labels (PAR / length). */
const labelOutlineTextSx = (theme: { palette: { primary: { main: string } } }) => ({
    color: theme.palette.primary.main,
})

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

    const cardImageSrc = useMemo(() => {
        const img = hole?.card_img
        if (img && img !== 'no_image') {
            const base = img.includes('.') ? img : `${img}.webp`
            return `/cards/${base}`
        }
        return '/cards/no_image.webp'
    }, [hole?.card_img])

    return (
        <Box
            sx={(theme) => ({
                position: 'relative',
                width: 'calc(100% - 6px)',
                maxWidth: `calc( ${maxWidth}px - 6px )`,
                mx: 'auto',
                borderRadius: '16px',
                overflow: 'hidden',
                backgroundColor: theme.palette.primary.main,
                backgroundClip: 'padding-box',
                aspectRatio: '5 / 7',
                outline: 'none',
                "@media print": {
                    width: "100%",
                    maxWidth: "100%",
                    height: "100%",
                    outline: "none",
                    boxShadow: "none",
                },
                containerType: 'inline-size',
                border: '3px solid #000',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'stretch',
                height: '100%',
            })}
        >

            {/* ───────── LEFT: logo, stats, rules ───────── */}
            <Box
                sx={(theme) => ({
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: theme.palette.primary.main,
                    borderRight: `2px solid ${alpha('#000', 0.22)}`,
                    pt: '2.8cqw',
                    pb: '2.6cqw',
                    gap: 0,
                })}
            >
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        px: '2.4cqw',
                        py: '2.6cqw',
                    }}
                >
                    <Image
                        src="/logo.webp"
                        alt="Logo"
                        width={500}
                        height={220}
                        style={{
                            width: '84%',
                            height: 'auto',
                            objectFit: 'contain',
                        }}
                    />
                </Box>

                <Box
                    sx={(theme) => ({
                        mx: '1.8cqw',
                        bgcolor: '#fff',
                        borderRadius: '1.2cqw',
                        transform: 'skewY(-4deg)',
                        transformOrigin: 'center',
                        py: '4.4cqw',
                        px: '2.2cqw',
                        color: theme.palette.primary.main,
                        zIndex: 1,
                    })}
                >
                    <Box
                        sx={{
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1.6cqw',
                            transform: 'skewY(4deg)',
                            transformOrigin: 'center',
                        }}
                    >
                        <Typography
                            component="div"
                            sx={(theme) => ({
                                ...labelOutlineTextSx(theme),
                                fontSize: number > 99 ? '18.5cqw' : '20.35cqw',
                                fontWeight: 900,
                                lineHeight: 0.95,
                                letterSpacing: '0.01em',
                                textAlign: 'center',
                            })}
                        >
                            {number}
                        </Typography>

                        <Typography
                            sx={(theme) => ({
                                ...labelOutlineTextSx(theme),
                                fontSize: '5.8cqw',
                                fontWeight: 800,
                                lineHeight: 1,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                whiteSpace: 'nowrap',
                            })}
                        >
                            PAR {par}
                        </Typography>

                        {length ? (
                            <Typography
                                sx={(theme) => ({
                                    ...labelOutlineTextSx(theme),
                                    fontSize: '6.1cqw',
                                    fontWeight: 800,
                                    lineHeight: 1,
                                    letterSpacing: '0.03em',
                                })}
                            >
                                {length}m
                            </Typography>
                        ) : null}
                    </Box>
                </Box>

                <Box
                    sx={{
                        flex: 1,
                        minHeight: 0,
                        pt: '5.3cqw',
                        pb: '2.2cqw',
                        px: '2.5cqw',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        color: '#fff',
                    }}
                >
                    <Typography
                        sx={{
                            whiteSpace: 'break-spaces',
                            fontSize: '2.7cqw',
                            fontWeight: 500,
                            lineHeight: 1.4,
                            color: alpha('#fff', 0.9),
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 8,
                        }}
                    >
                        {rules}
                    </Typography>
                </Box>
            </Box>

            {/* ───────── RIGHT: hole map / image ───────── */}
            <Box
                sx={{
                    flex: '0 0 auto',
                    alignSelf: 'stretch',
                    height: '100%',
                    /* Hole art is width:height 5:12 — column width follows full card height */
                    aspectRatio: '5 / 12',
                    width: 'auto',
                    minWidth: 0,
                    position: 'relative',
                }}
            >
                <Image
                    src={cardImageSrc}
                    alt={`Rada ${number}`}
                    fill
                    sizes="(max-width: 600px) 40vw, 280px"
                    priority={isPriority}
                    style={{
                        objectFit: 'contain',
                    }}
                />
            </Box>

        </Box>
    )
}
