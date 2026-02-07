import {ApiResponse, authedFetch} from "@/src/api/authedFetch"
import {API_BASE} from "@/src/api/config"
import {AppError} from "@/src/utils/AppError"

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
    card_img?: string | null
    user_result?: string | null
    user_has_penalty?: boolean
}

function withCompetitionId(url: string, competitionId?: number | null): string {
    if (competitionId != null) {
        const separator = url.includes('?') ? '&' : '?'
        return `${url}${separator}competitionId=${competitionId}`
    }
    return url
}

const getHole = async (holeNumber: number, competitionId?: number | null): Promise<Hole | null> => {
    const res = await authedFetch(withCompetitionId(`${API_BASE}/hole/${holeNumber}`, competitionId))
    if (!res.ok) return null
    const json = (await res.json()) as { hole?: Hole }
    return json?.hole ?? null
}

const getCtpByHoleNumber = async (holeNumber: number, competitionId?: number | null): Promise<CtpEntry[]> => {
    const res = await authedFetch(withCompetitionId(`${API_BASE}/hole/${holeNumber}/ctp`, competitionId))
    if (!res.ok) return []
    return await res.json()
}

const getTopRankedHoles = async (competitionId?: number | null): Promise<HoleWithCtp[]> => {
    const res = await authedFetch(withCompetitionId(`${API_BASE}/holes/top-ranked`, competitionId))
    if (!res.ok) throw new Error('Failed to fetch top ranked holes')
    return await res.json()
}

const getHoles = async (competitionId?: number | null): Promise<HoleWithCtp[]> => {
    const res = await authedFetch(withCompetitionId(`${API_BASE}/holes`, competitionId))
    if (!res.ok) throw new Error('Failed to fetch holes')
    return await res.json()
}

const getHoleCount = async (competitionId?: number | null): Promise<number | null> => {
    const res = await authedFetch(withCompetitionId(`${API_BASE}/holes/count`, competitionId))
    if (!res.ok) return null
    const json = (await res.json()) as { count?: number }
    return typeof json?.count === 'number' ? json.count : null
}

export const submitCtp = async (holeId: number, distanceCm: number) => {
    const res = await authedFetch(`${API_BASE}/ctp/${holeId}`, {
        method: "POST",
        body: JSON.stringify({distance_cm: distanceCm}),
    })

    const payload = (await res.json().catch(() => null)) as ApiResponse<unknown> | null

    if (!res.ok || payload?.success === false) {
        const msg = payload?.error?.message ?? "CTP sisestamine ebaõnnestus!"
        throw new AppError(msg, payload?.error?.code)
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
