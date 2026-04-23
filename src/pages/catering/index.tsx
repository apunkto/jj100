import {useCallback, useEffect, useState} from 'react'
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    IconButton,
    Radio,
    RadioGroup,
    Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import Layout from '@/src/components/Layout'
import useCtpApi, {Hole} from '@/src/api/useCtpApi'
import useConfigApi from '@/src/api/useConfigApi'
import useFoodChoicesApi from '@/src/api/useFoodChoicesApi'
import {isPizzaChoiceId, PIZZA_IDS, type PizzaChoiceId} from '@/src/constants/cateringPizzas'
import {useAuth} from '@/src/contexts/AuthContext'
import {useToast} from '@/src/contexts/ToastContext'
import {useTranslation} from 'react-i18next'

type SoupDraft = boolean | null

type IngredientsDialogState = { title: string; text: string }

export default function CateringPage() {
    const [holes, setHoles] = useState<Hole[]>([])
    const [loading, setLoading] = useState(true)
    const [foodChoiceEnabled, setFoodChoiceEnabled] = useState(false)
    const [savedFood, setSavedFood] = useState<{ is_vege_food: boolean; pizza: string | null } | null>(null)
    const [noPlayerRow, setNoPlayerRow] = useState(false)
    const [soupDraft, setSoupDraft] = useState<SoupDraft>(null)
    const [pizzaDraft, setPizzaDraft] = useState<PizzaChoiceId | null>(null)
    const [saving, setSaving] = useState(false)
    const [ingredientsDialog, setIngredientsDialog] = useState<IngredientsDialogState | null>(null)

    const {user} = useAuth()
    const {showToast} = useToast()
    const {t} = useTranslation('pages')

    const pizzaLabel = useCallback(
        (id: string | null | undefined) => {
            if (!isPizzaChoiceId(id)) return id ?? ''
            return t(`catering.pizza.${id}.label`)
        },
        [t],
    )

    const pizzaIngredients = useCallback(
        (id: string | null | undefined) => {
            if (!isPizzaChoiceId(id)) return ''
            return t(`catering.pizza.${id}.ingredients`)
        },
        [t],
    )
    const {getCateringHoles} = useCtpApi()
    const {fetchCompetitionInfo} = useConfigApi()
    const {getFoodChoices, patchFoodChoices} = useFoodChoicesApi()

    const competitionId = user?.activeCompetitionId

    const loadPage = useCallback(async () => {
        if (competitionId == null || !Number.isFinite(competitionId)) {
            setHoles([])
            setFoodChoiceEnabled(false)
            setSavedFood(null)
            setNoPlayerRow(false)
            setSoupDraft(null)
            setPizzaDraft(null)
            setLoading(false)
            return
        }
        setLoading(true)
        try {
            const [holeList, comp, fc] = await Promise.all([
                getCateringHoles(),
                fetchCompetitionInfo(competitionId),
                getFoodChoices(),
            ])
            setHoles(holeList)
            setFoodChoiceEnabled(Boolean(comp.food_choice_enabled))
            if (fc === null) {
                setNoPlayerRow(true)
                setSavedFood(null)
                setSoupDraft(null)
                setPizzaDraft(null)
            } else {
                setNoPlayerRow(false)
                setSavedFood({is_vege_food: fc.is_vege_food, pizza: fc.pizza})
                if (fc.pizza == null) {
                    // Defaults before first save: Lihaga supp + Türi
                    setSoupDraft(false)
                    setPizzaDraft('tyri')
                } else {
                    setSoupDraft(fc.is_vege_food)
                    setPizzaDraft(fc.pizza as PizzaChoiceId)
                }
            }
        } catch (e) {
            console.error(e)
            showToast(t('catering.toastLoadFailed'), 'error')
        } finally {
            setLoading(false)
        }
    }, [competitionId, getCateringHoles, fetchCompetitionInfo, getFoodChoices, showToast])

    // Only re-fetch when competition changes — not when toast/API wrapper identities change after save.
    useEffect(() => {
        void loadPage()
        // eslint-disable-next-line react-hooks/exhaustive-deps -- loadPage intentionally omitted; stable-enough deps below
    }, [competitionId])

    const hasSavedChoices = savedFood != null && savedFood.pizza != null
    const canSave =
        foodChoiceEnabled &&
        !noPlayerRow &&
        soupDraft !== null &&
        pizzaDraft != null &&
        !saving

    const handleSave = async () => {
        if (!canSave || pizzaDraft == null) return
        setSaving(true)
        try {
            const data = await patchFoodChoices({
                is_vege_food: soupDraft === true,
                pizza: pizzaDraft,
            })
            setSavedFood({is_vege_food: data.is_vege_food, pizza: data.pizza})
            setSoupDraft(data.is_vege_food)
            setPizzaDraft((data.pizza as PizzaChoiceId) ?? null)
            showToast(t('catering.toastSaved'), 'success')
        } catch (e) {
            console.error(e)
            showToast(e instanceof Error ? e.message : t('catering.toastSaveFailed'), 'error')
        } finally {
            setSaving(false)
        }
    }

    const soupLabel = (vege: boolean) => (vege ? t('catering.vegeSoup') : t('catering.meatSoup'))

    return (
        <Layout>
            <Box sx={{width: '100%', px: 2, py: 3, boxSizing: 'border-box', maxWidth: 560, mx: 'auto'}}>
                <Typography variant="h4" fontWeight="bold" textAlign="center">
                    {t('catering.title')}
                </Typography>
                <Typography variant="subtitle1" fontWeight={700} sx={{mt: 2.5, mb: 1, textAlign: 'center'}}>
                    {t('catering.choicesTitle')}
                </Typography>

                {loading && competitionId != null && Number.isFinite(competitionId) ? (
                    <Box display="flex" justifyContent="center" py={6}>
                        <CircularProgress/>
                    </Box>
                ) : (
                    <>
                        {competitionId != null && Number.isFinite(competitionId) && (
                            <Box sx={{
                                mt: 1,
                                p: 2,
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: 'background.paper'
                            }}>
                                {noPlayerRow ? (
                                    <Typography variant="body2" color="text.secondary">
                                        {t('catering.notRegistered')}
                                    </Typography>
                                ) : foodChoiceEnabled ? (
                                    <>
                                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                            {t('catering.lunchSoup')}
                                        </Typography>

                                        <FormControl component="fieldset" sx={{width: '100%', mb: 2}}>
                                            <RadioGroup
                                                value={soupDraft === null ? '' : soupDraft ? 'vege' : 'meat'}
                                                onChange={(_, v) => {
                                                    if (v === 'meat') setSoupDraft(false)
                                                    else if (v === 'vege') setSoupDraft(true)
                                                }}
                                            >
                                                <FormControlLabel
                                                    value="meat"
                                                    control={<Radio size="small"/>}
                                                    label={
                                                        <Typography
                                                            component="span"
                                                            variant="body2"
                                                            fontWeight={soupDraft === false ? 700 : 400}
                                                            sx={{lineHeight: "1.25rem"}}
                                                        >
                                                            {t('catering.meatSoup')}
                                                        </Typography>
                                                    }
                                                    sx={{alignItems: 'center', ml: 0, mr: 0}}
                                                />
                                                <FormControlLabel
                                                    value="vege"
                                                    control={<Radio size="small"/>}
                                                    label={
                                                        <Typography
                                                            component="span"
                                                            variant="body2"
                                                            fontWeight={soupDraft === true ? 700 : 400}
                                                            sx={{lineHeight: "1.25rem"}}
                                                        >
                                                            {t('catering.vegeSoup')}
                                                        </Typography>
                                                    }
                                                    sx={{alignItems: 'center', ml: 0, mr: 0}}
                                                />
                                            </RadioGroup>
                                        </FormControl>
                                        <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{mt: 1}}>
                                            {t('catering.dinnerPizza')}
                                        </Typography>

                                        <FormControl component="fieldset" sx={{width: '100%'}}>
                                            <RadioGroup
                                                value={pizzaDraft ?? ''}
                                                onChange={(_, v) => setPizzaDraft(v as PizzaChoiceId)}
                                            >
                                                {PIZZA_IDS.map((id) => (
                                                    <Box
                                                        key={id}
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 0.5,
                                                            mb: 0.5,
                                                        }}
                                                    >
                                                        <FormControlLabel
                                                            value={id}
                                                            control={<Radio size="small"/>}
                                                            label={
                                                                <Typography
                                                                    component="span"
                                                                    variant="body2"
                                                                    fontWeight={pizzaDraft === id ? 700 : 400}
                                                                    sx={{lineHeight: "1.25rem"}}
                                                                >
                                                                    {pizzaLabel(id)}
                                                                </Typography>
                                                            }
                                                            sx={{flex: 1, alignItems: 'center', ml: 0, mr: 0}}
                                                        />
                                                        <IconButton
                                                            size="small"
                                                            aria-label={t('catering.ariaIngredients', {
                                                                label: pizzaLabel(id),
                                                            })}
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                setIngredientsDialog({
                                                                    title: pizzaLabel(id),
                                                                    text: pizzaIngredients(id),
                                                                })
                                                            }}
                                                            sx={{color: 'text.secondary', flexShrink: 0}}
                                                        >
                                                            <SearchIcon fontSize="small"/>
                                                        </IconButton>
                                                    </Box>
                                                ))}
                                            </RadioGroup>
                                        </FormControl>
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            sx={{mt: 2}}
                                            disabled={!canSave}
                                            onClick={() => void handleSave()}
                                        >
                                            {saving ? <CircularProgress size={22} color="inherit"/> : t('catering.save')}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                            {t('catering.lunch')}
                                        </Typography>
                                        <Typography variant="body2" sx={{mb: 1.5}}>
                                            <strong>{t('catering.soupLabel')}</strong>{' '}
                                            <Typography component="span" variant="body2"
                                                        fontWeight={hasSavedChoices ? 700 : 400}>
                                                {hasSavedChoices ? soupLabel(savedFood!.is_vege_food) : t('catering.notChosen')}
                                            </Typography>
                                        </Typography>
                                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                            {t('catering.dinner')}
                                        </Typography>
                                        <Typography variant="body2" sx={{mb: 1}}>
                                            <strong>{t('catering.pizzaLabel')}</strong>{' '}
                                            <Typography component="span" variant="body2"
                                                        fontWeight={hasSavedChoices ? 700 : 400}>
                                                {hasSavedChoices ? pizzaLabel(savedFood!.pizza) : t('catering.notChosen')}
                                            </Typography>
                                        </Typography>
                                        {hasSavedChoices && savedFood!.pizza ? (
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0.5,
                                                flexWrap: 'wrap'
                                            }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {t('catering.eveningIngredients')}
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    aria-label={t('catering.ariaViewIngredients')}
                                                    onClick={() =>
                                                        setIngredientsDialog({
                                                            title: pizzaLabel(savedFood!.pizza),
                                                            text: pizzaIngredients(savedFood!.pizza),
                                                        })
                                                    }
                                                    sx={{color: 'text.secondary'}}
                                                >
                                                    <SearchIcon fontSize="small"/>
                                                </IconButton>
                                            </Box>
                                        ) : null}
                                        <Typography variant="caption" color="text.secondary" display="block"
                                                    sx={{mt: 1}}>
                                            {t('catering.choicesClosed')}
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        )}

                        <Box sx={{mt: competitionId != null && Number.isFinite(competitionId) ? 4 : 3}}>

                            <Typography variant="subtitle1" fontWeight={700} sx={{mt: 2.5, mb: 1, textAlign: 'center'}}>
                                {t('catering.pointsTitle')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{textAlign: 'center', mb:"1rem"}}>
                                {t('catering.pointsHint')}
                            </Typography>
                            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
                                {holes.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary" textAlign="center">
                                        {t('catering.noPoints')}
                                    </Typography>
                                ) : (
                                    holes.map((hole) => (
                                        <Box
                                            key={hole.id}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                width: '100%',
                                                boxSizing: 'border-box',
                                                borderRadius: 2,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                backgroundColor: 'background.paper',
                                                px: 2,
                                                py: 1.5,
                                                minHeight: 56,
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: '50%',
                                                    bgcolor: 'action.hover',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Typography variant="body1" fontWeight={700} color="text.primary">
                                                    {hole.number}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body1" fontWeight={600} sx={{pl: 2}}>
                                                {t('catering.basket', {n: hole.number})}
                                            </Typography>
                                        </Box>
                                    ))
                                )}
                            </Box>
                        </Box>
                    </>
                )}
            </Box>

            <Dialog
                open={ingredientsDialog != null}
                onClose={() => setIngredientsDialog(null)}
                fullWidth
                maxWidth="sm"
                aria-labelledby="ingredients-dialog-title"
            >
                <DialogTitle id="ingredients-dialog-title">{ingredientsDialog?.title}</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{pt: 0.5}}>
                        {ingredientsDialog?.text}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{px: 3, pb: 2}}>
                    <Button onClick={() => setIngredientsDialog(null)}>{t('catering.dialogClose')}</Button>
                </DialogActions>
            </Dialog>
        </Layout>
    )
}
