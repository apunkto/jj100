import {useEffect, useState} from 'react'
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    Switch,
    TextField,
    Typography,
} from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LockIcon from '@mui/icons-material/Lock'
import EditIcon from '@mui/icons-material/Edit'
import CloseIcon from '@mui/icons-material/Close'
import {ScoreInput} from '../components/ScoreInput'
import {PredictionCards} from '../components/PredictionCards'
import {PredictionLeaderboard} from '../components/PredictionLeaderboard'
import Layout from '@/src/components/Layout'
import {useAuth} from '@/src/contexts/AuthContext'
import {useToast} from '@/src/contexts/ToastContext'
import useConfigApi from '@/src/api/useConfigApi'
import usePredictionApi, {Prediction, PredictionData, PredictionLeaderboardResponse,} from '@/src/api/usePredictionApi'

export default function PredictionPage() {
    const {user, loading: authLoading} = useAuth()
    const {showToast} = useToast()
    const {isPredictionEnabled} = useConfigApi()
    const {getPrediction, createPrediction, updatePrediction, getLeaderboard, getPlayerPrediction} = usePredictionApi()

    const [predictionEnabled, setPredictionEnabled] = useState(false)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [prediction, setPrediction] = useState<Prediction | null>(null)
    const [leaderboard, setLeaderboard] = useState<PredictionLeaderboardResponse | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [isParticipating, setIsParticipating] = useState<boolean | null>(null)
    const [selectedPlayerDialog, setSelectedPlayerDialog] = useState<{open: boolean; playerId: number | null; playerName: string}>({
        open: false,
        playerId: null,
        playerName: '',
    })
    const [selectedPlayerPrediction, setSelectedPlayerPrediction] = useState<Prediction | null>(null)
    const [loadingPlayerPrediction, setLoadingPlayerPrediction] = useState(false)
    const [previousYearDialog, setPreviousYearDialog] = useState(false)

    // Form state
    const [formData, setFormData] = useState<PredictionData>({
        best_overall_score: null,
        best_female_score: null,
        will_rain: null,
        player_own_score: null,
        hole_in_ones_count: null,
        water_discs_count: null,
    })

    // Validation state - track which fields have been touched/validated
    const [fieldErrors, setFieldErrors] = useState<{
        best_overall_score?: string
        best_female_score?: string
        player_own_score?: string
        hole_in_ones_count?: string
        water_discs_count?: string
    }>({})
    const [touchedFields, setTouchedFields] = useState<{
        best_overall_score: boolean
        best_female_score: boolean
        player_own_score: boolean
        hole_in_ones_count: boolean
        water_discs_count: boolean
    }>({
        best_overall_score: false,
        best_female_score: false,
        player_own_score: false,
        hole_in_ones_count: false,
        water_discs_count: false,
    })

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.activeCompetitionId) {
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                const enabled = await isPredictionEnabled(user.activeCompetitionId)
                setPredictionEnabled(enabled)

                // Always fetch leaderboard, regardless of prediction_enabled status
                try {
                    const leaderboardData = await getLeaderboard(user.activeCompetitionId)
                    setLeaderboard(leaderboardData)
                } catch (leaderboardErr) {
                    console.error('Failed to fetch leaderboard:', leaderboardErr)
                    // Don't show error toast for leaderboard, just log it
                }

                // Always try to fetch user's prediction (for viewing), even when disabled
                // Only creating/editing is restricted when disabled
                try {
                    const userPrediction = await getPrediction(user.activeCompetitionId)
                    setIsParticipating(true)
                    if (userPrediction) {
                        setPrediction(userPrediction)
                        if (enabled) {
                            // Only set form data if prediction is enabled (for editing)
                            setFormData({
                                best_overall_score: userPrediction.best_overall_score,
                                best_female_score: userPrediction.best_female_score,
                                will_rain: userPrediction.will_rain,
                                player_own_score: userPrediction.player_own_score,
                                hole_in_ones_count: userPrediction.hole_in_ones_count,
                                water_discs_count: userPrediction.water_discs_count,
                            })
                        }
                    }
                } catch (predErr: any) {
                    // Check if error is due to not participating
                    if (predErr?.message?.includes('not_competition_participant') || predErr?.code === 'not_competition_participant') {
                        setIsParticipating(false)
                    } else if (predErr?.message?.includes('not enabled')) {
                        // Prediction is disabled - this is expected, don't treat as error
                        setIsParticipating(true)
                    } else {
                        // Other error, assume participating but prediction fetch failed
                        setIsParticipating(true)
                        console.error('Failed to fetch prediction:', predErr)
                    }
                }
            } catch (err) {
                console.error('Failed to fetch prediction data:', err)
                showToast('Andmete laadimine ebaõnnestus', 'error')
            } finally {
                setLoading(false)
            }
        }

        if (user?.activeCompetitionId !== undefined) {
            fetchData()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.activeCompetitionId])

    const validateForm = (): boolean => {
        const errors: typeof fieldErrors = {}
        const touched: typeof touchedFields = {
            best_overall_score: true,
            best_female_score: true,
            player_own_score: true,
            hole_in_ones_count: true,
            water_discs_count: true,
        }

        // Validate required score fields
        if (formData.best_overall_score === null || formData.best_overall_score === undefined) {
            errors.best_overall_score = 'See väli on kohustuslik'
        } else if (typeof formData.best_overall_score !== 'number' || !Number.isFinite(formData.best_overall_score)) {
            errors.best_overall_score = 'Palun sisesta korrektne numbriline väärtus'
        }

        if (formData.best_female_score === null || formData.best_female_score === undefined) {
            errors.best_female_score = 'See väli on kohustuslik'
        } else if (typeof formData.best_female_score !== 'number' || !Number.isFinite(formData.best_female_score)) {
            errors.best_female_score = 'Palun sisesta korrektne numbriline väärtus'
        }

        if (formData.player_own_score === null || formData.player_own_score === undefined) {
            errors.player_own_score = 'See väli on kohustuslik'
        } else if (typeof formData.player_own_score !== 'number' || !Number.isFinite(formData.player_own_score)) {
            errors.player_own_score = 'Palun sisesta korrektne numbriline väärtus'
        }

        // Validate required numeric fields
        if (formData.hole_in_ones_count === null || formData.hole_in_ones_count === undefined) {
            errors.hole_in_ones_count = 'See väli on kohustuslik'
        } else if (typeof formData.hole_in_ones_count !== 'number' || !Number.isFinite(formData.hole_in_ones_count) || isNaN(formData.hole_in_ones_count)) {
            errors.hole_in_ones_count = 'Palun sisesta korrektne numbriline väärtus'
        } else if (formData.hole_in_ones_count < 0) {
            errors.hole_in_ones_count = 'Väärtus peab olema positiivne arv'
        }

        if (formData.water_discs_count === null || formData.water_discs_count === undefined) {
            errors.water_discs_count = 'See väli on kohustuslik'
        } else if (typeof formData.water_discs_count !== 'number' || !Number.isFinite(formData.water_discs_count) || isNaN(formData.water_discs_count)) {
            errors.water_discs_count = 'Palun sisesta korrektne numbriline väärtus'
        } else if (formData.water_discs_count < 0) {
            errors.water_discs_count = 'Väärtus peab olema positiivne arv'
        }

        setFieldErrors(errors)
        setTouchedFields(touched)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async () => {
        if (!user?.activeCompetitionId) return

        // Validate all fields
        if (!validateForm()) {
            showToast('Palun paranda vigased lahtrid', 'error')
            return
        }

        try {
            setSubmitting(true)
            // Ensure will_rain is boolean (convert null to false)
            const submissionData = {
                ...formData,
                will_rain: formData.will_rain ?? false,
            }
            if (prediction) {
                await updatePrediction(user.activeCompetitionId, submissionData)
                showToast('Ennustus uuendatud!', 'success')
            } else {
                await createPrediction(user.activeCompetitionId, submissionData)
                showToast('Ennustus salvestatud!', 'success')
            }
            setIsEditing(false)
            // Refresh data
            const updatedPrediction = await getPrediction(user.activeCompetitionId)
            if (updatedPrediction) {
                setPrediction(updatedPrediction)
            }
        } catch (err: any) {
            console.error('Failed to save prediction:', err)
            if (err?.message?.includes('not_competition_participant') || err?.code === 'not_competition_participant') {
                setIsParticipating(false)
                showToast('Sa ei osale sellel võistlusel', 'error')
            } else {
                showToast(err?.message || 'Ennustuse salvestamine ebaõnnestus', 'error')
            }
        } finally {
            setSubmitting(false)
        }
    }

    const handleEdit = () => {
        if (!predictionEnabled) {
            return // Don't allow editing when prediction is disabled
        }
        setIsEditing(true)
    }

    const handleCancel = () => {
        if (prediction) {
            setFormData({
                best_overall_score: prediction.best_overall_score,
                best_female_score: prediction.best_female_score,
                will_rain: prediction.will_rain,
                player_own_score: prediction.player_own_score,
                hole_in_ones_count: prediction.hole_in_ones_count,
                water_discs_count: prediction.water_discs_count,
            })
        } else {
            setFormData({
                best_overall_score: null,
                best_female_score: null,
                will_rain: null,
                player_own_score: null,
                hole_in_ones_count: null,
                water_discs_count: null,
            })
        }
        // Reset validation state
        setFieldErrors({})
        setTouchedFields({
            best_overall_score: false,
            best_female_score: false,
            player_own_score: false,
            hole_in_ones_count: false,
            water_discs_count: false,
        })
        setIsEditing(false)
    }

    const handlePlayerNameClick = async (playerId: number | undefined, playerName: string) => {
        if (!playerId || !user?.activeCompetitionId) {
            console.warn('handlePlayerNameClick: missing playerId or activeCompetitionId', {playerId, activeCompetitionId: user?.activeCompetitionId})
            return
        }

        // Open dialog immediately - this happens synchronously before any async operations
        setSelectedPlayerDialog({open: true, playerId, playerName})
        setLoadingPlayerPrediction(true)
        setSelectedPlayerPrediction(null)

        // Fetch prediction data asynchronously
        // The API client now returns null instead of throwing, so this should always succeed
        try {
            const result = await getPlayerPrediction(user.activeCompetitionId, playerId)
            setSelectedPlayerPrediction(result.prediction)
        } catch (err: any) {
            // This catch should rarely be hit now since API returns null instead of throwing
            console.error('Failed to fetch player prediction:', err)
            setSelectedPlayerPrediction(null)
        } finally {
            setLoadingPlayerPrediction(false)
        }
    }

    const handleClosePlayerDialog = () => {
        setSelectedPlayerDialog({open: false, playerId: null, playerName: ''})
        setSelectedPlayerPrediction(null)
    }


    if (authLoading || loading) {
        return (
            <Layout>
                <Box textAlign="center" mt={6}>
                    <CircularProgress />
                    <Typography variant="h6" mt={2}>
                        Laadimine...
                    </Typography>
                </Box>
            </Layout>
        )
    }

    if (!user?.activeCompetitionId) {
        return (
            <Layout>
                <Box mt={2} px={2} textAlign="center">
                    <Typography variant="h4" fontWeight="bold" mb={2}>
                        Ennustusmäng
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Aktiivset võistlust ei ole valitud.
                    </Typography>
                </Box>
            </Layout>
        )
    }

    // Check if user is not participating
    if (predictionEnabled && isParticipating === false) {
        return (
            <Layout>
                <Box mt={4} px={2}>
                    <Box textAlign="center" mb={3} maxWidth={800} mx="auto">
                        <Typography variant="h4" fontWeight="bold" mb={2}>
                            Ennustusmäng
                        </Typography>
                        <Typography variant="body1" color="error" sx={{mb: 3}}>
                            Sa ei osale sellel võistlusel
                        </Typography>
                    </Box>

                    {/* Leaderboard */}
                    <PredictionLeaderboard
                        leaderboard={leaderboard}
                        onPlayerClick={handlePlayerNameClick}
                    />

                    {/* Player Prediction Dialog */}
                    <Dialog
                        open={selectedPlayerDialog.open}
                        onClose={handleClosePlayerDialog}
                        maxWidth="md"
                        fullWidth
                    >
                        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            {selectedPlayerDialog.playerName} - Ennustused
                            <IconButton aria-label="close" onClick={handleClosePlayerDialog} sx={{ ml: 1 }}>
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent>
                            {loadingPlayerPrediction ? (
                                <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <PredictionCards predictionData={selectedPlayerPrediction} />
                            )}
                        </DialogContent>
                    </Dialog>
                </Box>
            </Layout>
        )
    }

        if (!predictionEnabled) {
        return (
            <Layout>
                <Box mt={4} px={2}>
                    <Box textAlign="center" mb={3} maxWidth={800} mx="auto">
                        <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                            <LockIcon sx={{fontSize: 24, color: 'grey.500', mr: 1}} />
                            <Typography variant="h4" fontWeight="bold">
                                Ennustusmäng
                            </Typography>
                        </Box>
                        <Typography variant="body1" color="text.secondary">
                            Ennustamine suletud!
                        </Typography>
                    </Box>

                    {/* Leaderboard */}
                    <PredictionLeaderboard
                        leaderboard={leaderboard}
                        onPlayerClick={handlePlayerNameClick}
                    />

                    {/* User's predictions (if they have any) */}
                    {prediction && (
                        <Card sx={{mt: 3, width: '100%', boxShadow: 2}}>
                            <CardContent sx={{p: {xs: 2, sm: 3}, width: '100%'}}>
                                <Typography variant="h6" fontWeight="bold" mb={2}>
                                    Sinu ennustused
                                </Typography>
                                <PredictionCards predictionData={prediction} />
                            </CardContent>
                        </Card>
                    )}

                    {/* Player Prediction Dialog */}
                    <Dialog
                        open={selectedPlayerDialog.open}
                        onClose={handleClosePlayerDialog}
                        maxWidth="md"
                        fullWidth
                    >
                        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            {selectedPlayerDialog.playerName} - Ennustused
                            <IconButton aria-label="close" onClick={handleClosePlayerDialog} sx={{ ml: 1 }}>
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent>
                            {loadingPlayerPrediction ? (
                                <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <PredictionCards predictionData={selectedPlayerPrediction} />
                            )}
                        </DialogContent>
                    </Dialog>
                    </Box>
                </Layout>
            )
    }

    const showForm = predictionEnabled && (!prediction || isEditing)

    return (
        <Layout>
            <Box mt={2} px={{xs: 2, sm: 3, md: 4}} maxWidth={showForm ? 800 : '100%'} mx={showForm ? 'auto' : 0}>
                <Typography variant="h4" fontWeight="bold" textAlign="center" mb={3}>
                    Ennustusmäng
                </Typography>
                {showForm ? (
                    <Card sx={{mb: 3, boxShadow: 2}}>
                        <CardContent sx={{p: 3}}>
                            <Box display="flex" alignItems="center" justifyContent="flex-end" mb={3}>
                                <Box
                                    component="button"
                                    onClick={() => setPreviousYearDialog(true)}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'primary.main',
                                        fontWeight: 600,
                                        '&:hover': { color: 'primary.dark' },
                                    }}
                                >
                                    <InfoOutlinedIcon sx={{ fontSize: 20 }} />
                                    <Typography variant="body2" fontWeight={600}>Vaata eelmist aastat</Typography>
                                </Box>
                            </Box>

                            <Box display="flex" flexDirection="column" gap={3}>
                                <ScoreInput
                                    label="Parim üldtulemus"
                                    description="Mis on võistluse parim tulemus par-iga võrreldes? Kui pakud alla par-i sisesta negatiivne väärtus."
                                    value={formData.best_overall_score}
                                    onChange={(value) => {
                                        setFormData({
                                            ...formData,
                                            best_overall_score: value,
                                        })
                                        // Clear error when user starts typing
                                        if (fieldErrors.best_overall_score) {
                                            setFieldErrors({
                                                ...fieldErrors,
                                                best_overall_score: undefined,
                                            })
                                        }
                                    }}
                                    required
                                    touched={touchedFields.best_overall_score}
                                    error={!!fieldErrors.best_overall_score}
                                    helperText={fieldErrors.best_overall_score}
                                />

                                <ScoreInput
                                    label="Parim naismängija tulemus"
                                    description="Mis on parima naismängija tulemus? Kui pakud alla par-i sisesta negatiivne väärtus."
                                    value={formData.best_female_score}
                                    onChange={(value) => {
                                        setFormData({
                                            ...formData,
                                            best_female_score: value,
                                        })
                                        // Clear error when user starts typing
                                        if (fieldErrors.best_female_score) {
                                            setFieldErrors({
                                                ...fieldErrors,
                                                best_female_score: undefined,
                                            })
                                        }
                                    }}
                                    required
                                    touched={touchedFields.best_female_score}
                                    error={!!fieldErrors.best_female_score}
                                    helperText={fieldErrors.best_female_score}
                                />

                                <Box>
                                    <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                                        Kas võistluse ajal sajab vihma? Vähemalt 5min peab sadama.
                                    </Typography>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.will_rain ?? false}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        will_rain: e.target.checked,
                                                    })
                                                }
                                            />
                                        }
                                        label="Võistlusel sajab vihma"
                                    />
                                </Box>

                                <ScoreInput
                                    label="Sinu enda tulemus"
                                    description="Milline tuleb Sinu enda tulemus?"
                                    value={formData.player_own_score}
                                    onChange={(value) => {
                                        setFormData({
                                            ...formData,
                                            player_own_score: value,
                                        })
                                        // Clear error when user starts typing
                                        if (fieldErrors.player_own_score) {
                                            setFieldErrors({
                                                ...fieldErrors,
                                                player_own_score: undefined,
                                            })
                                        }
                                    }}
                                    required
                                    touched={touchedFields.player_own_score}
                                    error={!!fieldErrors.player_own_score}
                                    helperText={fieldErrors.player_own_score}
                                />

                                <Box>
                                    <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                                        Mitu hole-in-one&apos;i visatakse võistluse ajal kokku?
                                    </Typography>
                                    <TextField
                                        label="Hole-in-one&apos;ide arv"
                                        type="number"
                                        value={formData.hole_in_ones_count ?? ''}
                                        onChange={(e) => {
                                            const value = e.target.value
                                            setFormData({
                                                ...formData,
                                                hole_in_ones_count: value ? Number(value) : null,
                                            })
                                            // Clear error when user starts typing
                                            if (fieldErrors.hole_in_ones_count) {
                                                setFieldErrors({
                                                    ...fieldErrors,
                                                    hole_in_ones_count: undefined,
                                                })
                                            }
                                        }}
                                        onBlur={() => {
                                            setTouchedFields({
                                                ...touchedFields,
                                                hole_in_ones_count: true,
                                            })
                                        }}
                                        fullWidth
                                        required
                                        error={!!fieldErrors.hole_in_ones_count}
                                        helperText={fieldErrors.hole_in_ones_count || ''}
                                        inputProps={{ min: 0 }}
                                    />
                                </Box>

                                <Box>
                                    <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                                        Mitu mängijat viskab võistluse ajal järve? Loeme kõik märgitud PEN järve radadel.
                                    </Typography>
                                    <TextField
                                        label="Vette viskajate arv"
                                        type="number"
                                        value={formData.water_discs_count ?? ''}
                                        onChange={(e) => {
                                            const value = e.target.value
                                            setFormData({
                                                ...formData,
                                                water_discs_count: value ? Number(value) : null,
                                            })
                                            // Clear error when user starts typing
                                            if (fieldErrors.water_discs_count) {
                                                setFieldErrors({
                                                    ...fieldErrors,
                                                    water_discs_count: undefined,
                                                })
                                            }
                                        }}
                                        onBlur={() => {
                                            setTouchedFields({
                                                ...touchedFields,
                                                water_discs_count: true,
                                            })
                                        }}
                                        fullWidth
                                        required
                                        error={!!fieldErrors.water_discs_count}
                                        helperText={fieldErrors.water_discs_count || ''}
                                        inputProps={{ min: 0 }}
                                    />
                                </Box>

                                <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
                                    {prediction && (
                                        <Button variant="outlined" onClick={handleCancel} disabled={submitting}>
                                            Tühista
                                        </Button>
                                    )}
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                    >
                                        {submitting ? <CircularProgress size={20} /> : prediction ? 'Salvesta' : 'Saada'}
                                    </Button>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Leaderboard */}
                        <PredictionLeaderboard
                            leaderboard={leaderboard}
                            onPlayerClick={handlePlayerNameClick}
                            cardSx={{mb: 3, boxShadow: 2}}
                            cardContentSx={{p: {xs: 2, sm: 3}}}
                        />

                        {/* User's predictions */}
                        {prediction && (
                            <Card sx={{ width: '100%', boxShadow: 2}}>
                                <CardContent sx={{p: {xs: 2, sm: 3}, width: '100%'}}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                        <Typography variant="h6" fontWeight="bold">
                                            Sinu ennustused
                                        </Typography>
                                        {predictionEnabled && (
                                            <IconButton onClick={handleEdit} color="primary" aria-label="Muuda ennustust" size="small">
                                                <EditIcon />
                                            </IconButton>
                                        )}
                                    </Box>

                                    <PredictionCards predictionData={prediction} />
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}

                {/* Previous Year Results Dialog */}
                <Dialog
                    open={previousYearDialog}
                    onClose={() => setPreviousYearDialog(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        2025 tulemused
                        <IconButton
                            aria-label="close"
                            onClick={() => setPreviousYearDialog(false)}
                            sx={{ ml: 1 }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, pt: 1 }}>
                            {[
                                { label: 'Osalejate arv', day1: '394', day2: '396' },
                                { label: 'Parim üldtulemus', day1: '-39', day2: '-51' },
                                { label: 'Parim naismängija tulemus', day1: '+3', day2: '+1' },
                                { label: "Hole-in-one'ide arv", day1: '19', day2: '25' },
                                { label: 'Vette viskajate arv', day1: '254', day2: '253' },
                            ].map(({ label, day1, day2 }) => (
                                <Card key={label} variant="outlined" sx={{ width: '100%' }}>
                                    <CardContent sx={{ pb: '16px !important' }}>
                                        <Typography variant="subtitle2" fontWeight="bold" mb={1.5} color="text.secondary">
                                            {label}
                                        </Typography>
                                        <Box display="flex" gap={1.5} alignItems="center">
                                            <Chip
                                                label={day1}
                                                variant="outlined"
                                                size="small"
                                                sx={{
                                                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                                    color: 'primary.main',
                                                    fontWeight: 'bold',
                                                    borderColor: 'primary.light',
                                                }}
                                            />
                                            <Chip
                                                label={day2}
                                                variant="outlined"
                                                size="small"
                                                sx={{
                                                    backgroundColor: 'rgba(156, 39, 176, 0.08)',
                                                    color: 'secondary.main',
                                                    fontWeight: 'bold',
                                                    borderColor: 'secondary.light',
                                                }}
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                        <Box
                            sx={{
                                mt: 2,
                                pt: 2,
                                borderTop: '1px solid',
                                borderColor: 'divider',
                                display: 'flex',
                                gap: 2,
                                flexWrap: 'wrap',
                                alignItems: 'center',
                            }}
                        >
                            <Typography variant="caption" color="text.secondary">
                                Legend:
                            </Typography>
                            <Chip
                                label="Esimene päev"
                                variant="outlined"
                                size="small"
                                sx={{
                                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                    color: 'primary.main',
                                    fontWeight: 'bold',
                                    borderColor: 'primary.light',
                                }}
                            />
                            <Chip
                                label="Teine päev"
                                variant="outlined"
                                size="small"
                                sx={{
                                    backgroundColor: 'rgba(156, 39, 176, 0.08)',
                                    color: 'secondary.main',
                                    fontWeight: 'bold',
                                    borderColor: 'secondary.light',
                                }}
                            />
                        </Box>
                    </DialogContent>
                </Dialog>

                {/* Player Prediction Dialog */}
                <Dialog
                    open={selectedPlayerDialog.open}
                    onClose={handleClosePlayerDialog}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {selectedPlayerDialog.playerName} - Ennustused
                        <IconButton aria-label="close" onClick={handleClosePlayerDialog} sx={{ ml: 1 }}>
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        {loadingPlayerPrediction ? (
                            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <PredictionCards predictionData={selectedPlayerPrediction} />
                        )}
                    </DialogContent>
                </Dialog>
            </Box>
        </Layout>
    )
}
