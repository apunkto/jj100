import React, {useEffect, useMemo, useState} from "react"
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    TextField,
    Typography
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import Layout from "@/src/components/Layout"
import Link from "next/link"
import useCtpApi, {CtpEntry, Hole} from "@/src/api/useCtpApi"
import {useToast} from "@/src/contexts/ToastContext"
import useConfigApi from "@/src/api/useConfigApi"
import LockIcon from "@mui/icons-material/Lock"
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"
import {formatEstonianDateTime} from "@/src/components/Util"
import {useAuth} from "@/src/contexts/AuthContext"

export async function getStaticPaths() {
    const paths = Array.from({ length: 100 }, (_, i) => ({
        params: { hole: (i + 1).toString() },
    }))
    return {
        paths,
        fallback: false,
    }
}

export async function getStaticProps({ params }: { params: { hole: string } }) {
    return {
        props: {
            hole: params.hole,
        },
    }
}

const cardSx = {
    width: "100%",
    boxSizing: "border-box" as const,
    borderRadius: 2,
    border: "1px solid",
    borderColor: "divider",
    backgroundColor: "background.paper",
    px: 2.5,
    py: 2,
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <Typography
            variant="subtitle2"
            color="text.secondary"
            fontWeight={600}
            sx={{ textTransform: "uppercase", letterSpacing: "0.06em", mb: 1 }}
        >
            {children}
        </Typography>
    )
}

export default function CtpHolePage({ hole }: { hole: string }) {
    const { getHole, getCtpByHoleNumber, submitCtp } = useCtpApi()
    const { isCtpEnabled } = useConfigApi()
    const { showToast } = useToast()
    const { user, loading: authLoading } = useAuth()

    const [holeInfo, setHoleInfo] = useState<Hole | null>(null)
    const [ctp, setCtp] = useState<CtpEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [distance, setDistance] = useState<number | "">("")
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [ctpEnabled, setCtpEnabled] = useState(true)

    const bestThrow = ctp[0] ?? null
    const isValidDistance = distance !== "" && Number(distance) > 0
    const isBetterThrow = !bestThrow || (isValidDistance && Number(distance) < Number(bestThrow.distance_cm))
    const showError = Boolean(bestThrow && isValidDistance && Number(distance) >= Number(bestThrow.distance_cm))

    const noCtpGame = holeInfo && !holeInfo.is_ctp

    const hasSubmitted = useMemo(() => {
        if (!user?.playerId) return false
        return Boolean(ctp.some((r) => r.player_id === user.playerId))
    }, [user?.playerId, ctp])

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.activeCompetitionId) return
            const holeNum = parseInt(hole as string, 10)
            try {
                const enabled = await isCtpEnabled(user.activeCompetitionId)
                setCtpEnabled(enabled)
                const holeData = await getHole(holeNum, user.activeCompetitionId)
                if (holeData) {
                    setHoleInfo(holeData)
                    if (enabled) {
                        const ctpResult = await getCtpByHoleNumber(holeNum, user.activeCompetitionId)
                        setCtp(ctpResult)
                    } else {
                        setCtp([])
                    }
                } else {
                    setHoleInfo(null)
                    setCtp([])
                }
            } catch (err) {
                console.error("Failed to fetch hole or config:", err)
                setHoleInfo(null)
                setCtp([])
            } finally {
                setLoading(false)
            }
        }
        if (user?.activeCompetitionId !== undefined) {
            fetchData()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hole, user?.activeCompetitionId])

    const handleSubmit = () => setConfirmOpen(true)

    const handleConfirmSubmit = async () => {
        if (!holeInfo || !isValidDistance || !isBetterThrow || !user?.activeCompetitionId) return
        try {
            await submitCtp(holeInfo.id, Number(distance))
            const ctpResult = await getCtpByHoleNumber(holeInfo.number, user.activeCompetitionId)
            setCtp(ctpResult)
            setDistance("")
            showToast("CTP tulemus sisestatud!", "success")
        } catch (err: unknown) {
            const e = err as { code?: string; message?: string }
            const msg =
                e?.code === "not_competition_participant"
                    ? "Sa ei osale võistlusel!"
                    : (e?.message ?? "CTP sisestamine ebaõnnestus!")
            showToast(msg, "error")
        } finally {
            setConfirmOpen(false)
        }
    }

    return (
        <Layout>
            <Box sx={{ width: "100%", maxWidth: "100%", px: 2, py: 3, boxSizing: "border-box" }}>
                <Box sx={{ mb: 2 }}>
                    <Link href="/ctp" passHref legacyBehavior>
                        <Box
                            component="a"
                            sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 0.5,
                                color: "primary.main",
                                textDecoration: "none",
                                fontWeight: 500,
                                fontSize: "0.875rem",
                                "&:hover": { textDecoration: "underline" },
                            }}
                        >
                            <ArrowBackIcon sx={{ fontSize: 22 }} />
                            CTP Rajad
                        </Box>
                    </Link>
                </Box>

                <Typography variant="h4" fontWeight="bold" textAlign="center">
                    CTP Tulemus
                </Typography>

                {/* Hole header */}
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3, mt: 2 }}>
                    <Box
                        sx={{
                            width: 56,
                            height: 56,
                            borderRadius: "50%",
                            bgcolor: "primary.main",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Typography variant="h5" sx={{ color: "white", fontWeight: 700 }}>
                            {hole}
                        </Typography>
                    </Box>
                </Box>

                {loading ? (
                    <Box display="flex" justifyContent="center" py={6}>
                        <CircularProgress />
                    </Box>
                ) : !holeInfo ? (
                    <Typography color="text.secondary" textAlign="center" py={4}>
                        Korvi {hole} ei leitud
                    </Typography>
                ) : noCtpGame ? (
                    <Box sx={{ ...cardSx, py: 3, textAlign: "center" }}>
                        <Typography color="text.secondary">
                            Korvil {hole} ei toimu CTP mängu
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {/* Current CTP result card */}
                        <Box sx={{ mb: 2.5 }}>
                            <SectionTitle>Tulemus</SectionTitle>
                            <Box sx={cardSx}>
                                {bestThrow ? (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: 1.5,
                                            width: "100%",
                                            minWidth: 0,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1.5,
                                                minWidth: 0,
                                            }}
                                        >
                                            <Box sx={{ color: "warning.main", flexShrink: 0 }}>
                                                <EmojiEventsIcon sx={{ fontSize: 28 }} />
                                            </Box>
                                            <Typography variant="body1" fontWeight={600} noWrap>
                                                {bestThrow.player.name}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            size="small"
                                            label={`${bestThrow.distance_cm} cm`}
                                            sx={{ fontWeight: 600, flexShrink: 0 }}
                                        />
                                    </Box>
                                ) : (
                                    <Typography variant="body1" color="text.secondary">
                                        CTP tulemust pole veel sisestatud
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        {/* User action: already submitted / form / disabled */}
                        {ctpEnabled ? (
                            authLoading ? (
                                <Box display="flex" justifyContent="center" py={4}>
                                    <CircularProgress />
                                </Box>
                            ) : !hasSubmitted ? (
                                <Box sx={{ mb: 2 }}>
                                    <SectionTitle>Kas viskasid lähemale?</SectionTitle>
                                    <Box sx={{ ...cardSx, py: 2.5 }}>
                                        <TextField
                                            label="Kaugus korvist (cm)"
                                            type="number"
                                            fullWidth
                                            size="small"
                                            value={distance}
                                            onChange={(e) =>
                                                setDistance(e.target.value === "" ? "" : Number(e.target.value))
                                            }
                                            error={distance !== "" && (!isValidDistance || showError)}
                                            helperText={
                                                distance !== ""
                                                    ? !isValidDistance
                                                        ? "CTP peab olema suurem kui 0 cm"
                                                        : showError
                                                          ? `CTP peab olema väiksem kui ${bestThrow?.distance_cm ?? "..."} cm`
                                                          : ""
                                                    : ""
                                            }
                                            sx={{ mb: 2 }}
                                            inputProps={{ min: 1, inputMode: "numeric" }}
                                        />
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            fullWidth
                                            onClick={handleSubmit}
                                            disabled={!isValidDistance || showError}
                                        >
                                            Kinnita
                                        </Button>
                                    </Box>
                                </Box>
                            ) : null
                        ) : (
                            <Box sx={{ mb: 2 }}>
                                <Box
                                    sx={{
                                        ...cardSx,
                                        py: 2,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 1,
                                    }}
                                >
                                    <LockIcon sx={{ fontSize: 22, color: "grey.500" }} />
                                    <Typography variant="body2" color="text.secondary">
                                        CTP sisestamine ei ole veel avatud
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        {/* CTP history */}
                        {ctp.length > 0 && (
                            <Box sx={{ mt: 3.5 }}>
                                <SectionTitle>Ajalugu</SectionTitle>
                                <Box sx={{ ...cardSx, width: "100%", py: 1 }}>
                                    {ctp.map((entry, idx) => (
                                        <Box
                                            key={entry.id}
                                            sx={{
                                                py: 1.75,
                                                px: 0,
                                                borderBottom:
                                                    idx < ctp.length - 1 ? "1px solid" : "none",
                                                borderColor: "divider",
                                                width: "100%",
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                fontWeight={500}
                                                sx={{ display: "block", mb: 0.5 }}
                                            >
                                                {idx + 1}. {entry.player.name}
                                            </Typography>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    gap: 1,
                                                    width: "100%",
                                                    minWidth: 0,
                                                }}
                                            >
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatEstonianDateTime(entry.created_date)}
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    label={`${entry.distance_cm} cm`}
                                                    sx={{ height: 22, fontWeight: 600, flexShrink: 0 }}
                                                />
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </>
                )}
            </Box>

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle
                    sx={{ m: 0, p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                    Kinnita CTP tulemus
                    <IconButton aria-label="close" onClick={() => setConfirmOpen(false)} sx={{ ml: 1 }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 0 }}>
                    <Typography>
                        Kas kinnitad, et Sinu ketas on korvist <strong>{distance} cm</strong>?
                    </Typography>
                    <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
                        <Button onClick={() => setConfirmOpen(false)}>Katkesta</Button>
                        <Button onClick={handleConfirmSubmit} variant="contained" color="primary">
                            Kinnitan
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>
        </Layout>
    )
}
