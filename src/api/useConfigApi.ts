// useConfigApi.ts

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL
if (!API_BASE) {
    throw new Error('Missing NEXT_PUBLIC_API_BASE_URL')
}

// Generic fetcher
const fetchConfigValue = async (key: string): Promise<string> => {
    const res = await fetch(`${API_BASE}/config/${key}`)
    if (!res.ok) throw new Error(`Failed to fetch config '${key}'`)

    const data = (await res.json()) as { value: string }
    return data.value
}

const isCtpEnabled = async (): Promise<boolean> => {
    const value = await fetchConfigValue('ctp_enabled')
    return value === 'true'
}

const isCheckinEnabled = async (): Promise<boolean> => {
    const value = await fetchConfigValue('checkin_enabled')
    return value === 'true'
}

export default function useConfigApi() {
    return {
        isCtpEnabled,
        isCheckinEnabled,
    }
}
