import {authedFetch} from "@/src/api/authedFetch";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

if (!API_BASE) {
    throw new Error('Missing NEXT_PUBLIC_API_BASE_URL')
}

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

const updateCtpEnabled = async (competitionId: number, enabled: boolean): Promise<void> => {
    const res = await authedFetch(`${API_BASE}/admin/competition/${competitionId}/ctp`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ enabled }),
    })
    if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(error.error || 'Failed to update CTP setting')
    }
}

const updateCheckinEnabled = async (competitionId: number, enabled: boolean): Promise<void> => {
    const res = await authedFetch(`${API_BASE}/admin/competition/${competitionId}/checkin`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ enabled }),
    })
    if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(error.error || 'Failed to update checkin setting')
    }
}

const updatePredictionEnabled = async (competitionId: number, enabled: boolean): Promise<void> => {
    const res = await authedFetch(`${API_BASE}/admin/competition/${competitionId}/prediction`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ enabled }),
    })
    if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(error.error || 'Failed to update prediction setting')
    }
}

const updateDidRainEnabled = async (competitionId: number, enabled: boolean): Promise<void> => {
    const res = await authedFetch(`${API_BASE}/admin/competition/${competitionId}/did-rain`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ enabled }),
    })
    if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(error.error || 'Failed to update did rain setting')
    }
}

export default function useAdminApi() {
    return {
        getAdminCompetitions,
        getAdminCompetition,
        updateCtpEnabled,
        updateCheckinEnabled,
        updatePredictionEnabled,
        updateDidRainEnabled,
    }
}
