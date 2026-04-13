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
import {PIZZA_OPTIONS, type PizzaChoiceId, pizzaIngredients, pizzaLabel,} from '@/src/constants/cateringPizzas'
import {useAuth} from '@/src/contexts/AuthContext'
import {useToast} from '@/src/contexts/ToastContext'

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

    const { user } = useAuth()
    const { showToast } = useToast()
    const { getCateringHoles } = useCtpApi()
    const { fetchCompetitionInfo } = useConfigApi()
    const { getFoodChoices, patchFoodChoices } = useFoodChoicesApi()

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
                setSavedFood({ is_vege_food: fc.is_vege_food, pizza: fc.pizza })
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
            showToast('Andmete laadimine ebaõnnestus', 'error')
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
            setSavedFood({ is_vege_food: data.is_vege_food, pizza: data.pizza })
            setSoupDraft(data.is_vege_food)
            setPizzaDraft((data.pizza as PizzaChoiceId) ?? null)
            showToast('Valikud salvestatud', 'success')
        } catch (e) {
            console.error(e)
            showToast(e instanceof Error ? e.message : 'Salvestamine ebaõnnestus', 'error')
        } finally {
            setSaving(false)
        }
    }

    const soupLabel = (vege: boolean) => (vege ? 'Vege supp' : 'Lihaga supp')

    return (
        <Layout>
            <Box sx={{ width: '100%', px: 2, py: 3, boxSizing: 'border-box', maxWidth: 560, mx: 'auto' }}>
                <Typography variant="h4" fontWeight="bold" textAlign="center">
                    Toitlustus
                </Typography>

                {loading && competitionId != null && Number.isFinite(competitionId) ? (
                    <Box display="flex" justifyContent="center" py={6}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                {competitionId != null && Number.isFinite(competitionId) && (
                    <Box sx={{ mt: 3, p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        {noPlayerRow ? (
                            <Typography variant="body2" color="text.secondary">
                                Sinu osalemist sellel võistlusel ei leitud — toiduvalikud pole saadaval.
                            </Typography>
                        ) : foodChoiceEnabled ? (
                            <>
                                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                    Lõuna
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    Supp
                                </Typography>
                                <FormControl component="fieldset" sx={{ width: '100%', mb: 2 }}>
                                    <RadioGroup
                                        value={soupDraft === null ? '' : soupDraft ? 'vege' : 'meat'}
                                        onChange={(_, v) => {
                                            if (v === 'meat') setSoupDraft(false)
                                            else if (v === 'vege') setSoupDraft(true)
                                        }}
                                    >
                                        <FormControlLabel
                                            value="meat"
                                            control={<Radio size="small" />}
                                            label={
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    fontWeight={soupDraft === false ? 700 : 400}
                                                    sx={{ lineHeight: 1.25 }}
                                                >
                                                    Lihaga supp
                                                </Typography>
                                            }
                                            sx={{ alignItems: 'center', ml: 0, mr: 0 }}
                                        />
                                        <FormControlLabel
                                            value="vege"
                                            control={<Radio size="small" />}
                                            label={
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    fontWeight={soupDraft === true ? 700 : 400}
                                                    sx={{ lineHeight: 1.25 }}
                                                >
                                                    Vege supp
                                                </Typography>
                                            }
                                            sx={{ alignItems: 'center', ml: 0, mr: 0 }}
                                        />
                                    </RadioGroup>
                                </FormControl>
                                <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ mt: 1 }}>
                                    Õhtu
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    Pitsa
                                </Typography>
                                <FormControl component="fieldset" sx={{ width: '100%' }}>
                                    <RadioGroup
                                        value={pizzaDraft ?? ''}
                                        onChange={(_, v) => setPizzaDraft(v as PizzaChoiceId)}
                                    >
                                        {PIZZA_OPTIONS.map((p) => (
                                            <Box
                                                key={p.id}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    mb: 0.5,
                                                }}
                                            >
                                                <FormControlLabel
                                                    value={p.id}
                                                    control={<Radio size="small" />}
                                                    label={
                                                        <Typography
                                                            component="span"
                                                            variant="body2"
                                                            fontWeight={pizzaDraft === p.id ? 700 : 400}
                                                            sx={{ lineHeight: 1.25 }}
                                                        >
                                                            {p.label}
                                                        </Typography>
                                                    }
                                                    sx={{ flex: 1, alignItems: 'center', ml: 0, mr: 0 }}
                                                />
                                                <IconButton
                                                    size="small"
                                                    aria-label={`${p.label} koostis`}
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        setIngredientsDialog({ title: p.label, text: p.ingredients })
                                                    }}
                                                    sx={{ color: 'text.secondary', flexShrink: 0 }}
                                                >
                                                    <SearchIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </RadioGroup>
                                </FormControl>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    sx={{ mt: 2 }}
                                    disabled={!canSave}
                                    onClick={() => void handleSave()}
                                >
                                    {saving ? <CircularProgress size={22} color="inherit" /> : 'Salvesta'}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                    Lõuna
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1.5 }}>
                                    <strong>Supp:</strong>{' '}
                                    <Typography component="span" variant="body2" fontWeight={hasSavedChoices ? 700 : 400}>
                                        {hasSavedChoices ? soupLabel(savedFood!.is_vege_food) : 'Pole valitud'}
                                    </Typography>
                                </Typography>
                                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                    Õhtu
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Pitsa:</strong>{' '}
                                    <Typography component="span" variant="body2" fontWeight={hasSavedChoices ? 700 : 400}>
                                        {hasSavedChoices ? pizzaLabel(savedFood!.pizza) : 'Pole valitud'}
                                    </Typography>
                                </Typography>
                                {hasSavedChoices && savedFood!.pizza ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Õhtu — valitud pitsa koostis
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            aria-label="Vaata valitud pitsa koostist"
                                            onClick={() =>
                                                setIngredientsDialog({
                                                    title: pizzaLabel(savedFood!.pizza),
                                                    text: pizzaIngredients(savedFood!.pizza),
                                                })
                                            }
                                            sx={{ color: 'text.secondary' }}
                                        >
                                            <SearchIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ) : null}
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                    Valikute muutmine on praegu suletud.
                                </Typography>
                            </>
                        )}
                    </Box>
                )}

                <Box sx={{ mt: competitionId != null && Number.isFinite(competitionId) ? 4 : 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                        Toitlustuspunktid avatakse kell 11:00. Palun söö esimeses toitlustuspunktis, kuhu jõuad peale 11:00 — järgmises
                        punktis ei pruugi Sulle toitu jätkuda!
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 2.5, mb: 1, textAlign: 'center' }}>
                        Toitlustuspunktid rajal
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {holes.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" textAlign="center">
                                Toitlustuspunkte pole märgitud.
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
                                    <Typography variant="body1" fontWeight={600} sx={{ pl: 2 }}>
                                        Korv {hole.number}
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
                    <Typography variant="body2" color="text.secondary" sx={{ pt: 0.5 }}>
                        {ingredientsDialog?.text}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setIngredientsDialog(null)}>Sulge</Button>
                </DialogActions>
            </Dialog>
        </Layout>
    )
}
