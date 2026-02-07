import {authedFetch} from "@/src/api/authedFetch"
import {API_BASE} from "@/src/api/config"

export type AdminCompetition = {
    id: number
    name: string | null
    competition_date: string | null
    status: 'waiting' | 'started' | 'finished'
    ctp_enabled: boolean
    checkin_enabled: boolean
    prediction_enabled: boolean
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

const updateDidRainEnabled = (competitionId: number, enabled: boolean) =>
    patchCompetitionField(competitionId, 'did-rain', { enabled }, 'Failed to update did rain setting')

const updateCompetitionStatus = async (
    competitionId: number,
    status: 'waiting' | 'started' | 'finished'
): Promise<void> => {
    patchCompetitionField(competitionId, 'status', { status }, 'Failed to update competition status')
}

export default function useAdminApi() {
    return {
        getAdminCompetitions,
        getAdminCompetition,
        updateCtpEnabled,
        updateCheckinEnabled,
        updatePredictionEnabled,
        updateDidRainEnabled,
        updateCompetitionStatus,
    }
}
