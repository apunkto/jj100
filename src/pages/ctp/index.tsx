import {useEffect, useState} from 'react'
import {Box, Chip, CircularProgress, Typography} from '@mui/material'
import Layout from '@/src/components/Layout'
import Link from 'next/link'
import useCtpApi, {HoleWithCtp} from '@/src/api/useCtpApi'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import {useAuth} from '@/src/contexts/AuthContext'

export default function CtpListPage() {
    const [ctpHoles, setCtpHoles] = useState<HoleWithCtp[]>([])
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()
    const { getCtpHoles } = useCtpApi()

    useEffect(() => {
        if (user?.activeCompetitionId !== undefined) {
            getCtpHoles()
                .then((data) => setCtpHoles(data))
                .catch((err) => console.error('Failed to fetch CTP holes:', err))
                .finally(() => setLoading(false))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.activeCompetitionId])

    return (
        <Layout>
            <Box sx={{ width: '100%', px: 2, py: 3, boxSizing: 'border-box' }}>
                <Typography variant="h4" fontWeight="bold" textAlign="center">
                    CTP Rajad
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 0.5 }}>
                    Vajuta rajal et CTP tulemust sisestada
                </Typography>

                {loading ? (
                    <Box display="flex" justifyContent="center" py={6}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {ctpHoles.map(({ hole, ctp }) => {
                            const topThrow = ctp?.[0]
                            return (
                                <Link
                                    key={hole.id}
                                    href={`/ctp/${hole.number}`}
                                    passHref
                                    legacyBehavior
                                >
                                    <Box
                                        component="a"
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            width: '100%',
                                            boxSizing: 'border-box',
                                            borderRadius: 2,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            backgroundColor: 'background.paper',
                                            px: 2,
                                            py: 1.5,
                                            minHeight: 56,
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.15s ease, border-color 0.15s ease',
                                            '&:hover': {
                                                backgroundColor: 'action.hover',
                                                borderColor: 'primary.main',
                                            },
                                            '&:active': {
                                                backgroundColor: 'action.selected',
                                            },
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                flexShrink: 0,
                                                minWidth: 64,
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                  width: 40,
                                                  height: 40,
                                                  borderRadius: '50%',
                                                  bgcolor: 'action.hover',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                }}
                                            >
                                                <Typography variant="body1" fontWeight={700} color="text.primary">
                                                    {hole.number}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box
                                            sx={{
                                                flex: 1,
                                                minWidth: 0,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                gap: 0.25,
                                                pl: 1.5,
                                            }}
                                        >
                                            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                                Korv {hole.number}
                                            </Typography>
                                            {topThrow ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap', minWidth: 0 }}>
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={600}
                                                        color="text.primary"
                                                        noWrap
                                                        sx={{ minWidth: 0 }}
                                                    >
                                                        {topThrow.player?.name ?? "Mängija"}
                                                    </Typography>
                                                    <Chip
                                                        size="small"
                                                        label={`${topThrow.distance_cm} cm`}
                                                        sx={{ flexShrink: 0, fontWeight: 600, height: 22 }}
                                                    />
                                                </Box>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                                    Tulemust pole
                                                </Typography>
                                            )}
                                        </Box>
                                        <Box
                                            sx={{
                                                flexShrink: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                color: 'primary.main',
                                                ml: 0.5,
                                            }}
                                        >
                                            <ChevronRightIcon fontSize="small" />
                                        </Box>
                                    </Box>
                                </Link>
                            )
                        })}
                    </Box>
                )}
            </Box>
        </Layout>
    )
}
