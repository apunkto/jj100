export type Player = {
    id: string
    name: string
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

    return {checkIn}
}

