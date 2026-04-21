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
import {useTranslation} from "react-i18next"

export default function CheckInPage() {
    const { t } = useTranslation("pages")
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
            showToast(t("checkin.toastRegistered"), "success")
            setCheckedIn(true)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : ''
            const code = err instanceof AppError ? err.code : undefined
            if (message === "already_checked_in") {
                setCheckedIn(true)
                showToast(t("checkin.toastAlreadyIn"), "error")
            } else if (code === "not_competition_participant") {
                showToast(t("checkin.toastNotParticipant"), "error")
            } else {
                showToast(t("checkin.toastRegisterError"), "error")
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
            showToast(t("checkin.toastUnregistered"), "success")
        } catch (err) {
            showToast(t("checkin.toastUnregisterFailed"), "error")
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
                    {t("checkin.title")}
                </Typography>

                {configLoading ? (
                    <Box mt={4} display="flex" justifyContent="center">
                        <CircularProgress />
                    </Box>
                ) : !checkinEnabled ? (
                    <Box mt={4} display="flex" alignItems="center" justifyContent="center">
                        <LockIcon sx={{ fontSize: 24, color: "grey.500", mr: 1 }} />
                        <Typography variant="body1" color="textSecondary">
                            {t("checkin.notOpen")}
                        </Typography>
                    </Box>
                ) : checkedIn ? (
                    <Box mt={4}>
                        <Typography variant="h5" gutterBottom>
                            {t("checkin.registeredTitle")}
                        </Typography>

                        <Box display="flex" justifyContent="center" sx={{mt:2}}>
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={handleUnregister}
                                disabled={unregisterLoading}
                            >
                                {unregisterLoading ? <CircularProgress size={20} /> : t("checkin.unregister")}
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
                            {t("checkin.infoAlert")}
                        </Alert>

                        <Box display="flex" justifyContent="center" sx={{mt:4}}>
                            <Button variant="contained" color="primary" onClick={handleSubmit}>
                                {t("checkin.register")}
                            </Button>
                        </Box>
                    </Box>
                )}
            </Box>

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {t("checkin.dialogTitle")}
                    <IconButton aria-label="close" onClick={() => setConfirmOpen(false)} sx={{ ml: 1 }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ whiteSpace: "pre-line" }}>{t("checkin.dialogBody")}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>{t("checkin.cancel")}</Button>
                    <Button onClick={handleCheckIn} variant="contained" color="primary">
                        {t("checkin.confirm")}
                    </Button>
                </DialogActions>
            </Dialog>
        </Layout>
    )
}
