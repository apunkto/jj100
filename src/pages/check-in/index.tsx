import React, {useEffect, useState} from "react"
import {AppError} from "@/src/utils/AppError"
import LockIcon from "@mui/icons-material/Lock"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Typography,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import Layout from "@/src/components/Layout"
import {useCheckinApi} from "@/src/api/useCheckinApi"
import {useToast} from "@/src/contexts/ToastContext"
import useConfigApi from "@/src/api/useConfigApi"
import {useAuth} from "@/src/contexts/AuthContext"

export default function CheckInPage() {
    const { checkIn, getMyCheckin, unregisterMe } = useCheckinApi()
    const { showToast } = useToast()
    const { isCheckinEnabled } = useConfigApi()
    const { user } = useAuth()

    const [confirmOpen, setConfirmOpen] = useState(false)
    const [checkedIn, setCheckedIn] = useState(false)

    const [checkinEnabled, setCheckinEnabled] = useState(false)
    const [configLoading, setConfigLoading] = useState(true)

    const [unregisterLoading, setUnregisterLoading] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.activeCompetitionId) return
            
            try {
                const enabled = await isCheckinEnabled(user.activeCompetitionId)
                setCheckinEnabled(enabled)

                // Only fetch check-in status if check-in is enabled
                if (enabled) {
                    const me = await getMyCheckin()
                    setCheckedIn(me.checkedIn)
                } else {
                    setCheckedIn(false)
                }
            } catch (err) {
                console.error("Failed to fetch config or my check-in status", err)
            } finally {
                setConfigLoading(false)
            }
        }

        if (user?.activeCompetitionId !== undefined) {
            fetchData()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.activeCompetitionId])

    const handleCheckIn = async () => {
        try {
            await checkIn()
            showToast("Registreeritud!", "success")
            setCheckedIn(true)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : ''
            const code = err instanceof AppError ? err.code : undefined
            if (message === "already_checked_in") {
                setCheckedIn(true)
                showToast("Mängija on juba loosimängu registreeritud!", "error")
            } else if (code === "not_competition_participant") {
                showToast("Sa ei osale võistlusel!", "error")
            } else {
                showToast("Registreerimisel tekkis viga!", "error")
            }
        } finally {
            setConfirmOpen(false)
        }
    }

    const handleUnregister = async () => {
        setUnregisterLoading(true)
        try {
            await unregisterMe()
            setCheckedIn(false)
            showToast("Registreering tühistatud!", "success")
        } catch (err) {
            showToast("Registreeringu tühistamine ebaõnnestus!", "error")
        } finally {
            setUnregisterLoading(false)
        }
    }

    const handleSubmit = () => {
        setConfirmOpen(true)
    }

    return (
        <Layout>
            <Box sx={{ width: '100%', maxWidth: '100%', px: 2, py: 3, boxSizing: 'border-box' }}>

            <Typography variant="h4" fontWeight="bold" textAlign="center">
                    Loosimängu registreerimine
                </Typography>

                {configLoading ? (
                    <Box mt={4} display="flex" justifyContent="center">
                        <CircularProgress />
                    </Box>
                ) : !checkinEnabled ? (
                    <Box mt={4} display="flex" alignItems="center" justifyContent="center">
                        <LockIcon sx={{ fontSize: 24, color: "grey.500", mr: 1 }} />
                        <Typography variant="body1" color="textSecondary">
                            Registreerumine ei ole veel avatud!
                        </Typography>
                    </Box>
                ) : checkedIn ? (
                    <Box mt={4}>
                        <Typography variant="h5" gutterBottom>
                            Oled loosimisse registreeritud!
                        </Typography>

                        <Box display="flex" justifyContent="center" sx={{mt:2}}>
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={handleUnregister}
                                disabled={unregisterLoading}
                            >
                                {unregisterLoading ? <CircularProgress size={20} /> : "Tühista registreering"}
                            </Button>
                        </Box>
                    </Box>
                ) : (
                    <Box mt={6}>
                        <Alert
                            severity="info"
                            icon={<InfoOutlinedIcon />}
                            sx={{
                                mb: 2,
                                textAlign: "left",
                                backgroundColor: "primary.light",
                                color: "primary.contrastText",
                                "& .MuiAlert-icon": { color: "primary.contrastText" },
                            }}
                        >
                            Auhinna saamiseks peab mängija olema loosimise hetkel kohal!
                        </Alert>

                        <Box display="flex" justifyContent="center" sx={{mt:4}}>
                            <Button variant="contained" color="primary" onClick={handleSubmit}>
                                Registreeri
                            </Button>
                        </Box>
                    </Box>
                )}
            </Box>

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    Registreeru loosimängu?
                    <IconButton aria-label="close" onClick={() => setConfirmOpen(false)} sx={{ ml: 1 }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Kas oled kindel, et soovid end loosimängu registreerida?
                        <br />
                        <br />
                        Kinnitan, et olen loosimise ajal kohal!
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>Katkesta</Button>
                    <Button onClick={handleCheckIn} variant="contained" color="primary">
                        Kinnita
                    </Button>
                </DialogActions>
            </Dialog>
        </Layout>
    )
}
