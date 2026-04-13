import {authedFetch} from '@/src/api/authedFetch'
import {API_BASE} from '@/src/api/config'
import type {PizzaChoiceId} from '@/src/constants/cateringPizzas'

export type FoodChoicesState = {
    is_vege_food: boolean
    pizza: string | null
}

const getFoodChoices = async (): Promise<FoodChoicesState | null> => {
    const res = await authedFetch(`${API_BASE}/player/food-choices`)
    if (!res.ok) throw new Error('Failed to load food choices')
    const json = (await res.json()) as { success: boolean; data: FoodChoicesState | null }
    return json.data ?? null
}

const patchFoodChoices = async (body: { is_vege_food: boolean; pizza: PizzaChoiceId }): Promise<FoodChoicesState> => {
    const res = await authedFetch(`${API_BASE}/player/food-choices`, {
        method: 'PATCH',
        body: JSON.stringify(body),
    })
    const json = (await res.json().catch(() => ({}))) as {
        success?: boolean
        data?: FoodChoicesState
        error?: string
    }
    if (!res.ok || json.success === false) {
        throw new Error(json.error ?? 'Salvestamine ebaõnnestus')
    }
    if (!json.data) throw new Error('Salvestamine ebaõnnestus')
    return json.data
}

export default function useFoodChoicesApi() {
    return { getFoodChoices, patchFoodChoices }
}
