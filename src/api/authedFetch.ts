import {getAccessToken} from "@/src/contexts/tokenStore"

type FetchInput = RequestInfo | URL

export async function authedFetch(input: FetchInput, init: RequestInit = {}) {
    const t0 = performance.now()

    const mark = (label: string, extra?: any) => {
        const ms = (performance.now() - t0).toFixed(1)
        // eslint-disable-next-line no-console
        console.log(`[authedFetch +${ms}ms] ${label}`, extra ?? "")
    }

    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : "(Request)"
    const method = init.method ?? "GET"

    // token timing
    const tTok = performance.now()
    const token = getAccessToken()

    const headers = new Headers(init.headers || {})
    if (token) headers.set("Authorization", `Bearer ${token}`)
    headers.set("Accept", "application/json")
    if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json")

    // fetch timing, show url and method
    mark("fetch start", {
        url: url
    })
    const tFetch = performance.now()
    const res = await fetch(input, {...init, headers})
    mark("fetch resolved", {
        url: url,
        tookMs: +(performance.now() - tFetch).toFixed(1),
        status: res.status,
        ok: res.ok,
    })

    // optional: read timing helper (use only when you actually read body here)
    // mark("done")

    return res
}

type ApiError = { message: string; code?: string }
export type ApiResponse<T> = { success: boolean; data: T | null; error: ApiError | null }
