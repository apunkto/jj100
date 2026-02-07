import {getAccessToken} from "@/src/contexts/tokenStore"

type FetchInput = RequestInfo | URL

export async function authedFetch(input: FetchInput, init: RequestInit = {}) {
    const token = getAccessToken()

    const headers = new Headers(init.headers || {})
    if (token) headers.set("Authorization", `Bearer ${token}`)
    headers.set("Accept", "application/json")
    if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json")

    return fetch(input, {...init, headers})
}

type ApiError = { message: string; code?: string }
export type ApiResponse<T> = { success: boolean; data: T | null; error: ApiError | null }
