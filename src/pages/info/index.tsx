import React, {useCallback, useEffect, useState} from 'react'
import Layout from '@/src/components/Layout'
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Link as MuiLink,
    TextField,
    Typography,
} from '@mui/material'
import FacebookIcon from '@mui/icons-material/Facebook'
import MapIcon from '@mui/icons-material/Map'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CloseIcon from '@mui/icons-material/Close'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import {useAuth} from '@/src/contexts/AuthContext'
import usePlayerApi from '@/src/api/usePlayerApi'
import useBillApi from '@/src/api/useBillApi'
import {useToast} from '@/src/contexts/ToastContext'
import {generateBillPdf} from '@/src/utils/generateBillPdf'
import {normalizeBillIban, normalizeBillInstructionId} from '@/src/utils/billInputNormalize'
import {useTranslation} from 'react-i18next'

const cardSx = {
    width: '100%',
    boxSizing: 'border-box' as const,
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'divider',
    backgroundColor: 'background.paper',
    px: 2.5,
    py: 2,
}

const linkCardSx = {
    ...cardSx,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    textDecoration: 'none',
    color: 'inherit',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
    '&:hover': {
        backgroundColor: 'action.hover',
        borderColor: 'primary.main',
    },
}

function SectionTitle({children}: {children: React.ReactNode}) {
    return (
        <Typography
            variant="subtitle2"
            color="text.secondary"
            fontWeight={600}
            sx={{textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1}}
        >
            {children}
        </Typography>
    )
}

export default function InfoPage() {
    const {user} = useAuth()
    const {getPlayerCompetitions} = usePlayerApi()
    const {lookupBill} = useBillApi()
    const {showToast} = useToast()
    const {t} = useTranslation('info')
    const {t: tErr} = useTranslation('errors')
    const [isParticipant, setIsParticipant] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [iban, setIban] = useState('')
    const [instructionId, setInstructionId] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const checkParticipation = useCallback(async () => {
        if (!user?.activeCompetitionId) {
            setIsParticipant(false)
            return
        }
        try {
            const competitions = await getPlayerCompetitions()
            setIsParticipant(competitions.some((c) => c.id === user.activeCompetitionId))
        } catch {
            setIsParticipant(false)
        }
    }, [user?.activeCompetitionId, getPlayerCompetitions])

    useEffect(() => {
        checkParticipation()
    }, [checkParticipation])

    const handleSubmit = async () => {
        setError(null)

        const normalizedIban = normalizeBillIban(iban)
        const normalizedInstrId = normalizeBillInstructionId(instructionId)

        if (!normalizedIban) {
            setError(t('ibanRequired'))
            return
        }
        if (!normalizedInstrId) {
            setError(t('instructionRequired'))
            return
        }

        setLoading(true)
        try {
            const bill = await lookupBill(normalizedIban, normalizedInstrId)
            await generateBillPdf(bill)
            showToast(t('toastDownloaded'), 'success')
            setDialogOpen(false)
            setIban('')
            setInstructionId('')
        } catch (err) {
            const code =
                err instanceof Error && 'code' in err ? (err as Error & {code?: string}).code : undefined
            const fallback = err instanceof Error ? err.message : tErr('bill_lookup_failed')
            setError(code ? tErr(code, {defaultValue: fallback}) : fallback)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Layout>
            <Box sx={{width: '100%', maxWidth: '100%', px: 2, py: 3, boxSizing: 'border-box'}}>
                <Typography variant="h4" fontWeight="bold" textAlign="center">
                    {t('title')}
                </Typography>

                <Box sx={{mt: 3, display: 'flex', flexDirection: 'column', gap: 2}}>
                    {/* Map */}
                    <Box>
                        <SectionTitle>{t('mapSection')}</SectionTitle>
                        <Box
                            component="a"
                            href="https://www.google.com/maps/d/u/0/viewer?mid=1uxEagB1g3LfwP6U_4NL12TQelxV2cbg&ll=59.03964897449547%2C25.88895708498072&z=15"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={linkCardSx}
                        >
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                                <MapIcon color="primary" />
                                <Typography fontWeight={600} color="primary.main">
                                    {t('googleMaps')}
                                </Typography>
                            </Box>
                            <ChevronRightIcon sx={{color: 'primary.main', fontSize: 20}} />
                        </Box>
                    </Box>

                    {/* Organizers */}
                    <Box>
                        <SectionTitle>{t('organizers')}</SectionTitle>
                        <Box sx={cardSx}>
                            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.5}}>
                                <Box sx={{display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 0.5}}>
                                    <Typography variant="body1" fontWeight={500}>
                                        Arto Saar:
                                    </Typography>
                                    <MuiLink href="tel:+3725257373" color="primary" underline="hover">
                                        52 57373
                                    </MuiLink>
                                </Box>
                                <Box sx={{display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 0.5}}>
                                    <Typography variant="body1" fontWeight={500}>
                                        Anti Orgla:
                                    </Typography>
                                    <MuiLink href="tel:+37251994444" color="primary" underline="hover">
                                        51 994444
                                    </MuiLink>
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Metrix */}
                    <Box>
                        <SectionTitle>{t('resultsSection')}</SectionTitle>
                        <Box
                            component="a"
                            href="https://discgolfmetrix.com/3522494"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={linkCardSx}
                        >
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                                <EmojiEventsIcon color="primary" />
                                <Typography fontWeight={600} color="primary.main">
                                    {t('metrixLink')}
                                </Typography>
                            </Box>
                            <ChevronRightIcon sx={{color: 'primary.main', fontSize: 20}} />
                        </Box>
                    </Box>

                    {/* Facebook */}
                    <Box>
                        <SectionTitle>{t('socialSection')}</SectionTitle>
                        <Box
                            component="a"
                            href="https://www.facebook.com/events/1663196438386742"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={linkCardSx}
                        >
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                                <FacebookIcon color="primary" />
                                <Typography fontWeight={600} color="primary.main">
                                    {t('facebook')}
                                </Typography>
                            </Box>
                            <ChevronRightIcon sx={{color: 'primary.main', fontSize: 20}} />
                        </Box>
                    </Box>

                    {(isParticipant || user?.isAdmin) && (
                        <Box>
                            <SectionTitle>{t('invoiceSection')}</SectionTitle>
                            <Box
                                sx={{
                                    ...linkCardSx,
                                    cursor: 'pointer',
                                }}
                                onClick={() => {
                                    setError(null)
                                    setDialogOpen(true)
                                }}
                            >
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                                    <ReceiptLongIcon color="primary" />
                                    <Typography fontWeight={600} color="primary.main">
                                        {t('issueInvoice')}
                                    </Typography>
                                </Box>
                                <ChevronRightIcon sx={{color: 'primary.main', fontSize: 20}} />
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>

            <Dialog open={dialogOpen} onClose={() => !loading && setDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    {t('dialogTitle')}
                    <IconButton aria-label="close" onClick={() => setDialogOpen(false)} disabled={loading} sx={{ml: 1}}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                        {t('dialogBody')}
                    </Typography>
                    <TextField
                        label={t('ibanLabel')}
                        placeholder="EE..."
                        fullWidth
                        value={iban}
                        onChange={(e) => setIban(e.target.value)}
                        disabled={loading}
                    />
                    <TextField
                        label={t('instructionLabel')}
                        fullWidth
                        value={instructionId}
                        onChange={(e) => setInstructionId(e.target.value)}
                        disabled={loading}
                        sx={{mt: 2}}
                    />
                    {error && (
                        <Typography color="error" variant="body2" sx={{mt: 2}}>
                            {error}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{px: 3, pb: 2}}>
                    <Button onClick={() => setDialogOpen(false)} disabled={loading}>
                        {t('cancel')}
                    </Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                        {loading ? <CircularProgress size={20} /> : t('buildInvoice')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Layout>
    )
}
