import {authedFetch} from "@/src/api/authedFetch"
import {API_BASE} from "@/src/api/config"

export type PaceOfPlayTopPool = {
    pool_number: number
    current_hole: number
    holes_ahead_empty: number
    pools_waiting_same_hole: number
    pools_waiting_previous_hole: number
    pools_waiting_total: number
    player_count: number
    updated_date?: string | null
}

export type PaceOfPlayPoolPlayer = {
    user_id: string
    name: string | null
}

export type AdminCompetition = {
    id: number
    name: string | null
    competition_date: string | null
    status: 'waiting' | 'started' | 'finished'
    ctp_enabled: boolean
    checkin_enabled: boolean
    prediction_enabled: boolean
    food_choice_enabled?: boolean
    did_rain: boolean
}

const getAdminCompetitions = async (): Promise<AdminCompetition[]> => {
    const res = await authedFetch(`${API_BASE}/admin/competitions`)
    if (!res.ok) {
        throw new Error('Failed to fetch competitions')
    }
    const json = (await res.json()) as { success: boolean; data: AdminCompetition[] }
    return json.data
}

const getAdminCompetition = async (competitionId: number): Promise<AdminCompetition | null> => {
    const competitions = await getAdminCompetitions()
    return competitions.find(c => c.id === competitionId) ?? null
}

const patchCompetitionField = async (
    competitionId: number,
    field: string,
    payload: Record<string, unknown>,
    errorMessage: string
): Promise<void> => {
    const res = await authedFetch(`${API_BASE}/admin/competition/${competitionId}/${field}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    })
    if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(error.error || errorMessage)
    }
}

const updateCtpEnabled = (competitionId: number, enabled: boolean) =>
    patchCompetitionField(competitionId, 'ctp', { enabled }, 'Failed to update CTP setting')

const updateCheckinEnabled = (competitionId: number, enabled: boolean) =>
    patchCompetitionField(competitionId, 'checkin', { enabled }, 'Failed to update checkin setting')

const updatePredictionEnabled = (competitionId: number, enabled: boolean) =>
    patchCompetitionField(competitionId, 'prediction', { enabled }, 'Failed to update prediction setting')

const updateFoodChoiceEnabled = (competitionId: number, enabled: boolean) =>
    patchCompetitionField(competitionId, 'food-choice', { enabled }, 'Failed to update food choice setting')

const updateDidRainEnabled = (competitionId: number, enabled: boolean) =>
    patchCompetitionField(competitionId, 'did-rain', { enabled }, 'Failed to update did rain setting')

const updateCompetitionStatus = async (
    competitionId: number,
    status: 'waiting' | 'started' | 'finished'
): Promise<void> => {
    await patchCompetitionField(competitionId, 'status', { status }, 'Failed to update competition status')
}

export type RunMetrixSyncSuccessResponse = {
    success: true
    result: { metrix_competition_id: number; success: boolean; error?: string }
    durationMs: number
}

const runMetrixSyncForCompetition = async (competitionId: number): Promise<RunMetrixSyncSuccessResponse> => {
    const res = await authedFetch(`${API_BASE}/admin/competition/${competitionId}/run-metrix`)
    const json = (await res.json()) as RunMetrixSyncSuccessResponse | { success: false; error: string; durationMs?: number }
    if (!res.ok) {
        const errJson = json as { error?: string }
        throw new Error(errJson.error || 'Metrix sync failed')
    }
    if (!('result' in json) || json.success !== true) {
        throw new Error('Metrix sync failed')
    }
    return json
}

const getPaceOfPlayTop = async (competitionId: number): Promise<PaceOfPlayTopPool[]> => {
    const res = await authedFetch(`${API_BASE}/admin/competition/${competitionId}/pace-of-play`)
    if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error || 'Failed to fetch pace of play')
    }
    const json = (await res.json()) as { success: boolean; data: PaceOfPlayTopPool[] }
    return json.data ?? []
}

const getPaceOfPlayPoolPlayers = async (
    competitionId: number,
    poolNumber: number
): Promise<PaceOfPlayPoolPlayer[]> => {
    const res = await authedFetch(
        `${API_BASE}/admin/competition/${competitionId}/pace-of-play/pool/${poolNumber}`
    )
    if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error || 'Failed to fetch pool players')
    }
    const json = (await res.json()) as { success: boolean; data: PaceOfPlayPoolPlayer[] }
    return json.data ?? []
}

export default function useAdminApi() {
    return {
        getAdminCompetitions,
        getAdminCompetition,
        updateCtpEnabled,
        updateCheckinEnabled,
        updatePredictionEnabled,
        updateFoodChoiceEnabled,
        updateDidRainEnabled,
        updateCompetitionStatus,
        runMetrixSyncForCompetition,
        getPaceOfPlayTop,
        getPaceOfPlayPoolPlayers,
    }
}
