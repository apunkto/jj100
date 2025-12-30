import {authedFetch} from "@/src/api/authedFetch";

export type Player = {
    playerId: number
    email: string
    metrixUserId: number
    name: string
}


const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

if (!API_BASE) {
    throw new Error('Missing NEXT_PUBLIC_API_BASE_URL')
}


const getLoggedInUser = async (): Promise<Player | null> => {
    const res = await authedFetch(`${API_BASE}/me` )
    if (!res.ok) return null
    const result = await res.json() as { data: Player }
    return result.data
}


export default function usePlayerApi() {
    return {
        getLoggedInUser,
    }
}