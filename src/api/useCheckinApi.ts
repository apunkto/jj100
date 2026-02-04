import {authedFetch} from "@/src/api/authedFetch";


export type CheckedInPlayer = {
    id: number
    player: {
        id: number
        name: string
    }
    prize_won: boolean,
    final_game: boolean,
    final_game_order: number | null
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

if (!API_BASE) {
    throw new Error('Missing NEXT_PUBLIC_API_BASE_URL')
}
export const useCheckinApi = () => {
    const checkIn = async () => {
        const res = await authedFetch(`${API_BASE}/lottery/checkin`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({}),
        })

        if (res.status === 409) {
            throw new Error('already_checked_in')
        }

        if (res.status === 403) {
            const body = (await res.json().catch(() => ({}))) as { error?: string; code?: string }
            if (body?.code === 'not_competition_participant') {
                const err: any = new Error(body?.error ?? 'Sa ei osale võistlusel!')
                err.code = 'not_competition_participant'
                throw err
            }
        }

        if (!res.ok) {
            throw new Error('checkin_failed')
        }

        return await res.json()
    }

    const getCheckins = async (): Promise<CheckedInPlayer[]> => {
        const res = await authedFetch(`${API_BASE}/lottery/checkins`)
        if (!res.ok) {
            throw new Error('Failed to fetch check-ins')
        }

        const json = (await res.json()) as { data: CheckedInPlayer[] }
        return json.data
    }

    const drawWinner = async (finalGame: boolean = false): Promise<CheckedInPlayer> => {
        const params = finalGame ? '?final_game=true' : ''
        const res = await authedFetch(`${API_BASE}/lottery/draw${params}`, {
            method: 'POST'
        })

        if (!res.ok) {
            throw new Error('Failed to draw winner')
        }

        return await res.json() as CheckedInPlayer;
    }

    const deleteCheckin = async (playerId: number) => {
        const res = await authedFetch(`${API_BASE}/lottery/checkin/${playerId}`, {
            method: 'DELETE'
        })
        if (!res.ok) {
            throw new Error('Failed to delete check-in')
        }
    }

    const confirmFinalGameCheckin = async (playerId: number) => {
        const res = await authedFetch(`${API_BASE}/lottery/checkin/final/${playerId}`, {
            method: 'POST'
        })
        if (!res.ok) {
            throw new Error('Failed to confirm final game player')
        }
    }

    const getMyCheckin = async (): Promise<{ checkedIn: boolean; checkin: any | null }> => {
        const res = await authedFetch(`${API_BASE}/lottery/checkin/me`)
        if (!res.ok) throw new Error("Failed to fetch my check-in")

        const json = (await res.json()) as { data: { checkedIn: boolean; checkin: any | null } }
        return json.data
    }

    const unregisterMe = async () => {
        const res = await authedFetch(`${API_BASE}/lottery/checkin/me`, {method: "DELETE"})
        if (!res.ok) throw new Error("Failed to unregister")
    }


    return {
        checkIn,
        getCheckins,
        drawWinner,
        deleteCheckin,
        confirmFinalGameCheckin,
        getMyCheckin,
        unregisterMe,
    }
}

