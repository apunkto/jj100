import {useCallback, useEffect, useState} from 'react'
import type {DashboardPlayerResult} from '@/src/api/useMetrixApi'
import useMetrixApi from '@/src/api/useMetrixApi'

const REFRESH_MS = 5 * 60 * 1000

/** Hook to fetch top players by division. Used by Dashboard and Admin Results. */
export function useTopPlayersByDivision(competitionId: number) {
    const { getTopPlayersByDivision } = useMetrixApi()
    const [topPlayersByDivision, setTopPlayersByDivision] = useState<
        Record<string, DashboardPlayerResult[]>
    >({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        try {
            setError(null)
            const data = await getTopPlayersByDivision(competitionId)
            setTopPlayersByDivision(data.topPlayersByDivision)
        } catch (err) {
            console.error('Failed to load top players:', err)
            setError(err instanceof Error ? err.message : 'Failed to load')
        } finally {
            setLoading(false)
        }
    }, [competitionId, getTopPlayersByDivision])

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, REFRESH_MS)
        return () => clearInterval(interval)
    }, [fetchData])

    return { topPlayersByDivision, loading, error }
}
