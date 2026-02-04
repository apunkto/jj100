// useConfigApi.ts

import {authedFetch} from "@/src/api/authedFetch";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL
if (!API_BASE) {
    throw new Error('Missing NEXT_PUBLIC_API_BASE_URL')
}

type CompetitionInfo = {
    id: number
    name: string | null
    ctp_enabled: boolean
    checkin_enabled: boolean
}

const fetchCompetitionInfo = async (competitionId: number): Promise<CompetitionInfo> => {
    const res = await authedFetch(`${API_BASE}/competition/${competitionId}`)
    if (!res.ok) {
        throw new Error(`Failed to fetch competition info`)
    }
    
    const data = (await res.json()) as { success: boolean; data: CompetitionInfo }
    return data.data
}

const resolveCompetitionId = async (competitionId: number | null | undefined): Promise<number | null> => {
    let activeCompetitionId = competitionId ?? null
    
    if (!activeCompetitionId) {
        const res = await authedFetch(`${API_BASE}/me`)
        if (res.ok) {
            const data = (await res.json()) as { success: boolean; data: { activeCompetitionId: number | null } }
            activeCompetitionId = data.data?.activeCompetitionId ?? null
        }
    }
    
    return activeCompetitionId
}

export default function useConfigApi() {
    const isCtpEnabled = async (competitionId?: number | null): Promise<boolean> => {
        const id = await resolveCompetitionId(competitionId)
        if (!id) return false
        const competition = await fetchCompetitionInfo(id)
        return competition.ctp_enabled
    }
    
    const isCheckinEnabled = async (competitionId?: number | null): Promise<boolean> => {
        const id = await resolveCompetitionId(competitionId)
        if (!id) return false
        const competition = await fetchCompetitionInfo(id)
        return competition.checkin_enabled
    }
    
    return {
        isCtpEnabled,
        isCheckinEnabled,
    }
}
