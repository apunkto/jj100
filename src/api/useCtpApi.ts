import {ApiResponse, authedFetch} from "@/src/api/authedFetch";

export type HoleEntity = {
    id: number
    number: number
    is_ctp: boolean
}

export type CtpEntry = {
    id: number
    hole_id: number
    player_id: number
    distance_cm: number
    created_date: string
    player: {
        id: number
        name: string
    }
}

export type HoleWithCtp = {
    hole: Hole
    ctp: CtpEntry[]
}

export type Hole = {
    id: number
    number: number
    is_ctp: boolean
    par: number
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
    rules: string
    is_food: boolean
    /** Hole card image filename (e.g. "1.webp" or "1"). Use /cards/{card_img} or fallback to number-based. */
    card_img?: string | null
    /** Logged-in user's result (throws) on this hole when available from /hole/:number */
    user_result?: string | null
    /** Whether the user had a penalty (OB etc.) on this hole */
    user_has_penalty?: boolean
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

if (!API_BASE) {
    throw new Error('Missing NEXT_PUBLIC_API_BASE_URL')
}

const getHole = async (holeNumber: number, competitionId?: number | null): Promise<Hole | null> => {
    const url = competitionId != null
        ? `${API_BASE}/hole/${holeNumber}?competitionId=${competitionId}`
        : `${API_BASE}/hole/${holeNumber}`
    const res = await authedFetch(url)
    if (!res.ok) return null
    const json = (await res.json()) as { hole?: Hole }
    return json?.hole ?? null
}

const getCtpByHoleNumber = async (holeNumber: number, competitionId?: number | null): Promise<CtpEntry[]> => {
    const url = competitionId != null
        ? `${API_BASE}/hole/${holeNumber}/ctp?competitionId=${competitionId}`
        : `${API_BASE}/hole/${holeNumber}/ctp`
    const res = await authedFetch(url)
    if (!res.ok) return []
    return await res.json()
}

const getTopRankedHoles = async (competitionId?: number | null): Promise<HoleWithCtp[]> => {
    const url = competitionId != null
        ? `${API_BASE}/holes/top-ranked?competitionId=${competitionId}`
        : `${API_BASE}/holes/top-ranked`
    const res = await authedFetch(url)
    if (!res.ok) throw new Error('Failed to fetch top ranked holes')
    return await res.json()
}

const getHoles = async (competitionId?: number | null): Promise<HoleWithCtp[]> => {
    const url = competitionId != null
        ? `${API_BASE}/holes?competitionId=${competitionId}`
        : `${API_BASE}/holes`
    const res = await authedFetch(url)
    if (!res.ok) throw new Error('Failed to fetch holes')
    return await res.json()
}

const getHoleCount = async (competitionId?: number | null): Promise<number | null> => {
    const url = competitionId != null
        ? `${API_BASE}/holes/count?competitionId=${competitionId}`
        : `${API_BASE}/holes/count`
    const res = await authedFetch(url)
    if (!res.ok) return null
    const json = (await res.json()) as { count?: number }
    return typeof json?.count === 'number' ? json.count : null
}

export const submitCtp = async (holeId: number, distanceCm: number) => {
    const res = await authedFetch(`${API_BASE}/ctp/${holeId}`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({distance_cm: distanceCm}),
    })

    const payload = (await res.json().catch(() => null)) as ApiResponse<unknown> | null

    if (!res.ok || payload?.success === false) {
        const msg = payload?.error?.message ?? "CTP sisestamine ebaõnnestus!"
        const err: any = new Error(msg)
        err.code = payload?.error?.code
        throw err
    }

    return payload
}


const getCtpHoles = async (): Promise<HoleWithCtp[]> => {
    const res = await authedFetch(`${API_BASE}/holes/ctp`)
    if (!res.ok) throw new Error(`Failed to fetch CTP holes: ${res.status}`)
    return await res.json()
}

export default function useCtpApi() {
    return {
        getHole,
        getCtpByHoleNumber,
        getTopRankedHoles,
        getHoles,
        getHoleCount,
        submitCtp,
        getCtpHoles,
    }
}
