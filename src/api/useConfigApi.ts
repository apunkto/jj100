// inside useCtpApi.ts

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL
if (!API_BASE) {
    throw new Error('Missing NEXT_PUBLIC_API_BASE_URL')
}
const isCtpEnabled = async (): Promise<boolean> => {
    const res = await fetch(`${API_BASE}/config/ctp_enabled`)
    if (!res.ok) throw new Error(`Failed to fetch config`)

    const data = (await res.json()) as { value: string }
    return data.value === "true"
}

export default function useConfigApi() {
    return {
        isCtpEnabled
    }
}
