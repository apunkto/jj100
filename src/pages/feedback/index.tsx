import {useState} from 'react'
import {Alert, Box, Button, Rating, TextField, Typography,} from '@mui/material'
import {Controller, useForm} from 'react-hook-form'
import Layout from '@/src/components/Layout'
import useFeedbackApi from '@/src/api/useFeedbackApi'
import {useToast} from '@/src/contexts/ToastContext'
import {useTranslation} from 'react-i18next'

type FeedbackForm = {
    score: number
    feedback: string
}

export default function FeedbackPage() {
    const { t } = useTranslation('pages')
    const [submitted, setSubmitted] = useState(false)
    const { submitFeedback } = useFeedbackApi()
    const { showToast } = useToast()

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<FeedbackForm>({
        defaultValues: {
            score: 0,
            feedback: '',
        },
    })

    const onSubmit = async (data: FeedbackForm) => {
        try {
            await submitFeedback(data)
            setSubmitted(true)
            reset()
        } catch (err) {
            console.error(err)
            showToast(t('feedback.toastError'), 'error')
        }
    }

    return (
        <Layout>
            <Box display="flex" flexDirection="column" alignItems="center" px={2} py={3} boxSizing="border-box">
                <Typography
                    variant="h4"
                    fontWeight="bold"
                >
                    {t('feedback.title')}
                </Typography>

                {submitted && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        {t('feedback.success')}
                    </Alert>
                )}

                <Box
                    component="form"
                    onSubmit={handleSubmit(onSubmit)}
                    mt={4}
                >
                    <Box display="flex" flexDirection="column" gap={2}>
                        <Box textAlign="center">
                            <Typography variant="subtitle1" gutterBottom>
                                {t('feedback.ratingTitle')}
                            </Typography>
                            <Controller
                                name="score"
                                control={control}
                                rules={{ required: true, min: 1 }}
                                render={({ field }) => (
                                    <Rating
                                        name="event-rating"
                                        aria-label={t('feedback.ratingAria')}
                                        value={field.value}
                                        onChange={(_, value) => field.onChange(value)}
                                    />
                                )}
                            />
                            {errors.score && (
                                <Typography variant="body2" color="error">
                                    {t('feedback.ratingRequired')}
                                </Typography>
                            )}
                        </Box>
                        <Typography variant="subtitle1" gutterBottom mt={2}>
                            {t('feedback.commentTitle')}
                        </Typography>

                        <Controller
                            name="feedback"
                            control={control}
                            rules={{ required: true, minLength: 3 }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label={t('feedback.commentLabel')}
                                    fullWidth
                                    multiline
                                    minRows={3}
                                    variant="outlined"
                                    placeholder={t('feedback.commentPlaceholder')}
                                    error={!!errors.feedback}
                                    helperText={
                                        errors.feedback ? t('feedback.commentMin') : ' '
                                    }
                                />
                            )}
                        />

                        <Button
                            variant="contained"
                            type="submit"
                            disabled={isSubmitting}
                            sx={{ alignSelf: 'center', minWidth: 150 }}
                        >
                            {t('feedback.submit')}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Layout>
    )
}
