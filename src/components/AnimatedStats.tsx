import { useEffect, useState } from 'react'
import { Box, Typography } from '@mui/material'

export default function StatBox({
                                    label,
                                    value,
                                    sub,
                                    bg,
                                    hasTopRedBorder = false,
                                    animationKey,
                                }: {
    label: string
    value: number
    sub: string
    bg: string
    hasTopRedBorder?: boolean
    animationKey?: string | number
}) {
    const [isVisible, setIsVisible] = useState(true)
    const [displayedValue, setDisplayedValue] = useState(value)
    const [displayedSub, setDisplayedSub] = useState(sub)

    useEffect(() => {
        setIsVisible(false)

        const timeout = setTimeout(() => {
            setDisplayedValue(value)
            setDisplayedSub(sub)
            setIsVisible(true)
        }, 300) // match transition duration

        return () => clearTimeout(timeout)
    }, [animationKey])

    return (
        <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight="bold" mb={2}>
                {label}
            </Typography>
            <Box
                sx={{
                    width: '30vh',
                    height: '30vh',
                    borderRadius: '50%',
                    backgroundColor: bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    opacity: isVisible ? 1 : 0,
                    transition: 'opacity 0.3s ease-in-out',
                }}
            >
                <Typography
                    component="span"
                    sx={{
                        position: 'relative',
                        fontSize: label.includes('Viskeid')
                            ? 'clamp(2rem, 3.5vw, 4rem)'
                            : 'clamp(2rem, 5vw, 64rem)',
                        fontWeight: 'bold',
                        color: '#000',
                        '&::before': hasTopRedBorder
                            ? {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '6px',
                                backgroundColor: 'red',
                            }
                            : undefined,
                    }}
                >
                    {displayedValue}
                </Typography>
            </Box>
            <Typography variant="h6" mt={2} fontSize={30}>
                {displayedSub}
            </Typography>
        </Box>
    )
}
