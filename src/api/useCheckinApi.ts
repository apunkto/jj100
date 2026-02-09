import {useCallback} from "react"
import {authedFetch} from "@/src/api/authedFetch"
import {API_BASE} from "@/src/api/config"
import {AppError} from "@/src/utils/AppError"

export type CheckedInPlayer = {
    id: number
    player: {
        id: number
        name: string
    }
    prize_won: boolean
}

export type PuttingGamePayload = {
    gameStatus: 'not_started' | 'running' | 'finished'
    currentLevel: number
    currentTurnParticipantId: number | null
    currentTurnName: string | null
    winnerName: string | null
    players: { id: number; order: number; name: string; status: 'active' | 'out'; lastLevel: number; lastResult: 'in' | 'out' | null }[]
}

export type PuttingGameState = {
    status: 'not_started' | 'running' | 'finished'
    currentLevel: number
    currentTurnParticipantId: number | null
    currentTurnName: string | null
    winnerFinalGameId: number | null
    winnerName: string | null
    players: { id: number; order: number; name: string; status: 'active' | 'out'; lastLevel: number; lastResult: 'in' | 'out' | null }[]
}

export type FinalGameStateResponse = {
    finalGameParticipants?: { id: number; name: string; order: number; playerId: number }[]
    participantCount?: number
    winnerName?: string
    participantNames?: string[]
    puttingGame?: PuttingGamePayload
}

export type FinalGameDrawResponse = {
    finalGameParticipants: { id: number; name: string; order: number; playerId: number }[]
    participantCount: number
    winnerName?: string
    participantNames?: string[]
}

export type FinalGamePuttingResponse = {
    puttingGame: PuttingGamePayload
}

export type FinalGameParticipant = {
    id: number
    final_game_order: number
    player: { id: number; name: string }
}
export const useCheckinApi = () => {
    const checkIn = async () => {
        const res = await authedFetch(`${API_BASE}/lottery/checkin`, {
            method: 'POST',
            body: JSON.stringify({}),
        })

        if (res.status === 409) {
            throw new Error('already_checked_in')
        }

        if (res.status === 403) {
            const body = (await res.json().catch(() => ({}))) as { error?: string; code?: string }
            if (body?.code === 'not_competition_participant') {
                throw new AppError(body?.error ?? 'Sa ei osale võistlusel!', 'not_competition_participant')
            }
        }

        if (!res.ok) {
            throw new Error('checkin_failed')
        }

        return await res.json()
    }

    const getCheckins = useCallback(async (): Promise<CheckedInPlayer[]> => {
        const res = await authedFetch(`${API_BASE}/lottery/checkins`)
        if (!res.ok) {
            throw new Error('Failed to fetch check-ins')
        }

        const json = (await res.json()) as { data: CheckedInPlayer[] }
        return json.data
    }, [])

    const drawWinner = async (finalGame: boolean = false): Promise<CheckedInPlayer> => {
        const params = finalGame ? '?final_game=true' : ''
        const res = await authedFetch(`${API_BASE}/lottery/draw${params}`, {
            method: 'POST'
        })

        if (!res.ok) {
            throw new Error('Failed to draw winner')
        }

        return (await res.json()) as CheckedInPlayer
    }

    const deleteCheckin = async (checkinId: number) => {
        const res = await authedFetch(`${API_BASE}/lottery/checkin/${checkinId}`, {
            method: 'DELETE'
        })
        if (!res.ok) {
            throw new Error('Failed to delete check-in')
        }
    }

    const confirmFinalGameCheckin = async (checkinId: number) => {
        const res = await authedFetch(`${API_BASE}/lottery/checkin/final/${checkinId}`, {
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

    const resetDraw = async () => {
        const res = await authedFetch(`${API_BASE}/lottery/draw-reset`, { method: 'POST' })
        if (!res.ok) throw new Error('Failed to reset draw')
    }

    /** Fetch current draw state once (e.g. on page load) so UI can show immediately instead of waiting for first SSE event. */
    const getDrawState = useCallback(async (): Promise<{
        participantCount: number
        countdown?: number
        countdownStartedAt?: number
        winnerName?: string
        participantNames?: string[]
    }> => {
        const res = await authedFetch(`${API_BASE}/lottery/draw-state`)
        if (!res.ok) throw new Error('Failed to fetch draw state')
        return res.json()
    }, [])

    /** Subscribe to draw state SSE. Returns an abort function to close the connection. Stable ref so dashboard effect doesn't reconnect every render. */
    const subscribeToDrawState = useCallback((
        onMessage: (state: { participantCount: number; countdown?: number; countdownStartedAt?: number; winnerName?: string }) => void,
        onClose: () => void
    ): (() => void) => {
        const ac = new AbortController()
        let buffer = ''
        const run = async () => {
            try {
                const res = await authedFetch(`${API_BASE}/lottery/draw-sse`, { signal: ac.signal })
                if (!res.ok || !res.body) {
                    onClose()
                    return
                }
                const reader = res.body.getReader()
                const decoder = new TextDecoder()
                try {
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break
                        buffer += decoder.decode(value, { stream: true })
                        const lines = buffer.split('\n')
                        buffer = lines.pop() ?? ''
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const data = JSON.parse(line.slice(6)) as {
                                        participantCount: number
                                        countdown?: number
                                        countdownStartedAt?: number
                                        winnerName?: string
                                    }
                                    onMessage(data)
                                } catch {
                                    // skip non-JSON (e.g. heartbeat comment)
                                }
                            }
                        }
                    }
                    // Flush any remaining buffer (final incomplete line)
                    if (buffer.trim().startsWith('data: ')) {
                        try {
                            const data = JSON.parse(buffer.trim().slice(6)) as {
                                participantCount: number
                                countdown?: number
                                countdownStartedAt?: number
                                winnerName?: string
                            }
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
    }, [])

    const getFinalGameState = useCallback(async (): Promise<FinalGameStateResponse> => {
        const res = await authedFetch(`${API_BASE}/lottery/final-game-state`)
        if (!res.ok) throw new Error('Failed to fetch final game state')
        return res.json()
    }, [])

    const getFinalGameParticipants = async (): Promise<FinalGameParticipant[]> => {
        const res = await authedFetch(`${API_BASE}/lottery/final-game/participants`)
        if (!res.ok) throw new Error('Failed to fetch final game participants')
        const json = (await res.json()) as { data: FinalGameParticipant[] }
        return json.data
    }

    const removeFinalGameParticipant = async (finalGameId: number) => {
        const res = await authedFetch(`${API_BASE}/lottery/final-game/${finalGameId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to remove player from final game')
    }

    const getPuttingGameState = async (): Promise<PuttingGameState | null> => {
        const res = await authedFetch(`${API_BASE}/lottery/final-game/game/state`)
        if (!res.ok) return null
        return res.json()
    }

    const startPuttingGame = async () => {
        const res = await authedFetch(`${API_BASE}/lottery/final-game/game/start`, { method: 'POST' })
        if (!res.ok) {
            const body = await res.json().catch(() => ({})) as { error?: string }
            throw new Error(body?.error ?? 'Failed to start game')
        }
    }

    const resetPuttingGame = async () => {
        const res = await authedFetch(`${API_BASE}/lottery/final-game/game/reset`, { method: 'POST' })
        if (!res.ok) {
            const body = await res.json().catch(() => ({})) as { error?: string }
            throw new Error(body?.error ?? 'Failed to reset game')
        }
    }

    const recordPuttingResult = async (participantId: number, result: 'in' | 'out') => {
        const res = await authedFetch(`${API_BASE}/lottery/final-game/game/attempt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participantId, result }),
        })
        if (!res.ok) {
            const body = await res.json().catch(() => ({})) as { error?: string }
            throw new Error(body?.error ?? 'Failed to record result')
        }
    }

    const getFinalGameDrawState = useCallback(async (): Promise<FinalGameDrawResponse> => {
        const res = await authedFetch(`${API_BASE}/lottery/final-game-draw-state`)
        if (!res.ok) throw new Error('Failed to fetch final game draw state')
        return res.json()
    }, [])

    const getFinalGamePuttingState = useCallback(async (): Promise<FinalGamePuttingResponse> => {
        const res = await authedFetch(`${API_BASE}/lottery/final-game-putting-state`)
        if (!res.ok) throw new Error('Failed to fetch final game putting state')
        return res.json()
    }, [])

    const subscribeToFinalGameDrawState = useCallback((
        onMessage: (state: FinalGameDrawResponse) => void,
        onClose: () => void
    ): (() => void) => {
        const ac = new AbortController()
        let buffer = ''
        const run = async () => {
            try {
                const res = await authedFetch(`${API_BASE}/lottery/final-game-draw-sse`, { signal: ac.signal })
                if (!res.ok || !res.body) {
                    onClose()
                    return
                }
                const reader = res.body.getReader()
                const decoder = new TextDecoder()
                try {
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break
                        buffer += decoder.decode(value, { stream: true })
                        const lines = buffer.split('\n')
                        buffer = lines.pop() ?? ''
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const data = JSON.parse(line.slice(6)) as FinalGameDrawResponse
                                    onMessage(data)
                                } catch {
                                    // skip non-JSON
                                }
                            }
                        }
                    }
                    if (buffer.trim().startsWith('data: ')) {
                        try {
                            const data = JSON.parse(buffer.trim().slice(6)) as FinalGameDrawResponse
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
    }, [])

    const subscribeToFinalGamePuttingState = useCallback((
        onMessage: (state: FinalGamePuttingResponse) => void,
        onClose: () => void
    ): (() => void) => {
        const ac = new AbortController()
        let buffer = ''
        const run = async () => {
            try {
                const sseUrl = `${API_BASE}/lottery/final-game-putting-sse`
                console.log('[PuttingSSE] Connecting to', sseUrl.replace(/^https?:\/\//, '').split('/')[0], '/lottery/final-game-putting-sse')
                const res = await authedFetch(sseUrl, { signal: ac.signal })
                if (!res.ok || !res.body) {
                    console.warn('[PuttingSSE] Connection failed or no body:', res.status, res.statusText, 'url=', sseUrl.split('/').slice(0, 3).join('/'))
                    onClose()
                    return
                }
                console.log('[PuttingSSE] Connected, reading stream')
                const reader = res.body.getReader()
                const decoder = new TextDecoder()
                try {
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) {
                            console.log('[PuttingSSE] Stream done (closed by server)')
                            break
                        }
                        buffer += decoder.decode(value, { stream: true })
                        const lines = buffer.split('\n')
                        buffer = lines.pop() ?? ''
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const data = JSON.parse(line.slice(6)) as FinalGamePuttingResponse
                                    const status = data.puttingGame?.gameStatus
                                    const playerCount = data.puttingGame?.players?.length ?? 0
                                    console.log('[PuttingSSE] Message received:', { status, playerCount })
                                    onMessage(data)
                                } catch {
                                    // skip non-JSON (e.g. heartbeat)
                                    if (line.trim() !== ': heartbeat') {
                                        console.log('[PuttingSSE] Non-JSON data line:', line.slice(0, 80))
                                    }
                                }
                            }
                        }
                    }
                    if (buffer.trim().startsWith('data: ')) {
                        try {
                            const data = JSON.parse(buffer.trim().slice(6)) as FinalGamePuttingResponse
                            console.log('[PuttingSSE] Final buffered message:', data.puttingGame?.gameStatus)
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
                if (err instanceof Error && err.name === 'AbortError') {
                    console.log('[PuttingSSE] Aborted (unsubscribe)')
                    return
                }
                console.warn('[PuttingSSE] Error:', err)
                onClose()
            }
        }
        run()
        return () => ac.abort()
    }, [])

    return {
        checkIn,
        getCheckins,
        drawWinner,
        deleteCheckin,
        confirmFinalGameCheckin,
        getMyCheckin,
        unregisterMe,
        resetDraw,
        getDrawState,
        subscribeToDrawState,
        getFinalGameState,
        getFinalGameDrawState,
        getFinalGamePuttingState,
        subscribeToFinalGameDrawState,
        subscribeToFinalGamePuttingState,
        getFinalGameParticipants,
        removeFinalGameParticipant,
        getPuttingGameState,
        startPuttingGame,
        resetPuttingGame,
        recordPuttingResult,
    }
}

