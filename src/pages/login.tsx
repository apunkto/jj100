import {useEffect, useMemo, useState} from "react"
import {useRouter} from "next/router"
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
    List,
    ListItemButton,
    Stack,
    TextField,
    Typography,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import OpenInNewIcon from "@mui/icons-material/OpenInNew"
import {supabase} from "@/src/lib/supabaseClient"
import Layout from "@/src/components/Layout"
import type {MetrixIdentity} from "@/src/api/useMetrixApi"
import useMetrixApi from "@/src/api/useMetrixApi"
import {Trans, useTranslation} from "react-i18next"

type Stage = "email" | "pin"

export default function LoginPage() {
    const router = useRouter()

    const nextPath = useMemo(() => {
        const next = router.query.next
        return typeof next === "string" && next.startsWith("/") ? next : "/"
    }, [router.query.next])

    const [stage, setStage] = useState<Stage>("email")
    const [email, setEmail] = useState("")
    const [pin, setPin] = useState("")

    const [loading, setLoading] = useState(false)
    const [info, setInfo] = useState<string | null>(null)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [cooldown, setCooldown] = useState(0)
    const [identityPickerOpen, setIdentityPickerOpen] = useState(false)
    const [identityPickerList, setIdentityPickerList] = useState<MetrixIdentity[]>([])
    const [metrixConsentOpen, setMetrixConsentOpen] = useState(false)

    const normalizedEmail = email.trim().toLowerCase()
    const canSend = normalizedEmail.length > 3 && normalizedEmail.includes("@")
    const canVerify = pin.length === 6
    const { preLogin, registerFromMetrix } = useMetrixApi()
    const { t } = useTranslation("login")

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) router.replace(nextPath)
        })
    }, [router, nextPath])

    useEffect(() => {
        if (cooldown <= 0) return
        const t = setInterval(() => setCooldown((c) => c - 1), 1000)
        return () => clearInterval(t)
    }, [cooldown])

    const sendOtpAndGoToPin = async () => {
        const { error } = await supabase.auth.signInWithOtp({
            email: normalizedEmail,
            options: { shouldCreateUser: true },
        })
        if (error) {
            setErrorMsg(error.message)
            return
        }
        setStage("pin")
        setInfo(t("pinSent"))
    }

    const sendPin = async (options?: { fetchMetrixIfNewUser?: boolean }) => {
        setErrorMsg(null)
        setInfo(null)

        if (!canSend) {
            setErrorMsg(t("invalidEmail"))
            return
        }

        if (cooldown > 0) return

        const fetchMetrix = options?.fetchMetrixIfNewUser === true
        const isResendFromPin = stage === "pin"

        if (fetchMetrix || isResendFromPin) {
            setCooldown(8)
        }

        setLoading(true)

        try {
            const result = await preLogin(normalizedEmail, {
                fetchMetrixIfNewUser: fetchMetrix,
            })

            if (result.inDb) {
                if (!fetchMetrix && !isResendFromPin) {
                    setCooldown(8)
                }
                await sendOtpAndGoToPin()
                return
            }

            if (result.needsMetrixConsent) {
                setMetrixConsentOpen(true)
                return
            }

            const identities = result.identities || []

            if (identities.length === 0) {
                setErrorMsg(t("metrixUserNotFound"))
                return
            }

            if (identities.length === 1) {
                await registerFromMetrix(normalizedEmail, identities[0].userId)
                await sendOtpAndGoToPin()
                return
            }

            setIdentityPickerList(identities)
            setIdentityPickerOpen(true)
        } catch (e: unknown) {
            setErrorMsg(e instanceof Error ? e.message : t("genericError"))
        } finally {
            setLoading(false)
        }
    }

    const onConfirmMetrixConsent = () => {
        setMetrixConsentOpen(false)
        void sendPin({ fetchMetrixIfNewUser: true })
    }

    const onChooseIdentity = async (identity: MetrixIdentity) => {
        setIdentityPickerOpen(false)
        setLoading(true)
        setCooldown(8)
        try {
            // Register the chosen identity, then send OTP
            await registerFromMetrix(normalizedEmail, identity.userId)
            await sendOtpAndGoToPin()
        } catch (e: unknown) {
            setErrorMsg(e instanceof Error ? e.message : t("genericError"))
        } finally {
            setLoading(false)
        }
    }

    const verifyPin = async (pinOverride?: string) => {
        const token = (pinOverride ?? pin).trim()

        setErrorMsg(null)
        setInfo(null)

        if (token.length !== 6) {
            setErrorMsg(t("pinLength"))
            return
        }

        setLoading(true)
        const { error } = await supabase.auth.verifyOtp({
            email: normalizedEmail,
            token,
            type: "email",
        })
        setLoading(false)

        if (error) {
            setErrorMsg(error.message)
            return
        }

        router.replace(nextPath)
    }

    const resendPin = async () => {
        await sendPin()
    }

    const changeEmail = () => {
        setStage("email")
        setPin("")
        setErrorMsg(null)
        setInfo(null)
    }

    return (
        <Layout minimal>
            <Box
                maxWidth={560}
                mx="auto"
                width="100%"
                sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}
            >
                <Typography variant="h5" fontWeight={700} mb={0.5}>
                    {t("title")}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                    <Trans i18nKey="login:intro" components={{ 1: <strong /> }} />
                </Typography>

                <Stack spacing={2}>
                    {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
                    {info && <Alert severity="info">{info}</Alert>}

                    {stage === "email" ? (
                            <>
                                <TextField
                                    fullWidth
                                    label={t("emailLabel")}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                />

                                <Alert severity="info" sx={{ textAlign: "left" }}>
                                    <Typography variant="body2" sx={{ mb: 0.75 }}>
                                        {t("metrixForgotTitle")}
                                    </Typography>

                                    <Button
                                        variant="text"
                                        size="small"
                                        startIcon={<OpenInNewIcon />}
                                        href="https://discgolfmetrix.com/?u=account_edit"
                                        target="_blank"
                                        rel="noreferrer"
                                        sx={{ px: 0, textTransform: "none", alignSelf: "flex-start" }}
                                    >
                                        {t("metrixOpenSettings")}
                                    </Button>

                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                        {t("metrixHint1")}
                                    </Typography>

                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
                                        <Trans i18nKey="login:metrixHint2" components={{ 1: <strong /> }} />
                                    </Typography>
                                </Alert>

                                <Button
                                    fullWidth
                                    size="large"
                                    variant="contained"
                                    disabled={!canSend || loading || cooldown > 0}
                                    onClick={() => void sendPin()}
                                >
                                    {loading ? (
                                        <CircularProgress size={20} />
                                    ) : cooldown > 0 ? (
                                        t("waitSeconds", { seconds: cooldown })
                                    ) : (
                                        t("sendPin")
                                    )}
                                </Button>

                                <Typography variant="caption" color="text.secondary">
                                    {t("pinExpiryHint")}
                                </Typography>
                            </>
                        ) : (
                            <>
                                <Typography variant="body2" color="text.secondary">
                                    {t("enterPin")}
                                </Typography>
                                <Typography mb={-0.5} fontWeight={600}>
                                    {normalizedEmail}
                                </Typography>

                                <TextField
                                    fullWidth
                                    label={t("pinLabel")}
                                    value={pin}
                                    onChange={(e) => {
                                        const next = e.target.value.replace(/\D/g, "").slice(0, 6)
                                        setPin(next)

                                        // ✅ auto-submit when 6 digits entered
                                        if (next.length === 6 && !loading) {
                                            void verifyPin(next)
                                        }
                                    }}
                                    inputProps={{ inputMode: "numeric" }}
                                    autoComplete="one-time-code"
                                    autoFocus
                                />

                                <Button
                                    fullWidth
                                    size="large"
                                    variant="contained"
                                    disabled={!canVerify || loading}
                                    onClick={() => verifyPin()}
                                >
                                    {loading ? <CircularProgress size={20} /> : t("confirm")}
                                </Button>

                                <Stack direction="row" spacing={1}>
                                    <Button fullWidth variant="outlined" disabled={loading} onClick={resendPin}>
                                        {t("resend")}
                                    </Button>
                                    <Button fullWidth variant="text" disabled={loading} onClick={changeEmail}>
                                        {t("changeEmail")}
                                    </Button>
                                </Stack>
                            </>
                    )}
                </Stack>

                <Dialog
                    open={metrixConsentOpen}
                    onClose={() => !loading && setMetrixConsentOpen(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>{t("metrixDialogTitle")}</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            {t("metrixConsent1")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            {t("metrixConsent2")}
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setMetrixConsentOpen(false)} disabled={loading}>
                            {t("cancel")}
                        </Button>
                        <Button variant="contained" onClick={onConfirmMetrixConsent} disabled={loading}>
                            {t("agreeContinue")}
                        </Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={identityPickerOpen} onClose={() => setIdentityPickerOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {t("chooseAccount")}
                        <IconButton aria-label="close" onClick={() => setIdentityPickerOpen(false)} sx={{ ml: 1 }}>
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {t("multipleProfiles")}
                        </Typography>
                        <List>
                            {identityPickerList.map((identity) => (
                                <ListItemButton
                                    key={identity.userId}
                                    onClick={() => onChooseIdentity(identity)}
                                    sx={{ borderRadius: 1 }}
                                >
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <Typography fontWeight={600}>{identity.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {t("idLabel", { id: identity.userId })}
                                        </Typography>
                                    </Stack>
                                </ListItemButton>
                            ))}
                        </List>
                    </DialogContent>
                </Dialog>
            </Box>
        </Layout>
    )
}
