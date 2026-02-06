import {useEffect, useState} from 'react'
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    FormControlLabel,
    IconButton,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material'
import LockIcon from '@mui/icons-material/Lock'
import EditIcon from '@mui/icons-material/Edit'
import {ScoreInput} from '../components/ScoreInput'
import Layout from '@/src/components/Layout'
import {useAuth} from '@/src/contexts/AuthContext'
import {useToast} from '@/src/contexts/ToastContext'
import useConfigApi from '@/src/api/useConfigApi'
import usePredictionApi, {Prediction, PredictionData, PredictionLeaderboardResponse,} from '@/src/api/usePredictionApi'

export default function PredictionPage() {
    const {user, loading: authLoading} = useAuth()
    const {showToast} = useToast()
    const {isPredictionEnabled} = useConfigApi()
    const {getPrediction, createPrediction, updatePrediction, getLeaderboard} = usePredictionApi()

    const [predictionEnabled, setPredictionEnabled] = useState(false)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [prediction, setPrediction] = useState<Prediction | null>(null)
    const [leaderboard, setLeaderboard] = useState<PredictionLeaderboardResponse | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [isParticipating, setIsParticipating] = useState<boolean | null>(null)

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

                if (enabled) {
                    // Fetch user's prediction only if prediction is enabled
                    // This will also verify participation
                    try {
                        const userPrediction = await getPrediction(user.activeCompetitionId)
                        setIsParticipating(true)
                        if (userPrediction) {
                            setPrediction(userPrediction)
                            setFormData({
                                best_overall_score: userPrediction.best_overall_score,
                                best_female_score: userPrediction.best_female_score,
                                will_rain: userPrediction.will_rain,
                                player_own_score: userPrediction.player_own_score,
                                hole_in_ones_count: userPrediction.hole_in_ones_count,
                                water_discs_count: userPrediction.water_discs_count,
                            })
                        }
                    } catch (predErr: any) {
                        // Check if error is due to not participating
                        if (predErr?.message?.includes('not_competition_participant') || predErr?.code === 'not_competition_participant') {
                            setIsParticipating(false)
                        } else {
                            // Other error, assume participating but prediction fetch failed
                            setIsParticipating(true)
                            console.error('Failed to fetch prediction:', predErr)
                        }
                    }
                } else {
                    // If prediction is not enabled, we can't check participation via prediction endpoint
                    // Assume participating for now (leaderboard will still work)
                    setIsParticipating(true)
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
                    {leaderboard && leaderboard.top_10.length > 0 && (
                        <Card sx={{ width: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" mb={2}>
                                    Edetabel
                                </Typography>
                                <TableContainer sx={{ width: '100%' }}>
                                    <Table sx={{ width: '100%' }}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{fontWeight: 'bold', py: 1.5}}>Koht</TableCell>
                                                <TableCell sx={{fontWeight: 'bold', py: 1.5}}>Mängija</TableCell>
                                                <TableCell align="right" sx={{fontWeight: 'bold', py: 1.5}}>Punktid</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {leaderboard.top_10.map((entry, index) => {
                                                const isUser = leaderboard.user_rank && entry.rank === leaderboard.user_rank.rank
                                                return (
                                                    <TableRow 
                                                        key={entry.rank} 
                                                        sx={{
                                                            fontWeight: isUser ? 'bold' : 'normal',
                                                            backgroundColor: index % 2 === 0 ? 'background.paper' : 'action.hover',
                                                            '&:hover': {
                                                                backgroundColor: 'action.selected',
                                                            },
                                                        }}
                                                    >
                                                        <TableCell sx={{fontWeight: isUser ? 'bold' : 'normal', py: 1.5}}>
                                                            {entry.rank}
                                                        </TableCell>
                                                        <TableCell sx={{fontWeight: isUser ? 'bold' : 'normal', py: 1.5}}>
                                                            {entry.player_name}
                                                        </TableCell>
                                                        <TableCell align="right" sx={{fontWeight: isUser ? 'bold' : 'normal', py: 1.5}}>
                                                            {entry.score}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                                })}
                                                {/* Show separator dots if user rank is 12 or more */}
                                                {leaderboard.user_rank &&
                                                    !leaderboard.top_10.some((entry) => entry.rank === leaderboard.user_rank!.rank) &&
                                                    leaderboard.user_rank.rank >= 12 && (
                                                        <TableRow>
                                                            <TableCell colSpan={3} align="center" sx={{py: 1}}>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    • • •
                                                                </Typography>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                {/* Show user's rank separately if not in top 10 */}
                                                {leaderboard.user_rank &&
                                                    !leaderboard.top_10.some((entry) => entry.rank === leaderboard.user_rank!.rank) && (
                                                        <TableRow sx={{
                                                            fontWeight: 'bold',
                                                            backgroundColor: leaderboard.top_10.length % 2 === 0 ? 'background.paper' : 'action.hover',
                                                            '&:hover': {
                                                                backgroundColor: 'action.selected',
                                                            },
                                                        }}>
                                                            <TableCell sx={{fontWeight: 'bold', py: 1.5}}>
                                                                {leaderboard.user_rank.rank}
                                                            </TableCell>
                                                            <TableCell sx={{fontWeight: 'bold', py: 1.5}}>
                                                                {leaderboard.user_rank.player_name}
                                                            </TableCell>
                                                            <TableCell align="right" sx={{fontWeight: 'bold', py: 1.5}}>
                                                                {leaderboard.user_rank.score}
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        )}
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
                    {leaderboard && leaderboard.top_10.length > 0 && (
                        <Card sx={{ width: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" mb={2}>
                                    Edetabel
                                </Typography>
                                <TableContainer sx={{ width: '100%' }}>
                                    <Table sx={{ width: '100%' }}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{fontWeight: 'bold', py: 1.5}}>Koht</TableCell>
                                                <TableCell sx={{fontWeight: 'bold', py: 1.5}}>Mängija</TableCell>
                                                <TableCell align="right" sx={{fontWeight: 'bold', py: 1.5}}>Punktid</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {leaderboard.top_10.map((entry, index) => {
                                                const isUser = leaderboard.user_rank && entry.rank === leaderboard.user_rank.rank
                                                return (
                                                    <TableRow 
                                                        key={entry.rank} 
                                                        sx={{
                                                            fontWeight: isUser ? 'bold' : 'normal',
                                                            backgroundColor: index % 2 === 0 ? 'background.paper' : 'action.hover',
                                                            '&:hover': {
                                                                backgroundColor: 'action.selected',
                                                            },
                                                        }}
                                                    >
                                                        <TableCell sx={{fontWeight: isUser ? 'bold' : 'normal', py: 1.5}}>
                                                            {entry.rank}
                                                        </TableCell>
                                                        <TableCell sx={{fontWeight: isUser ? 'bold' : 'normal', py: 1.5}}>
                                                            {entry.player_name}
                                                        </TableCell>
                                                        <TableCell align="right" sx={{fontWeight: isUser ? 'bold' : 'normal', py: 1.5}}>
                                                            {entry.score}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                                })}
                                            {/* Show separator dots if user rank is 12 or more */}
                                            {leaderboard.user_rank &&
                                                !leaderboard.top_10.some((entry) => entry.rank === leaderboard.user_rank!.rank) &&
                                                leaderboard.user_rank.rank >= 12 && (
                                                    <TableRow>
                                                        <TableCell colSpan={3} align="center" sx={{py: 1}}>
                                                            <Typography variant="body2" color="text.secondary">
                                                                • • •
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            {/* Show user's rank separately if not in top 10 */}
                                            {leaderboard.user_rank &&
                                                !leaderboard.top_10.some((entry) => entry.rank === leaderboard.user_rank!.rank) && (
                                                    <TableRow sx={{
                                                        fontWeight: 'bold',
                                                        backgroundColor: leaderboard.top_10.length % 2 === 0 ? 'background.paper' : 'action.hover',
                                                        '&:hover': {
                                                            backgroundColor: 'action.selected',
                                                        },
                                                    }}>
                                                        <TableCell sx={{fontWeight: 'bold', py: 1.5}}>
                                                            {leaderboard.user_rank.rank}
                                                        </TableCell>
                                                        <TableCell sx={{fontWeight: 'bold', py: 1.5}}>
                                                            {leaderboard.user_rank.player_name}
                                                        </TableCell>
                                                        <TableCell align="right" sx={{fontWeight: 'bold', py: 1.5}}>
                                                            {leaderboard.user_rank.score}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    )}
                </Box>
            </Layout>
        )
    }

    const showForm = !prediction || isEditing

    return (
        <Layout>
            <Box mt={2} px={{xs: 2, sm: 3, md: 4}} maxWidth={showForm ? 800 : '100%'} mx={showForm ? 'auto' : 0}>
                <Typography variant="h4" fontWeight="bold" textAlign="center" mb={3}>
                    Ennustusmäng
                </Typography>
                {showForm ? (
                    <Card sx={{mb: 3, boxShadow: 2}}>
                        <CardContent sx={{p: 3}}>
                            <Typography variant="h6" fontWeight="bold" mb={3}>
                                Sinu ennustus
                            </Typography>

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
                        {leaderboard && leaderboard.top_10.length > 0 && (
                            <Card sx={{mb: 3, width: '100%', boxShadow: 2}}>
                                <CardContent sx={{p: {xs: 2, sm: 3}}}>
                                    <Typography variant="h6" fontWeight="bold" mb={3}>
                                        Edetabel
                                    </Typography>
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{fontWeight: 'bold', py: 1.5}}>Koht</TableCell>
                                                    <TableCell sx={{fontWeight: 'bold', py: 1.5}}>Mängija</TableCell>
                                                    <TableCell align="right" sx={{fontWeight: 'bold', py: 1.5}}>Punktid</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {leaderboard.top_10.map((entry, index) => {
                                                    const isUser = leaderboard.user_rank && entry.rank === leaderboard.user_rank.rank
                                                    return (
                                                        <TableRow 
                                                            key={entry.rank} 
                                                            sx={{
                                                                fontWeight: isUser ? 'bold' : 'normal',
                                                                backgroundColor: index % 2 === 0 ? 'background.paper' : 'action.hover',
                                                                '&:hover': {
                                                                    backgroundColor: 'action.selected',
                                                                },
                                                            }}
                                                        >
                                                            <TableCell sx={{fontWeight: isUser ? 'bold' : 'normal', py: 1.5}}>
                                                                {entry.rank}
                                                            </TableCell>
                                                            <TableCell sx={{fontWeight: isUser ? 'bold' : 'normal', py: 1.5}}>
                                                                {entry.player_name}
                                                            </TableCell>
                                                            <TableCell align="right" sx={{fontWeight: isUser ? 'bold' : 'normal', py: 1.5}}>
                                                                {entry.score}
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                })}
                                                {/* Show separator dots if user rank is 12 or more */}
                                                {leaderboard.user_rank &&
                                                    !leaderboard.top_10.some((entry) => entry.rank === leaderboard.user_rank!.rank) &&
                                                    leaderboard.user_rank.rank >= 12 && (
                                                        <TableRow>
                                                            <TableCell colSpan={3} align="center" sx={{py: 1}}>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    • • •
                                                                </Typography>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                {/* Show user's rank separately if not in top 10 */}
                                                {leaderboard.user_rank &&
                                                    !leaderboard.top_10.some((entry) => entry.rank === leaderboard.user_rank!.rank) && (
                                                        <TableRow sx={{
                                                            fontWeight: 'bold',
                                                            backgroundColor: leaderboard.top_10.length % 2 === 0 ? 'background.paper' : 'action.hover',
                                                            '&:hover': {
                                                                backgroundColor: 'action.selected',
                                                            },
                                                        }}>
                                                            <TableCell sx={{fontWeight: 'bold', py: 1.5}}>
                                                                {leaderboard.user_rank.rank}
                                                            </TableCell>
                                                            <TableCell sx={{fontWeight: 'bold', py: 1.5}}>
                                                                {leaderboard.user_rank.player_name}
                                                            </TableCell>
                                                            <TableCell align="right" sx={{fontWeight: 'bold', py: 1.5}}>
                                                                {leaderboard.user_rank.score}
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        )}

                        {/* User's predictions */}
                        {prediction && (
                            <Card sx={{ width: '100%', boxShadow: 2}}>
                                <CardContent sx={{p: {xs: 2, sm: 3}, width: '100%'}}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                        <Typography variant="h6" fontWeight="bold">
                                            Sinu ennustused
                                        </Typography>
                                        <IconButton onClick={handleEdit} color="primary" aria-label="Muuda ennustust" size="small">
                                            <EditIcon />
                                        </IconButton>
                                    </Box>

                                    <Box display="flex" flexDirection="column" gap={2}>
                                        {prediction.best_overall_score !== null && (
                                            <Box>
                                                <Typography variant="body2" fontWeight="medium" mb={1}>
                                                    Parim üldtulemus
                                                </Typography>
                                                <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                                                    <Chip
                                                        label={`Minu: ${prediction.best_overall_score > 0 ? `+${prediction.best_overall_score}` : prediction.best_overall_score}`}
                                                        sx={{
                                                            backgroundColor: 'rgba(25, 118, 210, 0.1)',
                                                            color: 'primary.main',
                                                            fontWeight: 'bold'
                                                        }}
                                                    />
                                                    {prediction.actual_results?.best_overall_score !== null && prediction.actual_results?.best_overall_score !== undefined && (
                                                        <Chip
                                                            label={`Tegelik: ${prediction.actual_results.best_overall_score > 0 ? `+${prediction.actual_results.best_overall_score}` : prediction.actual_results.best_overall_score}`}
                                                            sx={{
                                                                backgroundColor: 'rgba(156, 39, 176, 0.1)',
                                                                color: 'secondary.main',
                                                                fontWeight: 'bold'
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        )}

                                        {prediction.best_female_score !== null && (
                                            <Box>
                                                <Typography variant="body2" fontWeight="medium" mb={1}>
                                                    Parim naismängija tulemus
                                                </Typography>
                                                <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                                                    <Chip
                                                        label={`Minu: ${prediction.best_female_score > 0 ? `+${prediction.best_female_score}` : prediction.best_female_score}`}
                                                        sx={{
                                                            backgroundColor: 'rgba(25, 118, 210, 0.1)',
                                                            color: 'primary.main',
                                                            fontWeight: 'bold'
                                                        }}
                                                    />
                                                    {prediction.actual_results?.best_female_score !== null && prediction.actual_results?.best_female_score !== undefined && (
                                                        <Chip
                                                            label={`Tegelik: ${prediction.actual_results.best_female_score > 0 ? `+${prediction.actual_results.best_female_score}` : prediction.actual_results.best_female_score}`}
                                                            sx={{
                                                                backgroundColor: 'rgba(156, 39, 176, 0.1)',
                                                                color: 'secondary.main',
                                                                fontWeight: 'bold'
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        )}

                                        {(prediction.will_rain !== null || prediction.actual_results?.will_rain !== null || prediction.actual_results?.will_rain !== undefined) && (
                                            <Box>
                                                <Typography variant="body2" fontWeight="medium" mb={1}>
                                                    Sajab võistluse ajal
                                                </Typography>
                                                <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                                                    <Chip
                                                        label={`Minu: ${(prediction.will_rain ?? false) ? 'Jah' : 'Ei'}`}
                                                        sx={{
                                                            backgroundColor: (prediction.will_rain ?? false) ? 'rgba(46, 125, 50, 0.1)' : 'rgba(158, 158, 158, 0.1)',
                                                            color: (prediction.will_rain ?? false) ? 'success.main' : 'text.secondary',
                                                            fontWeight: 'bold'
                                                        }}
                                                    />
                                                    {prediction.actual_results?.will_rain !== null && prediction.actual_results?.will_rain !== undefined && (
                                                        <Chip
                                                            label={`Tegelik: ${prediction.actual_results.will_rain ? 'Jah' : 'Ei'}`}
                                                            sx={{
                                                                backgroundColor: prediction.actual_results.will_rain ? 'rgba(46, 125, 50, 0.1)' : 'rgba(158, 158, 158, 0.1)',
                                                                color: prediction.actual_results.will_rain ? 'success.main' : 'text.secondary',
                                                                fontWeight: 'bold'
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        )}

                                        {prediction.player_own_score !== null && (
                                            <Box>
                                                <Typography variant="body2" fontWeight="medium" mb={1}>
                                                    Sinu enda tulemus
                                                </Typography>
                                                <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                                                    <Chip
                                                        label={`Minu: ${prediction.player_own_score > 0 ? `+${prediction.player_own_score}` : prediction.player_own_score}`}
                                                        sx={{
                                                            backgroundColor: 'rgba(25, 118, 210, 0.1)',
                                                            color: 'primary.main',
                                                            fontWeight: 'bold'
                                                        }}
                                                    />
                                                    {prediction.actual_results?.player_own_score !== null && prediction.actual_results?.player_own_score !== undefined && (
                                                        <Chip
                                                            label={`Tegelik: ${prediction.actual_results.player_own_score > 0 ? `+${prediction.actual_results.player_own_score}` : prediction.actual_results.player_own_score}`}
                                                            sx={{
                                                                backgroundColor: 'rgba(156, 39, 176, 0.1)',
                                                                color: 'secondary.main',
                                                                fontWeight: 'bold'
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        )}

                                        {prediction.hole_in_ones_count !== null && (
                                            <Box>
                                                <Typography variant="body2" fontWeight="medium" mb={1}>
                                                    Hole-in-one&apos;ide arv
                                                </Typography>
                                                <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                                                    <Chip
                                                        label={`Minu: ${prediction.hole_in_ones_count}`}
                                                        sx={{
                                                            backgroundColor: 'rgba(25, 118, 210, 0.1)',
                                                            color: 'primary.main',
                                                            fontWeight: 'bold'
                                                        }}
                                                    />
                                                    {prediction.actual_results?.hole_in_ones_count !== null && prediction.actual_results?.hole_in_ones_count !== undefined && (
                                                        <Chip
                                                            label={`Tegelik: ${prediction.actual_results.hole_in_ones_count}`}
                                                            sx={{
                                                                backgroundColor: 'rgba(156, 39, 176, 0.1)',
                                                                color: 'secondary.main',
                                                                fontWeight: 'bold'
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        )}

                                        {prediction.water_discs_count !== null && (
                                            <Box>
                                                <Typography variant="body2" fontWeight="medium" mb={1}>
                                                    Vette visatud ketaste arv
                                                </Typography>
                                                <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                                                    <Chip
                                                        label={`Minu: ${prediction.water_discs_count}`}
                                                        sx={{
                                                            backgroundColor: 'rgba(25, 118, 210, 0.1)',
                                                            color: 'primary.main',
                                                            fontWeight: 'bold'
                                                        }}
                                                    />
                                                    {prediction.actual_results?.water_discs_count !== null && prediction.actual_results?.water_discs_count !== undefined && (
                                                        <Chip
                                                            label={`Tegelik: ${prediction.actual_results.water_discs_count}`}
                                                            sx={{
                                                                backgroundColor: 'rgba(156, 39, 176, 0.1)',
                                                                color: 'secondary.main',
                                                                fontWeight: 'bold'
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </Box>
        </Layout>
    )
}
