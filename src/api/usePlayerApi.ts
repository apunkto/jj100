import {authedFetch} from "@/src/api/authedFetch";
import {useCallback, useMemo} from "react";

export type Player = {
    playerId: number
    email: string
    metrixUserId: number
    name: string
    activeCompetitionId: number | null
    isAdmin: boolean
}

export type CompetitionOption = {
    id: number
    name: string | null
}

export type UserParticipation = {
    year: number
    place: number
    score: number
}

export type ParticipationLeaderboard = {
    maxAmount: number
    buckets: Array<{
        amount: number
        players: Array<{ metrixUserId: number; name: string }>
    }>
}


const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

if (!API_BASE) {
    throw new Error('Missing NEXT_PUBLIC_API_BASE_URL')
}


const getLoggedInUser = async (): Promise<Player | null> => {
    const res = await authedFetch(`${API_BASE}/me`)
    if (!res.ok) return null
    const result = await res.json() as { data: Player }
    return result.data
}


const getPlayerParticipations = async (): Promise<UserParticipation[]> => {
    const res = await authedFetch(`${API_BASE}/player/participations`)
    if (!res.ok) return []
    const result = await res.json() as { data: UserParticipation[] }
    return result.data
}

async function getParticipationLeaders(): Promise<ParticipationLeaderboard | null> {
    const res = await authedFetch(`${API_BASE}/player/participations/leaders?v=3`)
    if (!res.ok) return null
    const json = (await res.json()) as { data: ParticipationLeaderboard }
    return json.data ?? null
}

const getPlayerCompetitions = async (): Promise<CompetitionOption[]> => {
    const res = await authedFetch(`${API_BASE}/player/competitions`)
    if (!res.ok) return []
    const result = await res.json() as { data: CompetitionOption[] }
    return result.data ?? []
}

const setActiveCompetition = async (activeCompetitionId: number): Promise<Player | null> => {
    const res = await authedFetch(`${API_BASE}/player/active-competition`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeCompetitionId }),
    })
    if (!res.ok) return null
    const result = await res.json() as { data: Player }
    return result.data
}

export default function usePlayerApi() {
    const getLoggedInUserMemo = useCallback(getLoggedInUser, [])
    const getPlayerParticipationsMemo = useCallback(getPlayerParticipations, [])
    const getParticipationLeadersMemo = useCallback(getParticipationLeaders, [])
    const getPlayerCompetitionsMemo = useCallback(getPlayerCompetitions, [])
    const setActiveCompetitionMemo = useCallback(setActiveCompetition, [])
    
    return useMemo(() => ({
        getLoggedInUser: getLoggedInUserMemo,
        getPlayerParticipations: getPlayerParticipationsMemo,
        getParticipationLeaders: getParticipationLeadersMemo,
        getPlayerCompetitions: getPlayerCompetitionsMemo,
        setActiveCompetition: setActiveCompetitionMemo,
    }), [getLoggedInUserMemo, getPlayerParticipationsMemo, getParticipationLeadersMemo, getPlayerCompetitionsMemo, setActiveCompetitionMemo])
}