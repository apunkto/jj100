import {ApiResponse, authedFetch} from "@/src/api/authedFetch";

export type HoleEntity = {
    id: number
    number: number
    is_ctp: boolean
}

export type HoleResult = {
    hole: Hole,
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
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

if (!API_BASE) {
    throw new Error('Missing NEXT_PUBLIC_API_BASE_URL')
}

const getHole = async (holeNumber: number): Promise<HoleResult | null> => {
    const res = await authedFetch(`${API_BASE}/hole/${holeNumber}`)
    if (!res.ok) return null
    return await res.json()
}

const getAllHoles = async (): Promise<Hole[]> => {
    const res = await authedFetch(`${API_BASE}/holes/all`)
    if (!res.ok) throw new Error('Failed to fetch all holes')
    return await res.json()
}

const getTopRankedHoles = async (): Promise<HoleResult[]> => {
    const res = await authedFetch(`${API_BASE}/holes/top-ranked`)
    if (!res.ok) throw new Error('Failed to fetch top ranked holes')
    return await res.json()
}

const getHoles = async (): Promise<HoleResult[]> => {
    const res = await authedFetch(`${API_BASE}/holes`)
    if (!res.ok) throw new Error('Failed to fetch top ranked holes')
    return await res.json()
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


const getCtpHoles = async (): Promise<HoleResult[]> => {
    const res = await authedFetch(`${API_BASE}/holes/ctp`)
    if (!res.ok) throw new Error(`Failed to fetch CTP holes: ${res.status}`)
    return await res.json()
}

export default function useCtpApi() {
    return {
        getHole,
        getTopRankedHoles,
        getHoles,
        submitCtp,
        getCtpHoles,
    }
}
