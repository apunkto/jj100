import {useEffect, useState} from 'react'
import {Box, CircularProgress, Link as MuiLink, Typography} from '@mui/material'
import Layout from '@/src/components/Layout'
import Link from 'next/link'
import useCtpApi, {HoleResult} from '@/src/api/useCtpApi'
import EditIcon from '@mui/icons-material/Edit';

export default function CtpListPage() {
    const [ctpHoles, setCtpHoles] = useState<HoleResult[]>([])
    const [loading, setLoading] = useState(true)

    const { getCtpHoles } = useCtpApi()

    useEffect(() => {
        getCtpHoles()
            .then((data) => setCtpHoles(data))
            .catch((err) => console.error('Failed to fetch CTP holes:', err))
            .finally(() => setLoading(false))
    }, [getCtpHoles])

    return (
        <Layout>
            <Box display="flex"  flexDirection="column" alignItems="center">
                <Typography variant="h4" fontWeight="bold">
                CTP Rajad
                </Typography>

                {loading ? (
                    <Box display="flex" justifyContent="center" mt={2}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box mt={2} width="100%">
                        <Box display="flex" py={1} borderBottom={2} borderColor="primary.main" fontWeight="bold">
                            <Typography sx={{ flexBasis: '15%' }} fontSize="16px" color="primary.main">
                                Korv
                            </Typography>
                            <Typography sx={{ flexBasis: '75%', textAlign: 'center' }} fontSize="16px" color="primary.main">
                                CTP
                            </Typography>
                            <Typography sx={{ flexBasis: '10%', textAlign: 'right' }} fontSize="16px" color="primary.main">
                            </Typography>
                        </Box>

                        {ctpHoles.map(({ hole, ctp }) => {
                            const topThrow = ctp?.[0]

                            return (
                                <Box
                                    key={hole.id}
                                    display="flex"
                                    alignItems="center"
                                    py={1}
                                    borderBottom={1}
                                    borderColor="grey.300"
                                    sx={{
                                        transition: 'background 0.2s',
                                        '&:hover': {
                                            backgroundColor: 'action.hover',
                                        },
                                    }}
                                >
                                    <Typography sx={{ flexBasis: '15%' }} fontWeight="600">
                                        {hole.number}
                                    </Typography>

                                    <Typography sx={{ flexBasis: '75%', textAlign: 'center' }}>
                                        {topThrow
                                            ? `${topThrow.player.name} (${topThrow.distance_cm} cm)`
                                            : '—'}
                                    </Typography>

                                    <Typography sx={{ flexBasis: '10%', textAlign: 'right' }}>
                                        <Link href={`/ctp/${hole.number}`} passHref legacyBehavior>
                                            <MuiLink
                                                underline="none"
                                                sx={{ color: 'primary.main', display: 'inline-flex', alignItems: 'center' }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </MuiLink>
                                        </Link>
                                    </Typography>

                                </Box>
                            )
                        })}
                    </Box>
                )}
            </Box>
        </Layout>
    )
}
