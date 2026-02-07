import {authedFetch} from "@/src/api/authedFetch"
import {API_BASE} from "@/src/api/config"

type CompetitionInfo = {
    id: number
    name: string | null
    ctp_enabled: boolean
    checkin_enabled: boolean
    prediction_enabled: boolean
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

type CompetitionFeature = keyof Pick<CompetitionInfo, 'ctp_enabled' | 'checkin_enabled' | 'prediction_enabled'>

const isFeatureEnabled = async (feature: CompetitionFeature, competitionId?: number | null): Promise<boolean> => {
    const id = await resolveCompetitionId(competitionId)
    if (!id) return false
    const competition = await fetchCompetitionInfo(id)
    return competition[feature]
}

export default function useConfigApi() {
    return {
        isCtpEnabled: (competitionId?: number | null) => isFeatureEnabled('ctp_enabled', competitionId),
        isCheckinEnabled: (competitionId?: number | null) => isFeatureEnabled('checkin_enabled', competitionId),
        isPredictionEnabled: (competitionId?: number | null) => isFeatureEnabled('prediction_enabled', competitionId),
    }
}
