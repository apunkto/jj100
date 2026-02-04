import {useEffect, useMemo, useState} from "react"
import {useRouter} from "next/router"
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    List,
    ListItemButton,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material"
import OpenInNewIcon from "@mui/icons-material/OpenInNew"
import {supabase} from "@/src/lib/supabaseClient"
import Layout from "@/src/components/Layout"
import type {MetrixIdentity} from "@/src/api/useMetrixApi"
import useMetrixApi from "@/src/api/useMetrixApi"

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

    const normalizedEmail = email.trim().toLowerCase()
    const canSend = normalizedEmail.length > 3 && normalizedEmail.includes("@")
    const canVerify = pin.length === 6
    const { preLogin, registerFromMetrix } = useMetrixApi()

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
        setInfo("Saatsime PIN-koodi sinu e-mailile.")
    }

    const sendPin = async () => {
        setErrorMsg(null)
        setInfo(null)

        if (!canSend) {
            setErrorMsg("Palun sisesta korrektne e-mail.")
            return
        }

        if (cooldown > 0) return

        setLoading(true)
        setCooldown(8)

        try {
            const result = await preLogin(normalizedEmail)

            if (result.inDb) {
                // User exists in DB, send OTP directly
                await sendOtpAndGoToPin()
                return
            }

            // Not in DB: check Metrix identities
            const identities = result.identities || []

            if (identities.length === 0) {
                setErrorMsg("Selle e-mailiga kasutajat DiscGolfMetrixis ei leitud.")
                return
            }

            if (identities.length === 1) {
                // Single identity: register and send OTP
                await registerFromMetrix(normalizedEmail, identities[0].userId)
                await sendOtpAndGoToPin()
                return
            }

            // More than one: show picker; registration and OTP sent after user selects
            setIdentityPickerList(identities)
            setIdentityPickerOpen(true)
        } catch (e: any) {
            setErrorMsg(e?.message ?? "Midagi läks valesti.")
        } finally {
            setLoading(false)
        }
    }

    const onChooseIdentity = async (identity: MetrixIdentity) => {
        setIdentityPickerOpen(false)
        setLoading(true)
        setCooldown(8)
        try {
            // Register the chosen identity, then send OTP
            await registerFromMetrix(normalizedEmail, identity.userId)
            await sendOtpAndGoToPin()
        } catch (e: any) {
            setErrorMsg(e?.message ?? "Midagi läks valesti.")
        } finally {
            setLoading(false)
        }
    }

    const verifyPin = async (pinOverride?: string) => {
        const token = (pinOverride ?? pin).trim()

        setErrorMsg(null)
        setInfo(null)

        if (token.length !== 6) {
            setErrorMsg("Palun sisesta 6-kohaline PIN-kood.")
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
            <Box maxWidth={460} mx="auto" width="100%">
                <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={700} mb={0.5}>
                        Logi sisse
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        Sisesta oma <strong>dgmetrixi e-mail</strong> ja saadame sulle ühekordse PIN-koodi.
                    </Typography>

                    <Stack spacing={2}>
                        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
                        {info && <Alert severity="info">{info}</Alert>}

                        {stage === "email" ? (
                            <>
                                <TextField
                                    fullWidth
                                    label="E-mail"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                />

                                <Alert severity="info" sx={{ textAlign: "left" }}>
                                    <Typography variant="body2" sx={{ mb: 0.75 }}>
                                        Ei mäleta oma metrixi e-maili?
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
                                        Ava Metrixi konto seaded
                                    </Button>

                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                        Kui oled Metrixisse sisse logitud, näed seal oma meiliaadressi
                                    </Typography>

                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
                                        Või: logi metrixisse sisse ja klõpsa paremal üleval oma nimel →{" "}
                                        <strong>Seadistused</strong> → <strong>Meiliaadress</strong>
                                    </Typography>
                                </Alert>

                                <Button
                                    fullWidth
                                    size="large"
                                    variant="contained"
                                    disabled={!canSend || loading || cooldown > 0}
                                    onClick={sendPin}
                                >
                                    {loading ? <CircularProgress size={20} /> : cooldown > 0 ? `Oota ${cooldown}s...` : "Saada PIN"}
                                </Button>

                                <Typography variant="caption" color="text.secondary">
                                    PIN-kood kehtib lühikest aega. Kui kiri ei jõua kohale, kontrolli rämpsposti.
                                </Typography>
                            </>
                        ) : (
                            <>
                                <Typography variant="body2" color="text.secondary">
                                    Sisesta e-postile saadetud PIN:
                                </Typography>
                                <Typography mb={-0.5} fontWeight={600}>
                                    {normalizedEmail}
                                </Typography>

                                <TextField
                                    fullWidth
                                    label="PIN (6 numbrit)"
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
                                    {loading ? <CircularProgress size={20} /> : "Kinnita"}
                                </Button>

                                <Stack direction="row" spacing={1}>
                                    <Button fullWidth variant="outlined" disabled={loading} onClick={resendPin}>
                                        Saada uuesti
                                    </Button>
                                    <Button fullWidth variant="text" disabled={loading} onClick={changeEmail}>
                                        Muuda e-maili
                                    </Button>
                                </Stack>
                            </>
                        )}
                    </Stack>
                </Paper>

                <Dialog open={identityPickerOpen} onClose={() => setIdentityPickerOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Vali konto</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Selle e-maili all on DiscGolfMetrixis mitu profiili. Vali, millist soovid kasutada.
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
                                            ID: {identity.userId}
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
