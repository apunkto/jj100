export type CtpResult = {
    player_name: string
    distance_cm: number
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8787'

const useCtpApi = () => {
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

    return { getCtp }
}

export default useCtpApi
