import {useCallback} from 'react'
import {authedFetch} from '@/src/api/authedFetch'
import {API_BASE} from '@/src/api/config'

export type LedScreenBoard = 'main' | 'leaderboard' | 'draw' | 'finalDraw' | 'finalPutting'

export type LedScreenState = {
    board: LedScreenBoard
    leaderboardDivision: string | null
    leaderboardPanel?: 'division' | 'prediction'
}

export type LedScreenSelectBody = {
    board: LedScreenBoard
    leaderboardDivision?: string | null
    leaderboardPanel?: 'division' | 'prediction'
}

export function useLedScreenApi() {
    const getLedScreenState = useCallback(async (): Promise<LedScreenState> => {
        const res = await authedFetch(`${API_BASE}/admin/led-screen/state`)
        if (!res.ok) throw new Error('Failed to fetch LED screen state')
        return res.json() as Promise<LedScreenState>
    }, [])

    /** Subscribe to LED screen SSE. Returns unsubscribe. */
    const subscribeToLedScreen = useCallback(
        (onMessage: (state: LedScreenState) => void, onClose: () => void): (() => void) => {
            const ac = new AbortController()
            let buffer = ''
            const run = async () => {
                try {
                    const res = await authedFetch(`${API_BASE}/admin/led-screen/sse`, {
                        signal: ac.signal,
                        headers: {Accept: 'text/event-stream'},
                    })
                    if (!res.ok || !res.body) {
                        onClose()
                        return
                    }
                    const reader = res.body.getReader()
                    const decoder = new TextDecoder()
                    try {
                        while (true) {
                            const {done, value} = await reader.read()
                            if (done) break
                            buffer += decoder.decode(value, {stream: true})
                            const lines = buffer.split('\n')
                            buffer = lines.pop() ?? ''
                            for (const line of lines) {
                                if (line.startsWith('data: ')) {
                                    try {
                                        const data = JSON.parse(line.slice(6)) as LedScreenState
                                        onMessage(data)
                                    } catch {
                                        // skip non-JSON (heartbeat)
                                    }
                                }
                            }
                        }
                        if (buffer.trim().startsWith('data: ')) {
                            try {
                                const data = JSON.parse(buffer.trim().slice(6)) as LedScreenState
                                onMessage(data)
                            } catch {
                                // ignore
                            }
                        }
                    } finally {
                        reader.releaseLock()
                    }
                    onClose()
                } catch (err) {
                    if (err instanceof Error && err.name === 'AbortError') return
                    onClose()
                }
            }
            run()
            return () => ac.abort()
        },
        []
    )

    const selectLedScreen = useCallback(async (body: LedScreenSelectBody): Promise<LedScreenState> => {
        const res = await authedFetch(`${API_BASE}/admin/led-screen/select`, {
            method: 'POST',
            body: JSON.stringify(body),
        })
        if (!res.ok) {
            const err = (await res.json().catch(() => ({}))) as {error?: string}
            throw new Error(err?.error ?? 'Failed to update LED screen')
        }
        const json = (await res.json()) as {success?: boolean; data: LedScreenState}
        return json.data
    }, [])

    return {
        getLedScreenState,
        subscribeToLedScreen,
        selectLedScreen,
    }
}
