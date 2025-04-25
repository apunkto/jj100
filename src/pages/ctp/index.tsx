import { useEffect, useState } from 'react'
import {
    Box,
    Container,
    CircularProgress,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Link as MuiLink,
} from '@mui/material'
import Layout from '@/src/components/Layout'
import Link from 'next/link'
import useCtpApi, { HoleEntity } from '@/src/api/useCtpApi'

export default function CtpListPage() {
    const [ctpHoles, setCtpHoles] = useState<HoleEntity[]>([])
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
            <Container maxWidth="md" sx={{ mt: 6 }}>
                <Typography variant="h4" fontWeight="bold" textAlign="center" gutterBottom>
                    CTP Rajad
                </Typography>

                {loading ? (
                    <Box display="flex" justifyContent="center" mt={4}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer
                        component={Paper}
                        sx={{
                            borderRadius: 1,
                            border: '1px solid #e0e0e0', // light gray border instead of shadow
                            boxShadow: 'none', // no shadow at all
                            mt: 4,
                        }}
                    >
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
                                        Korvi number
                                    </TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>

                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {ctpHoles.map((hole) => (
                                    <TableRow
                                        key={hole.id}
                                        hover
                                        sx={{
                                            transition: 'background 0.2s',
                                            '&:hover': {
                                                backgroundColor: 'action.hover',
                                            },
                                        }}
                                    >
                                        <TableCell>
                                            <Typography fontWeight="600">#{hole.number}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/ctp/${hole.number}`} passHref legacyBehavior>
                                                <MuiLink
                                                    underline="hover"
                                                    sx={{ fontWeight: '600', color: 'primary.main' }}
                                                >
                                                    Vaata
                                                </MuiLink>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Container>
        </Layout>
    )
}
