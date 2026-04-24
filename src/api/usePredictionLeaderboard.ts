import {useCallback, useEffect, useRef, useState} from 'react'
import usePredictionApi, {
    type PredictionLeaderboardEntry,
    type PredictionLeaderboardResponse,
} from '@/src/api/usePredictionApi'

const REFRESH_MS = 5 * 60 * 1000

/** Fetches prediction leaderboard for dashboard / wall rotation. */
export function usePredictionLeaderboard(competitionId: number) {
    const {getLeaderboard} = usePredictionApi()
    const [leaderboard, setLeaderboard] = useState<PredictionLeaderboardResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const staleRef = useRef(false)

    const fetchData = useCallback(async () => {
        staleRef.current = false
        try {
            setError(null)
            const data = await getLeaderboard(competitionId)
            if (!staleRef.current) {
                setLeaderboard(data)
            }
        } catch (err) {
            if (!staleRef.current) {
                console.error('Failed to load prediction leaderboard:', err)
                setLeaderboard({top_10: [], user_rank: null})
                setError(err instanceof Error ? err.message : null)
            }
        } finally {
            if (!staleRef.current) {
                setLoading(false)
            }
        }
    }, [competitionId, getLeaderboard])

    useEffect(() => {
        staleRef.current = false
        fetchData()
        const interval = setInterval(fetchData, REFRESH_MS)
        return () => {
            staleRef.current = true
            clearInterval(interval)
        }
    }, [fetchData])

    const entries: PredictionLeaderboardEntry[] = leaderboard?.top_10 ?? []

    return {entries, loading, error}
}
