export type HoleEntity = {
    id: number
    number: number
    is_ctp: boolean
}

export type HoleResult = {
    hole: {
        id: number
        number: number
        is_ctp: boolean
        length: number
        coordinates: string
        rank: number
        average_diff: number
        ob_percent: number
        eagles?: number
        birdies?: number
        pars?: number
        bogeys?: number
        double_bogeys?: number
        others?: number
    }
    ctp: {
        id: number
        hole_id: number
        player_id: number
        distance_cm: number
        created_date: string
        player: {
            id: number
            name: string
        }
    }[]
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

if (!API_BASE) {
    throw new Error('Missing NEXT_PUBLIC_API_BASE_URL')
}

const getHole = async (holeNumber: number): Promise<HoleResult | null> => {
    const res = await fetch(`${API_BASE}/hole/${holeNumber}`)
    if (!res.ok) return null
    return await res.json()
}

const getTopRankedHoles = async (): Promise<HoleResult[]> => {
    const res = await fetch(`${API_BASE}/holes/top-ranked`)
    if (!res.ok) throw new Error('Failed to fetch top ranked holes')
    return await res.json()
}

const getHoles = async (): Promise<HoleResult[]> => {
    const res = await fetch(`${API_BASE}/holes`)
    if (!res.ok) throw new Error('Failed to fetch top ranked holes')
    return await res.json()
}

const submitCtp = async (holeId: number, playerId: number, distanceCm: number) => {
    const res = await fetch(`${API_BASE}/ctp/${holeId}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({player_id: playerId, distance_cm: distanceCm}),
    })

    if (!res.ok) throw new Error('Failed to submit CTP')
    return await res.json()
}

const getCtpHoles = async (): Promise<HoleResult[]> => {
    const res = await fetch(`${API_BASE}/holes/ctp`)
    if (!res.ok) throw new Error(`Failed to fetch CTP holes: ${res.status}`)
    return await res.json()
}

export default function useCtpApi() {
    return {
        getHole,
        getTopRankedHoles,
        getHoles,
        submitCtp,
        getCtpHoles
    }
}
