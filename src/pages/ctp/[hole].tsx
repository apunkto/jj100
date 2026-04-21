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
import useCtpApi, {CtpEntry, Hole, PoolMate} from "@/src/api/useCtpApi"
import {useToast} from "@/src/contexts/ToastContext"
import useConfigApi from "@/src/api/useConfigApi"
import LockIcon from "@mui/icons-material/Lock"
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"
import {formatLocalDateTime} from "@/src/utils/dateUtils"
import {useAuth} from "@/src/contexts/AuthContext"
import {useTranslation} from "react-i18next"
import {useAppLocale} from "@/src/i18n/useAppLocale"

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
    const { getHole, getCtpByHoleNumber, submitCtp, getPoolMates } = useCtpApi()
    const { isCtpEnabled } = useConfigApi()
    const { showToast } = useToast()
    const { user, loading: authLoading } = useAuth()
    const { t } = useTranslation("pages")
    const { t: tc } = useTranslation("common")
    const appLocale = useAppLocale()

    const [holeInfo, setHoleInfo] = useState<Hole | null>(null)
    const [ctp, setCtp] = useState<CtpEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [distance, setDistance] = useState<number | "">("")
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [confirmForPoolMate, setConfirmForPoolMate] = useState<PoolMate | null>(null)
    const [ctpEnabled, setCtpEnabled] = useState(true)
    const [poolMates, setPoolMates] = useState<PoolMate[]>([])
    const [poolMateSelectOpen, setPoolMateSelectOpen] = useState(false)
    const [selectedPoolMate, setSelectedPoolMate] = useState<PoolMate | null>(null)

    const bestThrow = ctp[0] ?? null
    const isValidDistance = distance !== "" && Number(distance) > 0
    const isBetterThrow = !bestThrow || (isValidDistance && Number(distance) < Number(bestThrow.distance_cm))
    const showError = Boolean(bestThrow && isValidDistance && Number(distance) >= Number(bestThrow.distance_cm))

    const noCtpGame = holeInfo && !holeInfo.is_ctp

    const hasSubmitted = useMemo(() => {
        if (!user?.metrixUserId) return false
        return Boolean(ctp.some((r) => r.player?.user_id === String(user.metrixUserId)))
    }, [user?.metrixUserId, ctp])

    const poolMateAlreadySubmitted = useMemo(() => {
        return (pm: PoolMate) => ctp.some((r) => r.metrix_player_result_id === pm.id)
    }, [ctp])

    const poolMatesFiltered = useMemo(() => {
        if (!user?.metrixUserId) return poolMates
        const uid = String(user.metrixUserId)
        return poolMates.filter((pm) => pm.user_id !== uid)
    }, [poolMates, user?.metrixUserId])

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.activeCompetitionId) return
            const holeNum = parseInt(hole as string, 10)
            try {
                const enabled = await isCtpEnabled(user.activeCompetitionId)
                setCtpEnabled(enabled)
                const [holeData, poolMatesList] = await Promise.all([
                    getHole(holeNum, user.activeCompetitionId),
                    getPoolMates(),
                ])
                setPoolMates(poolMatesList)
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

    const handleSubmit = () => {
        setConfirmForPoolMate(null)
        setConfirmOpen(true)
    }

    const handleProxySubmit = () => {
        if (selectedPoolMate) {
            setConfirmForPoolMate(selectedPoolMate)
            setConfirmOpen(true)
        }
    }

    const handleConfirmSubmit = async () => {
        if (!holeInfo || !isValidDistance || !isBetterThrow || !user?.activeCompetitionId) return
        const targetId = confirmForPoolMate?.id
        try {
            await submitCtp(holeInfo.id, Number(distance), targetId)
            const ctpResult = await getCtpByHoleNumber(holeInfo.number, user.activeCompetitionId)
            setCtp(ctpResult)
            setDistance("")
            setSelectedPoolMate(null)
            setConfirmForPoolMate(null)
            showToast(targetId ? t("ctpHole.toastMateSuccess") : t("ctpHole.toastOwnSuccess"), "success")
        } catch (err: unknown) {
            const e = err as { code?: string; message?: string }
            const msg =
                e?.code === "not_competition_participant"
                    ? t("ctpHole.toastNotParticipant")
                    : e?.code === "not_same_pool"
                      ? t("ctpHole.toastSamePool")
                      : (e?.message ?? t("ctpHole.toastSubmitFailed"))
            showToast(msg, "error")
        } finally {
            setConfirmOpen(false)
        }
    }

    const closeConfirm = () => {
        setConfirmOpen(false)
        setConfirmForPoolMate(null)
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
                            {t("ctpHole.back")}
                        </Box>
                    </Link>
                </Box>

                <Typography variant="h4" fontWeight="bold" textAlign="center">
                    {t("ctpHole.title")}
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
                        {t("ctpHole.holeNotFound", { n: hole })}
                    </Typography>
                ) : noCtpGame ? (
                    <Box sx={{ ...cardSx, py: 3, textAlign: "center" }}>
                        <Typography color="text.secondary">
                            {t("ctpHole.noCtpGame", { n: hole })}
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {/* Current CTP result card */}
                        <Box sx={{ mb: 2.5 }}>
                            <SectionTitle>{t("ctpHole.resultSection")}</SectionTitle>
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
                                                {bestThrow.player?.name ?? tc("player")}
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
                                        {t("ctpHole.noResultYet")}
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
                            ) : !hasSubmitted && !selectedPoolMate ? (
                                <Box sx={{ mb: 2 }}>
                                    <SectionTitle>{t("ctpHole.closerQuestion")}</SectionTitle>
                                    <Box sx={{ ...cardSx, py: 2.5 }}>
                                        <TextField
                                            label={t("ctpHole.distanceLabel")}
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
                                                        ? t("ctpHole.distancePositive")
                                                        : showError
                                                          ? t("ctpHole.distanceLessThan", {
                                                                cm: String(bestThrow?.distance_cm ?? "..."),
                                                            })
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
                                            {t("ctpHole.confirm")}
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
                                        {t("ctpHole.entryClosed")}
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        {/* Pool-mate CTP: link only when 1–9 other players in pool */}
                        {ctpEnabled && poolMatesFiltered.length > 0 && poolMatesFiltered.length < 10 && !authLoading && (
                            <Box sx={{ mb: 2 }}>
                                {!selectedPoolMate ? (
                                    <Typography
                                        component="button"
                                        type="button"
                                        onClick={() => setPoolMateSelectOpen(true)}
                                        sx={{
                                            background: "none",
                                            border: "none",
                                            padding: 0,
                                            cursor: "pointer",
                                            color: "primary.main",
                                            fontSize: "0.875rem",
                                            fontWeight: 500,
                                            textDecoration: "none",
                                            "&:hover": { textDecoration: "underline" },
                                        }}
                                    >
                                        {t("ctpHole.poolMateLink")}
                                    </Typography>
                                ) : (
                                    <Box sx={{ ...cardSx, py: 2.5 }}>
                                        <SectionTitle>
                                            {t("ctpHole.poolMateTitle", {
                                                name: selectedPoolMate.name ?? tc("player"),
                                            })}
                                        </SectionTitle>
                                        <TextField
                                            label={t("ctpHole.distanceLabel")}
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
                                                        ? t("ctpHole.distancePositive")
                                                        : showError
                                                          ? t("ctpHole.distanceLessThan", {
                                                                cm: String(bestThrow?.distance_cm ?? "..."),
                                                            })
                                                          : ""
                                                    : ""
                                            }
                                            sx={{ mb: 2 }}
                                            inputProps={{ min: 1, inputMode: "numeric" }}
                                        />
                                        <Box sx={{ display: "flex", gap: 1 }}>
                                            <Button
                                                variant="outlined"
                                                fullWidth
                                                onClick={() => {
                                                    setSelectedPoolMate(null)
                                                    setDistance("")
                                                }}
                                            >
                                                {t("ctpHole.cancel")}
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                fullWidth
                                                onClick={handleProxySubmit}
                                                disabled={!isValidDistance || showError}
                                            >
                                                {t("ctpHole.confirm")}
                                            </Button>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* CTP history */}
                        {ctp.length > 0 && (
                            <Box sx={{ mt: 3.5 }}>
                                <SectionTitle>{t("ctpHole.history")}</SectionTitle>
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
                                                {idx + 1}. {entry.player?.name ?? tc("player")}
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
                                                    {formatLocalDateTime(entry.created_date, appLocale)}
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

            <Dialog open={confirmOpen} onClose={closeConfirm}>
                <DialogTitle
                    sx={{ m: 0, p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                    {t("ctpHole.dialogConfirmTitle")}
                    <IconButton aria-label="close" onClick={closeConfirm} sx={{ ml: 1 }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 0 }}>
                    <Typography>
                        {confirmForPoolMate
                            ? t("ctpHole.dialogMate", {
                                  name: confirmForPoolMate.name ?? tc("player"),
                                  distance: String(distance),
                              })
                            : t("ctpHole.dialogOwn", { distance: String(distance) })}
                    </Typography>
                    <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
                        <Button onClick={closeConfirm}>{t("ctpHole.cancel")}</Button>
                        <Button onClick={handleConfirmSubmit} variant="contained" color="primary">
                            {t("ctpHole.iConfirm")}
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>

            <Dialog open={poolMateSelectOpen} onClose={() => setPoolMateSelectOpen(false)}>
                <DialogTitle
                    sx={{ m: 0, p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                    {t("ctpHole.pickMateTitle")}
                    <IconButton aria-label="close" onClick={() => setPoolMateSelectOpen(false)} sx={{ ml: 1 }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 0 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {t("ctpHole.pickMateBody")}
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                        {poolMatesFiltered.map((pm) => {
                            const alreadySubmitted = poolMateAlreadySubmitted(pm)
                            return (
                                <Button
                                    key={pm.id}
                                    variant="text"
                                    fullWidth
                                    disabled={alreadySubmitted}
                                    onClick={() => {
                                        setSelectedPoolMate(pm)
                                        setPoolMateSelectOpen(false)
                                        setDistance("")
                                    }}
                                    sx={{
                                        justifyContent: "flex-start",
                                        textTransform: "none",
                                        opacity: alreadySubmitted ? 0.6 : 1,
                                    }}
                                >
                                    {pm.name ?? tc("player")}{" "}
                                    {alreadySubmitted ? t("ctpHole.alreadySubmitted") : ""}
                                </Button>
                            )
                        })}
                    </Box>
                </DialogContent>
            </Dialog>
        </Layout>
    )
}
