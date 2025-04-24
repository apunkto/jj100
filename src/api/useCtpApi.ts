export type CtpResult = {
    hole: number
    player_id: string
    player_name: string
    distance_cm: number
}


const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

if (!API_BASE) {
    throw new Error('Missing NEXT_PUBLIC_API_BASE_URL')
}

const getCtp = async (hole: number): Promise<CtpResult | null> => {
    try {
        const res = await fetch(`${API_BASE}/ctp/${hole}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return await res.json()
    } catch (err) {
        console.error('Error fetching CTP result:', err)
        return null
    }
}

const submitCtp = async (hole: number, player_id: string, distance_cm: number) => {
    const res = await fetch(`${API_BASE}/ctp/${hole}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({player_id, distance_cm}),
    })

    if (!res.ok) throw new Error('Failed to submit CTP')
    return await res.json()
}


export default function useCtpApi() {
    return {
        getCtp,
        submitCtp,
    }
}