import {authedFetch} from '@/src/api/authedFetch'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

if (!API_BASE) {
    throw new Error('Missing NEXT_PUBLIC_API_BASE_URL')
}

export type ActualResults = {
    best_overall_score: number | null
    best_female_score: number | null
    will_rain: boolean | null
    player_own_score: number | null
    hole_in_ones_count: number | null
    water_discs_count: number | null
}

export type Prediction = {
    id: number
    metrix_competition_id: number
    player_id: number
    best_overall_score: number | null
    best_female_score: number | null
    will_rain: boolean | null
    player_own_score: number | null
    hole_in_ones_count: number | null
    water_discs_count: number | null
    created_date: string
    updated_date: string
    actual_results?: ActualResults
}

export type PredictionLeaderboardEntry = {
    player_name: string
    player_id?: number
    score: number
    rank: number
}

export type PredictionLeaderboardResponse = {
    top_10: PredictionLeaderboardEntry[]
    user_rank: PredictionLeaderboardEntry | null
}

export type PredictionData = {
    best_overall_score?: number | null
    best_female_score?: number | null
    will_rain?: boolean | null
    player_own_score?: number | null
    hole_in_ones_count?: number | null
    water_discs_count?: number | null
}

const getPrediction = async (competitionId: number): Promise<Prediction | null> => {
    const res = await authedFetch(`${API_BASE}/prediction/${competitionId}`)
    if (!res.ok) {
        if (res.status === 404) {
            return null
        }
        const error = (await res.json().catch(() => ({}))) as { error?: string; code?: string }
        // If prediction is not enabled, return null instead of throwing (user can still view leaderboard)
        if (res.status === 403 && error.error?.includes('not enabled')) {
            return null
        }
        const err: any = new Error(error.error || 'Failed to fetch prediction')
        if (error.code) {
            err.code = error.code
        }
        throw err
    }
    const json = (await res.json()) as { success: boolean; data: Prediction | null }
    return json.data
}

const createPrediction = async (competitionId: number, data: PredictionData): Promise<Prediction> => {
    const res = await authedFetch(`${API_BASE}/prediction/${competitionId}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
    })
    if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as { error?: string; code?: string }
        const err: any = new Error(error.error || 'Failed to create prediction')
        if (error.code) {
            err.code = error.code
        }
        throw err
    }
    const json = (await res.json()) as { success: boolean; data: Prediction }
    return json.data
}

const updatePrediction = async (competitionId: number, data: PredictionData): Promise<Prediction> => {
    const res = await authedFetch(`${API_BASE}/prediction/${competitionId}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
    })
    if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as { error?: string; code?: string }
        const err: any = new Error(error.error || 'Failed to update prediction')
        if (error.code) {
            err.code = error.code
        }
        throw err
    }
    const json = (await res.json()) as { success: boolean; data: Prediction }
    return json.data
}

const getLeaderboard = async (competitionId: number): Promise<PredictionLeaderboardResponse> => {
    const res = await authedFetch(`${API_BASE}/prediction/${competitionId}/leaderboard`)
    if (!res.ok) {
        throw new Error('Failed to fetch leaderboard')
    }
    const json = (await res.json()) as { success: boolean; data: PredictionLeaderboardResponse }
    return json.data
}

const getPlayerPrediction = async (competitionId: number, playerId: number): Promise<{prediction: Prediction | null; player_name: string}> => {
    const res = await authedFetch(`${API_BASE}/prediction/${competitionId}/player/${playerId}`)
    if (!res.ok) {
        if (res.status === 404) {
            return {prediction: null, player_name: 'Tundmatu mängija'}
        }
        // For 403 or other errors, still return null prediction instead of throwing
        // This allows the dialog to open and show "no prediction" message
        const error = (await res.json().catch(() => ({}))) as { error?: string }
        console.warn('Failed to fetch player prediction:', error.error || 'Unknown error')
        return {prediction: null, player_name: 'Tundmatu mängija'}
    }
    const json = (await res.json()) as { success: boolean; data: {prediction: Prediction | null; player_name: string} }
    return json.data
}

export default function usePredictionApi() {
    return {
        getPrediction,
        createPrediction,
        updatePrediction,
        getLeaderboard,
        getPlayerPrediction,
    }
}
