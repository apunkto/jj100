export type Player = {
    id: string
    name: string
}



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
    const checkIn = async (playerId: number) => {
        const res = await fetch(`${API_BASE}/lottery/checkin`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({player_id: playerId}),
        })

        if (res.status === 409) {
            throw new Error('already_checked_in')
        }

        if (!res.ok) {
            throw new Error('checkin_failed')
        }

        return await res.json()
    }

    const getCheckins = async (): Promise<CheckedInPlayer[]> => {
        const res = await fetch(`${API_BASE}/lottery/checkins`)
        if (!res.ok) {
            throw new Error('Failed to fetch check-ins')
        }

        const json = (await res.json()) as { data: CheckedInPlayer[] }
        return json.data
    }

    const drawWinner = async (finalGame: boolean = false): Promise<CheckedInPlayer> => {
        const params = finalGame ? '?final_game=true' : ''
        const res = await fetch(`${API_BASE}/lottery/draw${params}`, {
            method: 'POST'
        })

        if (!res.ok) {
            throw new Error('Failed to draw winner')
        }

        return await res.json() as CheckedInPlayer;
    }

    const deleteCheckin = async (playerId: number) => {
        const res = await fetch(`${API_BASE}/lottery/checkin/${playerId}`, {
            method: 'DELETE'
        })
        if (!res.ok) {
            throw new Error('Failed to delete check-in')
        }
    }

    const confirmFinalGameCheckin = async (playerId: number) => {
        const res = await fetch(`${API_BASE}/lottery/checkin/final/${playerId}`, {
            method: 'POST'
        })
        if (!res.ok) {
            throw new Error('Failed to confirm final game player')
        }
    }

    return {checkIn, getCheckins, drawWinner, deleteCheckin, confirmFinalGameCheckin}
}

