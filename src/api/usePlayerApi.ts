import {authedFetch} from "@/src/api/authedFetch";

export type Player = {
    playerId: number
    email: string
    metrixUserId: number
    name: string
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


export default function usePlayerApi() {
    return {
        getLoggedInUser, getPlayerParticipations, getParticipationLeaders
    }
}