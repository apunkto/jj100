export type Player = {
    id: string
    name: string
}


const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

if (!API_BASE) {
    throw new Error('Missing NEXT_PUBLIC_API_BASE_URL')
}
const getPlayers = async (): Promise<Player[]> => {
    const res = await fetch(`${API_BASE}/players`)
    if (!res.ok) throw new Error('Failed to fetch players')
    const result = await res.json() as { data: Player[] }
    return result.data

}


export default function usePlayerApi() {
    return {
        getPlayers,
    }
}