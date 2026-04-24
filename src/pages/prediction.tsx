import {type ReactNode, useCallback, useEffect, useRef, useState} from 'react'
import {AppError} from '@/src/utils/AppError'
import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    FormControlLabel,
    FormHelperText,
    IconButton,
    Paper,
    Radio,
    RadioGroup,
    Tab,
    Tabs,
    TextField,
    Typography,
} from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LockIcon from '@mui/icons-material/Lock'
import EditIcon from '@mui/icons-material/Edit'
import CloseIcon from '@mui/icons-material/Close'
import {predictionFormSectionPaperSx, predictionFormTextFieldSx, ScoreInput,} from '../components/ScoreInput'
import {
    PredictionCards,
    predictionResultCardContentSx,
    predictionResultCardTitleSx,
    predictionResultsColumnHeaderSx,
    predictionResultsNumericValueSx,
} from '../components/PredictionCards'
import {PredictionLeaderboard} from '../components/PredictionLeaderboard'
import Layout from '@/src/components/Layout'
import {useAuth} from '@/src/contexts/AuthContext'
import {useToast} from '@/src/contexts/ToastContext'
import useConfigApi from '@/src/api/useConfigApi'
import usePredictionApi, {Prediction, PredictionData, PredictionLeaderboardResponse,} from '@/src/api/usePredictionApi'
import {useTranslation} from 'react-i18next'

const predictionQuestionHeadingSx = {
    fontWeight: 600,
    color: 'text.primary',
    letterSpacing: '0.01em',
    lineHeight: "1.35rem",
    mb: 0.25,
} as const

function NumberedQuestionHeading({
    n,
    children,
    mb,
}: {
    n: number
    children: ReactNode
    /** Override default bottom margin from `predictionQuestionHeadingSx` */
    mb?: number
}) {
    return (
        <Typography
            component="h3"
            variant="subtitle1"
            sx={{
                ...predictionQuestionHeadingSx,
                ...(mb != null ? {mb} : {}),
            }}
        >
            <Box component="span" sx={{color: 'primary.main', fontWeight: 700, mr: 0.75}}>
                {n}.
            </Box>
            {children}
        </Typography>
    )
}

export default function PredictionPage() {
    const {user, loading: authLoading} = useAuth()
    const {showToast} = useToast()
    const {t} = useTranslation('prediction')
    const {isPredictionEnabled} = useConfigApi()
    const {getPrediction, createPrediction, updatePrediction, getLeaderboard, getPlayerPrediction} = usePredictionApi()

    const [predictionEnabled, setPredictionEnabled] = useState(false)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [prediction, setPrediction] = useState<Prediction | null>(null)
    const [leaderboard, setLeaderboard] = useState<PredictionLeaderboardResponse | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [isParticipating, setIsParticipating] = useState<boolean | null>(null)
    const [selectedPlayerDialog, setSelectedPlayerDialog] = useState<{open: boolean; playerId: number | null; playerName: string; rank: number | null}>({
        open: false,
        playerId: null,
        playerName: '',
        rank: null,
    })
    const [selectedPlayerPrediction, setSelectedPlayerPrediction] = useState<Prediction | null>(null)
    const [loadingPlayerPrediction, setLoadingPlayerPrediction] = useState(false)
    const [previousYearDialog, setPreviousYearDialog] = useState(false)
    const [resultsTab, setResultsTab] = useState(0)

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
        will_rain?: string
        player_own_score?: string
        hole_in_ones_count?: string
        water_discs_count?: string
    }>({})
    const [touchedFields, setTouchedFields] = useState<{
        best_overall_score: boolean
        best_female_score: boolean
        will_rain: boolean
        player_own_score: boolean
        hole_in_ones_count: boolean
        water_discs_count: boolean
    }>({
        best_overall_score: false,
        best_female_score: false,
        will_rain: false,
        player_own_score: false,
        hole_in_ones_count: false,
        water_discs_count: false,
    })

    const isEditingRef = useRef(isEditing)
    isEditingRef.current = isEditing

    /** `useConfigApi()` returns a new `isPredictionEnabled` fn each render — ref avoids unstable `useCallback` deps. */
    const isPredictionEnabledRef = useRef(isPredictionEnabled)
    isPredictionEnabledRef.current = isPredictionEnabled

    const loadPredictionPage = useCallback(async () => {
        if (!user?.activeCompetitionId) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const enabled = await isPredictionEnabledRef.current(user.activeCompetitionId)
            setPredictionEnabled(enabled)

            // Fetch user's prediction first to determine participation
            let participating = true
            try {
                const userPrediction = await getPrediction(user.activeCompetitionId)
                setIsParticipating(true)
                if (userPrediction) {
                    setPrediction(userPrediction)
                    if (enabled) {
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
            } catch (predErr: unknown) {
                const message = predErr instanceof Error ? predErr.message : ''
                const code = predErr instanceof AppError ? predErr.code : undefined
                if (message.includes('not_competition_participant') || code === 'not_competition_participant') {
                    participating = false
                    setIsParticipating(false)
                } else if (message.includes('not enabled')) {
                    setIsParticipating(true)
                } else {
                    setIsParticipating(true)
                    console.error('Failed to fetch prediction:', predErr)
                }
            }

            // Fetch leaderboard only if participating or admin (leaderboard API fails for non-participants)
            if (participating || user?.isAdmin) {
                try {
                    const leaderboardData = await getLeaderboard(user.activeCompetitionId)
                    setLeaderboard(leaderboardData)
                } catch (leaderboardErr) {
                    console.error('Failed to fetch leaderboard:', leaderboardErr)
                }
            }
        } catch (err) {
            console.error('Failed to fetch prediction data:', err)
            showToast(t('toastLoadFailed'), 'error')
        } finally {
            setLoading(false)
        }
    }, [user?.activeCompetitionId, user?.isAdmin, getPrediction, getLeaderboard, showToast, t])

    useEffect(() => {
        if (user?.activeCompetitionId !== undefined) {
            void loadPredictionPage()
        }
    }, [user?.activeCompetitionId, loadPredictionPage])

    /** Reload after unlock / foreground — not while edit form is open (would overwrite in-progress values). */
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState !== 'visible') return
            if (isEditingRef.current) return
            if (user?.activeCompetitionId == null) return
            void loadPredictionPage()
        }
        const onPageShow = (e: PageTransitionEvent) => {
            if (!e.persisted) return
            if (isEditingRef.current) return
            if (user?.activeCompetitionId == null) return
            void loadPredictionPage()
        }
        document.addEventListener('visibilitychange', onVisible)
        window.addEventListener('pageshow', onPageShow)
        return () => {
            document.removeEventListener('visibilitychange', onVisible)
            window.removeEventListener('pageshow', onPageShow)
        }
    }, [loadPredictionPage, user?.activeCompetitionId])

    const validateForm = (): boolean => {
        const errors: typeof fieldErrors = {}
        const touched: typeof touchedFields = {
            best_overall_score: true,
            best_female_score: true,
            will_rain: true,
            player_own_score: true,
            hole_in_ones_count: true,
            water_discs_count: true,
        }

        if (formData.will_rain === null || formData.will_rain === undefined) {
            errors.will_rain = t('validation_required')
        }

        // Validate required score fields
        if (formData.best_overall_score === null || formData.best_overall_score === undefined) {
            errors.best_overall_score = t('validation_required')
        } else if (!Number.isFinite(formData.best_overall_score)) {
            errors.best_overall_score = t('validation_invalidNumber')
        }

        if (formData.best_female_score === null || formData.best_female_score === undefined) {
            errors.best_female_score = t('validation_required')
        } else if (!Number.isFinite(formData.best_female_score)) {
            errors.best_female_score = t('validation_invalidNumber')
        }

        if (formData.player_own_score === null || formData.player_own_score === undefined) {
            errors.player_own_score = t('validation_required')
        } else if (!Number.isFinite(formData.player_own_score)) {
            errors.player_own_score = t('validation_invalidNumber')
        }

        // Validate required numeric fields
        if (formData.hole_in_ones_count === null || formData.hole_in_ones_count === undefined) {
            errors.hole_in_ones_count = t('validation_required')
        } else if (!Number.isFinite(formData.hole_in_ones_count) || isNaN(formData.hole_in_ones_count)) {
            errors.hole_in_ones_count = t('validation_invalidNumber')
        } else if (formData.hole_in_ones_count < 0) {
            errors.hole_in_ones_count = t('validation_positive')
        }

        if (formData.water_discs_count === null || formData.water_discs_count === undefined) {
            errors.water_discs_count = t('validation_required')
        } else if (!Number.isFinite(formData.water_discs_count) || isNaN(formData.water_discs_count)) {
            errors.water_discs_count = t('validation_invalidNumber')
        } else if (formData.water_discs_count < 0) {
            errors.water_discs_count = t('validation_positive')
        }

        setFieldErrors(errors)
        setTouchedFields(touched)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async () => {
        if (!user?.activeCompetitionId) return

        // Validate all fields
        if (!validateForm()) {
            showToast(t('toastFixFields'), 'error')
            return
        }

        try {
            setSubmitting(true)
            const submissionData = {
                ...formData,
                will_rain: formData.will_rain as boolean,
            }
            if (prediction) {
                await updatePrediction(user.activeCompetitionId, submissionData)
                showToast(t('toastUpdated'), 'success')
            } else {
                await createPrediction(user.activeCompetitionId, submissionData)
                showToast(t('toastSaved'), 'success')
            }
            setIsEditing(false)
            // Refresh data
            const updatedPrediction = await getPrediction(user.activeCompetitionId)
            if (updatedPrediction) {
                setPrediction(updatedPrediction)
            }
        } catch (err: unknown) {
            console.error('Failed to save prediction:', err)
            const message = err instanceof Error ? err.message : ''
            const code = err instanceof AppError ? err.code : undefined
            if (message.includes('not_competition_participant') || code === 'not_competition_participant') {
                setIsParticipating(false)
                showToast(t('notParticipant'), 'error')
            } else {
                showToast(message || t('toastSaveFailed'), 'error')
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
            will_rain: false,
            player_own_score: false,
            hole_in_ones_count: false,
            water_discs_count: false,
        })
        setIsEditing(false)
    }

    const handlePlayerNameClick = async (playerId: number | undefined, playerName: string, rank: number) => {
        if (!playerId || !user?.activeCompetitionId) {
            console.warn('handlePlayerNameClick: missing playerId or activeCompetitionId', {playerId, activeCompetitionId: user?.activeCompetitionId})
            return
        }

        // Open dialog immediately - this happens synchronously before any async operations
        setSelectedPlayerDialog({open: true, playerId, playerName, rank})
        setLoadingPlayerPrediction(true)
        setSelectedPlayerPrediction(null)

        // Fetch prediction data asynchronously
        // The API client now returns null instead of throwing, so this should always succeed
        try {
            const result = await getPlayerPrediction(user.activeCompetitionId, playerId)
            setSelectedPlayerPrediction(result.prediction)
        } catch (err: unknown) {
            // This catch should rarely be hit now since API returns null instead of throwing
            console.error('Failed to fetch player prediction:', err)
            setSelectedPlayerPrediction(null)
        } finally {
            setLoadingPlayerPrediction(false)
        }
    }

    const handleClosePlayerDialog = () => {
        setSelectedPlayerDialog({open: false, playerId: null, playerName: '', rank: null})
        setSelectedPlayerPrediction(null)
    }


    if (authLoading || loading) {
        return (
            <Layout>
                <Box textAlign="center" mt={6}>
                    <CircularProgress />
                    <Typography variant="h6" mt={2}>
                        {t('loading')}
                    </Typography>
                </Box>
            </Layout>
        )
    }

    if (!user?.activeCompetitionId) {
        return (
            <Layout>
                <Box px={2} py={3} textAlign="center" boxSizing="border-box">
                    <Typography variant="h4" fontWeight="bold" mb={2}>
                        {t('title')}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {t('noCompetition')}
                    </Typography>
                </Box>
            </Layout>
        )
    }

    const showForm = predictionEnabled && isParticipating !== false && (!prediction || isEditing)

    const isNonParticipant = predictionEnabled && isParticipating === false
    const isPredictionDisabled = !predictionEnabled

    return (
        <Layout>
            <Box
                px={{xs: 2, sm: 3, md: 4}}
                py={3}
                maxWidth={showForm ? 800 : '100%'}
                mx={showForm ? 'auto' : 0}
                boxSizing="border-box"
            >
                <Typography variant="h4" fontWeight="bold" textAlign="center" mb={1}>
                    {t('title')}
                </Typography>

                {isNonParticipant ? (
                    user?.isAdmin ? (
                        <PredictionLeaderboard
                            leaderboard={leaderboard}
                            onPlayerClick={handlePlayerNameClick}
                        />
                    ) : (
                        <Typography variant="body1" color="error">
                            {t('notParticipant')}
                        </Typography>
                    )
                ) : isPredictionDisabled ? (
                    <>
                        <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={2}>
                            <LockIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                                {t('predictionEnded')}
                            </Typography>
                        </Box>
                        {prediction ? (
                            <>
                                <Tabs value={resultsTab} onChange={(_, v) => setResultsTab(v)} sx={{ mb: 2 }}>
                                    <Tab label={t('tabLeaderboard')} />
                                    <Tab label={t('tabYours')} />
                                </Tabs>
                                {resultsTab === 0 && (
                                    <PredictionLeaderboard
                                        leaderboard={leaderboard}
                                        onPlayerClick={handlePlayerNameClick}
                                        containerSx={{ mb: 3 }}
                                    />
                                )}
                                {resultsTab === 1 && (
                                    <Box sx={{ width: '100%' }}>
                                        <PredictionCards predictionData={prediction} />
                                    </Box>
                                )}
                            </>
                        ) : (
                            <PredictionLeaderboard
                                leaderboard={leaderboard}
                                onPlayerClick={handlePlayerNameClick}
                            />
                        )}
                    </>
                ) : showForm ? (
                        <Box sx={{ mb: 3 }}>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                textAlign="center"
                                sx={{mb: 1.5, fontSize: '0.8125rem', lineHeight: "1.35rem"}}
                            >
                                {t('pageIntro')}
                            </Typography>
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
                                    <Typography variant="body2" fontWeight={600}>{t('viewLastYear')}</Typography>
                                </Box>
                            </Box>

                            <Box display="flex" flexDirection="column" gap={2}>
                                <ScoreInput
                                    questionNumber={1}
                                    showParHint
                                    label={t('bestOverallLabel')}
                                    description={t('bestOverallDescription')}
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
                                    questionNumber={2}
                                    showParHint
                                    label={t('bestFemaleLabel')}
                                    description={t('bestFemaleDescription')}
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

                                <ScoreInput
                                    questionNumber={3}
                                    showParHint
                                    label={t('ownScoreLabel')}
                                    description={t('ownScoreDescription')}
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

                                <Paper variant="outlined" component="section" elevation={0} sx={predictionFormSectionPaperSx}>
                                    <NumberedQuestionHeading n={4}>{t('rainIntro')}</NumberedQuestionHeading>
                                    <FormControl
                                        component="fieldset"
                                        variant="standard"
                                        error={!!fieldErrors.will_rain}
                                        sx={{mt: 1.25, width: '100%', m: 0}}
                                    >
                                        <RadioGroup
                                            aria-label={t('rainIntro')}
                                            name="will_rain"
                                            value={
                                                formData.will_rain === null || formData.will_rain === undefined
                                                    ? ''
                                                    : formData.will_rain
                                                      ? 'wet'
                                                      : 'dry'
                                            }
                                            onChange={(e) => {
                                                const v = e.target.value
                                                setFormData({
                                                    ...formData,
                                                    will_rain: v === 'wet' ? true : v === 'dry' ? false : null,
                                                })
                                                if (fieldErrors.will_rain) {
                                                    setFieldErrors({...fieldErrors, will_rain: undefined})
                                                }
                                            }}
                                        >
                                            <FormControlLabel
                                                value="wet"
                                                control={<Radio size="small" sx={{p: 0.5, alignSelf: 'center'}} />}
                                                label={
                                                    <Typography variant="body2" sx={{lineHeight: "1.35rem"}}>
                                                        {t('rainChoiceWet')}
                                                    </Typography>
                                                }
                                                sx={{
                                                    ml: 0,
                                                    mr: 0,
                                                    mb: 0.75,
                                                    alignItems: 'center',
                                                    gap: 0.75,
                                                }}
                                            />
                                            <FormControlLabel
                                                value="dry"
                                                control={<Radio size="small" sx={{p: 0.5, alignSelf: 'center'}} />}
                                                label={
                                                    <Typography variant="body2" sx={{lineHeight: "1.35rem"}}>
                                                        {t('rainChoiceDry')}
                                                    </Typography>
                                                }
                                                sx={{
                                                    ml: 0,
                                                    mr: 0,
                                                    alignItems: 'center',
                                                    gap: 0.75,
                                                }}
                                            />
                                        </RadioGroup>
                                        {fieldErrors.will_rain ? (
                                            <FormHelperText sx={{mx: 0}}>{fieldErrors.will_rain}</FormHelperText>
                                        ) : null}
                                    </FormControl>
                                </Paper>

                                <Paper variant="outlined" component="section" elevation={0} sx={predictionFormSectionPaperSx}>
                                    <NumberedQuestionHeading n={5} mb={1.25}>
                                        {t('hioIntro')}
                                    </NumberedQuestionHeading>
                                    <TextField
                                        label={t('hioLabel')}
                                        type="number"
                                        value={formData.hole_in_ones_count ?? ''}
                                        onChange={(e) => {
                                            const value = e.target.value
                                            setFormData({
                                                ...formData,
                                                hole_in_ones_count: value ? Number(value) : null,
                                            })
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
                                        size="small"
                                        error={!!fieldErrors.hole_in_ones_count}
                                        helperText={fieldErrors.hole_in_ones_count || undefined}
                                        placeholder="0"
                                        slotProps={{ htmlInput: { min: 0 } }}
                                        sx={predictionFormTextFieldSx}
                                    />
                                </Paper>

                                <Paper variant="outlined" component="section" elevation={0} sx={predictionFormSectionPaperSx}>
                                    <NumberedQuestionHeading n={6} mb={0.5}>
                                        {t('waterIntro')}
                                    </NumberedQuestionHeading>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        component="p"
                                        sx={{m: 0, mb: 1, lineHeight: "1.45rem", maxWidth: '100%'}}
                                    >
                                        {t('waterDetailHint')}
                                    </Typography>
                                    <TextField
                                        label={t('waterLabel')}
                                        type="number"
                                        value={formData.water_discs_count ?? ''}
                                        onChange={(e) => {
                                            const value = e.target.value
                                            setFormData({
                                                ...formData,
                                                water_discs_count: value ? Number(value) : null,
                                            })
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
                                        size="small"
                                        error={!!fieldErrors.water_discs_count}
                                        helperText={fieldErrors.water_discs_count || undefined}
                                        placeholder="0"
                                        slotProps={{ htmlInput: { min: 0 } }}
                                        sx={predictionFormTextFieldSx}
                                    />
                                </Paper>

                                <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
                                    {prediction && (
                                        <Button variant="outlined" onClick={handleCancel} disabled={submitting}>
                                            {t('cancel')}
                                        </Button>
                                    )}
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                    >
                                        {submitting ? <CircularProgress size={20} /> : prediction ? t('save') : t('send')}
                                    </Button>
                                </Box>
                            </Box>
                    </Box>
                ) : (
                        <Box sx={{width: '100%', maxWidth: 520, mx: 'auto'}}>
                            <Button
                                variant="outlined"
                                color="primary"
                                size="medium"
                                fullWidth
                                onClick={handleEdit}
                                startIcon={<EditIcon />}
                                sx={{mb: 2.5}}
                            >
                                {t('editPrediction')}
                            </Button>
                            <PredictionCards predictionData={prediction} />
                        </Box>
                    )}

                {/* Previous Year Results Dialog */}
                <Dialog
                    open={previousYearDialog}
                    onClose={() => setPreviousYearDialog(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {t('previousYearTitle')}
                        <IconButton
                            aria-label="close"
                            onClick={() => setPreviousYearDialog(false)}
                            sx={{ ml: 1 }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, pt: 1}}>
                            {(
                                [
                                    {labelKey: 'pyParticipants' as const, day1: '394', day2: '396'},
                                    {labelKey: 'pyBestOverall' as const, day1: '-39', day2: '-51'},
                                    {labelKey: 'pyBestFemale' as const, day1: '+3', day2: '+1'},
                                    {labelKey: 'pyHio' as const, day1: '19', day2: '25'},
                                    {labelKey: 'pyWater' as const, day1: '254', day2: '253'},
                                ] as const
                            ).map(({labelKey, day1, day2}) => (
                                <Card
                                    key={labelKey}
                                    variant="outlined"
                                    elevation={0}
                                    sx={{
                                        width: '100%',
                                        borderRadius: 2,
                                        borderLeftWidth: 4,
                                        borderLeftStyle: 'solid',
                                        borderLeftColor: 'primary.main',
                                        boxShadow: (theme) => theme.shadows[1],
                                        overflow: 'hidden',
                                    }}
                                >
                                    <CardContent sx={predictionResultCardContentSx}>
                                        <Typography component="h3" variant="subtitle1" sx={predictionResultCardTitleSx}>
                                            {t(labelKey)}
                                        </Typography>
                                        <Divider sx={{my: 1.5}} />
                                        <Box
                                            sx={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                                columnGap: {xs: 1, sm: 2},
                                                rowGap: 1.25,
                                                alignItems: 'start',
                                            }}
                                        >
                                            <Typography sx={{...predictionResultsColumnHeaderSx, gridColumn: 1}}>
                                                {t('day1')}
                                            </Typography>
                                            <Typography sx={{...predictionResultsColumnHeaderSx, gridColumn: 2}}>
                                                {t('day2')}
                                            </Typography>
                                            <Box
                                                sx={{
                                                    gridColumn: 1,
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    minHeight: 40,
                                                }}
                                            >
                                                <Typography variant="h6" component="span" sx={predictionResultsNumericValueSx}>
                                                    {day1}
                                                </Typography>
                                            </Box>
                                            <Box
                                                sx={{
                                                    gridColumn: 2,
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    minHeight: 40,
                                                }}
                                            >
                                                <Typography variant="h6" component="span" sx={predictionResultsNumericValueSx}>
                                                    {day2}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
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
                        {selectedPlayerDialog.rank != null ? `${selectedPlayerDialog.rank}. ${selectedPlayerDialog.playerName}` : selectedPlayerDialog.playerName}
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
