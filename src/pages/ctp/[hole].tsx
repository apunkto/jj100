import React, {useEffect, useMemo, useState} from "react"
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    TextField,
    Typography
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import Layout from "@/src/components/Layout"
import useCtpApi, {CtpEntry, Hole} from "@/src/api/useCtpApi"
import {useToast} from "@/src/contexts/ToastContext"
import useConfigApi from "@/src/api/useConfigApi"
import LockIcon from "@mui/icons-material/Lock"
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

    const myResult = useMemo(() => {
        if (!user?.playerId) return null
        return ctp.find((r) => r.player_id === user.playerId) ?? null
    }, [user?.playerId, ctp])

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.activeCompetitionId) return
            
            const holeNum = parseInt(hole as string, 10)
            try {
                // First check if CTP is enabled, then fetch data accordingly
                const enabled = await isCtpEnabled(user.activeCompetitionId)
                setCtpEnabled(enabled)
                
                // Always fetch hole info
                const holeData = await getHole(holeNum, user.activeCompetitionId)
                
                if (holeData) {
                    setHoleInfo(holeData)
                    // Only fetch CTP data if CTP is enabled
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
        setConfirmOpen(true)
    }

    const handleConfirmSubmit = async () => {
        if (!holeInfo || !isValidDistance || !isBetterThrow) return
        if (!user?.activeCompetitionId) return
        
        try {
            await submitCtp(holeInfo.id, Number(distance))
            const ctpResult = await getCtpByHoleNumber(holeInfo.number, user.activeCompetitionId)
            setCtp(ctpResult)
            setDistance("")
            showToast("CTP tulemus sisestatud!", "success")
        } catch (err: any) {
            const msg = err?.code === "not_competition_participant"
                ? "Sa ei osale võistlusel!"
                : (err?.message ?? "CTP sisestamine ebaõnnestus!")
            showToast(msg, "error")
        } finally {
            setConfirmOpen(false)
        }
    }

    return (
        <Layout>
            <Box textAlign="center" mt={2}>
                <Box display="flex" justifyContent="center" alignItems="center" mb={2}>
                    <Box
                        sx={{
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            backgroundColor: "primary.main",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Typography variant="h5" sx={{ color: "white", fontWeight: "bold", fontSize: "30px" }}>
                            {hole}
                        </Typography>
                    </Box>
                </Box>

                {loading ? (
                    <CircularProgress />
                ) : !holeInfo ? (
                    <Typography>Korvi {hole} ei leitud</Typography>
                ) : noCtpGame ? (
                    <Typography variant="h5" gutterBottom>
                        Korvil {hole} ei toimu CTP mängu
                    </Typography>
                ) : (
                    <>
                        <Typography variant="h5" gutterBottom>
                            CTP tulemus
                        </Typography>

                        {bestThrow ? (
                            <>
                                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                                    {bestThrow.player.name}
                                </Typography>
                                <Typography variant="h5">{bestThrow.distance_cm} cm</Typography>
                            </>
                        ) : (
                            <Typography>CTP tulemust pole veel sisestatud</Typography>
                        )}

                        {ctpEnabled ? (
                            authLoading ? (
                                <Box mt={4}>
                                    <CircularProgress />
                                </Box>
                            ) : hasSubmitted ? (
                                <Box mt={4}>
                                    <Typography variant="h6" gutterBottom>
                                        Oled sellel korvil juba CTP tulemuse sisestanud.
                                    </Typography>

                                    {myResult && (
                                        <Typography variant="body1">
                                            Sinu tulemus: <strong>{myResult.distance_cm} cm</strong> ({formatEstonianDateTime(myResult.created_date)})
                                        </Typography>
                                    )}
                                </Box>
                            ) : (
                                <Box mt={4}>
                                    <Typography variant="h6" gutterBottom>
                                        Kas viskasid lähemale?
                                    </Typography>

                                    <TextField
                                        label="Kaugus korvist (cm)"
                                        type="number"
                                        fullWidth
                                        value={distance}
                                        onChange={(e) => setDistance(e.target.value === "" ? "" : Number(e.target.value))}
                                        sx={{ mb: 2 }}
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
                                    />

                                    <Button variant="contained" color="primary" onClick={handleSubmit} disabled={!isValidDistance || showError}>
                                        Kinnita
                                    </Button>
                                </Box>
                            )
                        ) : (
                            <Box mt={4} display="flex" alignItems="center" justifyContent="center">
                                <LockIcon sx={{ fontSize: 25, color: "grey.500" }} />
                                <Typography variant="body1" color="textSecondary" sx={{ ml: 1 }}>
                                    CTP sisestamine ei ole veel avatud!
                                </Typography>
                            </Box>
                        )}

                        {ctp.length > 0 && (
                            <Box mt={4} textAlign="left">
                                <Typography variant="h6" gutterBottom>
                                    CTP Ajalugu
                                </Typography>

                                {ctp.map((entry, idx) => (
                                    <Box
                                        key={entry.id}
                                        display="flex"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        py={1}
                                        borderBottom={1}
                                        borderColor="grey.300"
                                    >
                                        <Typography sx={{ flexBasis: "60%" }}>
                                            {idx + 1}. {entry.player.name}
                                        </Typography>
                                        <Typography sx={{ flexBasis: "20%", textAlign: "center" }}>
                                            {formatEstonianDateTime(entry.created_date)}
                                        </Typography>
                                        <Typography sx={{ flexBasis: "20%", textAlign: "right" }}>
                                            {entry.distance_cm} cm
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </>
                )}
            </Box>

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
