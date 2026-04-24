import {useCallback, useEffect, useState} from 'react'
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Link as MuiLink,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material'
import {useAuth} from '@/src/contexts/AuthContext'
import usePlayerApi from '@/src/api/usePlayerApi'
import useAdminApi, {type PaceOfPlayPoolPlayer, type PaceOfPlayTopPool} from '@/src/api/useAdminApi'
import {useRouter} from 'next/router'
import AdminLayout from '@/src/components/AdminLayout'
import {decodeHtmlEntities} from '@/src/utils/textUtils'

export default function PaceOfPlayPage() {
    const {user, loading, refreshMe} = useAuth()
    const {setActiveCompetition} = usePlayerApi()
    const {getPaceOfPlayTop, getPaceOfPlayPoolPlayers} = useAdminApi()
    const router = useRouter()
    const competitionIdParam = router.query.competitionId

    const [rows, setRows] = useState<PaceOfPlayTopPool[]>([])
    const [fetching, setFetching] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [poolDialog, setPoolDialog] = useState<{
        poolNumber: number
        players: PaceOfPlayPoolPlayer[]
    } | null>(null)
    const [poolLoading, setPoolLoading] = useState(false)

    const isAdmin = user?.isAdmin ?? false
    const competitionId = user?.activeCompetitionId

    const load = useCallback(async () => {
        if (!competitionId) return
        setFetching(true)
        setError(null)
        try {
            const data = await getPaceOfPlayTop(competitionId)
            setRows(data)
        } catch (e) {
            console.error(e)
            setError(e instanceof Error ? e.message : 'Viga andmete laadimisel')
            setRows([])
        } finally {
            setFetching(false)
        }
    }, [competitionId, getPaceOfPlayTop])

    useEffect(() => {
        if (loading) return
        if (!user) return
        if (!isAdmin) {
            void router.replace('/')
            return
        }

        if (competitionIdParam && typeof competitionIdParam === 'string') {
            const compId = parseInt(competitionIdParam, 10)
            if (!Number.isNaN(compId) && user.activeCompetitionId !== compId) {
                void setActiveCompetition(compId)
                    .then(() => refreshMe())
                    .then(() => load())
                    .catch(() => load())
                return
            }
        }

        if (!user.activeCompetitionId) return

        void load()
    }, [loading, user, isAdmin, router, competitionIdParam, setActiveCompetition, refreshMe, load])

    const openPool = async (poolNumber: number) => {
        if (!competitionId) return
        setPoolDialog({poolNumber, players: []})
        setPoolLoading(true)
        try {
            const players = await getPaceOfPlayPoolPlayers(competitionId, poolNumber)
            setPoolDialog({poolNumber, players})
        } catch (e) {
            console.error(e)
            setPoolDialog(null)
        } finally {
            setPoolLoading(false)
        }
    }

    return (
        <AdminLayout>
            <Typography variant="h5" component="h1" sx={{mb: 2}} fontWeight={700}>
                Mängu tempo
            </Typography>

            <Box sx={{mb: 2, display: 'flex', gap: 1, alignItems: 'center'}}>
                <Button variant="outlined" onClick={() => void load()} disabled={fetching || !competitionId}>
                    Värskenda
                </Button>
                {fetching ? <CircularProgress size={22} /> : null}
            </Box>

            {error ? (
                <Typography color="error" sx={{mb: 2}}>
                    {error}
                </Typography>
            ) : null}

            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell>Grupp</TableCell>
                            <TableCell align="right">Rada</TableCell>
                            <TableCell align="right">Tühjad ees</TableCell>
                            <TableCell align="right">Taga</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((r, i) => (
                            <TableRow key={r.pool_number}>
                                <TableCell>{i + 1}</TableCell>
                                <TableCell>
                                    <MuiLink
                                        component="button"
                                        type="button"
                                        underline="hover"
                                        onClick={() => void openPool(r.pool_number)}
                                        sx={{cursor: 'pointer', fontWeight: 600}}
                                    >
                                        {r.pool_number}
                                    </MuiLink>
                                </TableCell>
                                <TableCell align="right">{r.current_hole}</TableCell>
                                <TableCell align="right">{r.holes_ahead_empty}</TableCell>
                                <TableCell align="right">{r.pools_waiting_total}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog
                open={!!poolDialog}
                onClose={() => setPoolDialog(null)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Grupp {poolDialog?.poolNumber}</DialogTitle>
                <DialogContent>
                    {poolLoading ? (
                        <Box display="flex" justifyContent="center" py={2}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Box component="ul" sx={{m: 0, pl: 2}}>
                            {(poolDialog?.players ?? []).map((p) => (
                                <Typography component="li" key={p.user_id} variant="body2" sx={{py: 0.25}}>
                                    {decodeHtmlEntities(p.name) || `Mängija ${p.user_id}`}
                                </Typography>
                            ))}
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </AdminLayout>
    )
}
