import React, {useEffect, useState} from "react"
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
    Typography,
} from "@mui/material"
import Layout from "@/src/components/Layout"
import {useCheckinApi} from "@/src/api/useCheckinApi"
import {useToast} from "@/src/contexts/ToastContext"
import useConfigApi from "@/src/api/useConfigApi"

export default function CheckInPage() {
    const { checkIn, getMyCheckin, unregisterMe } = useCheckinApi()
    const { showToast } = useToast()
    const { isCheckinEnabled } = useConfigApi()

    const [confirmOpen, setConfirmOpen] = useState(false)
    const [checkedIn, setCheckedIn] = useState(false)

    const [checkinEnabled, setCheckinEnabled] = useState(false)
    const [configLoading, setConfigLoading] = useState(true)

    const [unregisterLoading, setUnregisterLoading] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const enabled = await isCheckinEnabled()
                setCheckinEnabled(enabled)

                // ✅ new: fetch current user's check-in status
                const me = await getMyCheckin()
                setCheckedIn(me.checkedIn)
            } catch (err) {
                console.error("Failed to fetch config or my check-in status", err)
            } finally {
                setConfigLoading(false)
            }
        }

        fetchData()
    }, [isCheckinEnabled, getMyCheckin])

    const handleCheckIn = async () => {
        try {
            await checkIn()
            showToast("Registreeritud!", "success")
            setCheckedIn(true)
        } catch (err: any) {
            if (err?.message === "already_checked_in") {
                setCheckedIn(true)
                showToast("Mängija on juba loosimängu registreeritud!", "error")
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
            <Box textAlign="center" mt={2}>
                <Typography variant="h4" gutterBottom>
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

                        <Button
                            style={{marginTop: "1rem"}}
                            variant="outlined"
                            color="error"
                            onClick={handleUnregister}
                            disabled={unregisterLoading}
                        >
                            {unregisterLoading ? <CircularProgress size={20} /> : "Tühista registreering"}
                        </Button>
                    </Box>
                ) : (
                    <Box mt={4}>
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

                        <Button variant="contained" color="primary" onClick={handleSubmit}>
                            Registreeri
                        </Button>
                    </Box>
                )}
            </Box>

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>Registreeru loosimängu?</DialogTitle>
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
