import {useCallback, useEffect, useRef, useState} from 'react'
import {Box, Typography} from '@mui/material'
import {useRouter} from 'next/router'
import {useAuth} from '@/src/contexts/AuthContext'
import {type LedScreenState, useLedScreenApi} from '@/src/api/useLedScreenApi'
import {buildLedDisplayPath} from '@/src/utils/ledScreenDisplayPath'
import {isDashboardLedDarkMode} from '@/src/utils/dashboardDarkMode'

const RECONNECT_DELAY_MS = 2000

export default function LedScreenPage() {
    const router = useRouter()
    const {user, loading: authLoading} = useAuth()
    const {getLedScreenState, subscribeToLedScreen} = useLedScreenApi()

    const darkMode = !router.isReady || isDashboardLedDarkMode(router.query.darkMode)

    const [displaySrc, setDisplaySrc] = useState<string | null>(null)
    const unsubscribeRef = useRef<(() => void) | null>(null)
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const isAdmin = user?.isAdmin ?? false

    const applyState = useCallback(
        (state: LedScreenState) => {
            const competitionId = user?.activeCompetitionId
            if (competitionId == null) return
            setDisplaySrc(buildLedDisplayPath(state, competitionId, darkMode))
        },
        [user?.activeCompetitionId, darkMode]
    )

    const reconnect = useCallback(() => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current()
            unsubscribeRef.current = null
        }
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current)
            reconnectTimerRef.current = null
        }
        const unsub = subscribeToLedScreen(applyState, () => {
            reconnectTimerRef.current = setTimeout(() => reconnect(), RECONNECT_DELAY_MS)
        })
        unsubscribeRef.current = unsub
    }, [subscribeToLedScreen, applyState])

    useEffect(() => {
        if (authLoading || !user || !isAdmin) return
        const competitionId = user.activeCompetitionId
        if (competitionId == null) return

        let cancelled = false
        getLedScreenState()
            .then((state) => {
                if (!cancelled) applyState(state)
            })
            .catch(() => {})
        reconnect()

        return () => {
            cancelled = true
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current)
                reconnectTimerRef.current = null
            }
            if (unsubscribeRef.current) {
                unsubscribeRef.current()
                unsubscribeRef.current = null
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, isAdmin, user?.activeCompetitionId])

    useEffect(() => {
        if (authLoading || !user || !isAdmin || user.activeCompetitionId == null) return
        getLedScreenState()
            .then((state) => applyState(state))
            .catch(() => {})
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [darkMode])

    useEffect(() => {
        if (!authLoading && user && !isAdmin) {
            void router.replace('/')
        }
    }, [authLoading, user, isAdmin, router])

    if (authLoading || !user) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.default',
                }}
            >
                <Typography variant="h5">Laadimine...</Typography>
            </Box>
        )
    }

    if (!isAdmin) {
        return null
    }

    if (user.activeCompetitionId == null) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 2,
                    textAlign: 'center',
                }}
            >
                <Typography>Vali võistlus (aktiivne võistlus puudub).</Typography>
            </Box>
        )
    }

    return (
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                bgcolor: 'background.default',
                overflow: 'hidden',
            }}
        >
            {displaySrc ? (
                <iframe
                    title="LED board"
                    src={displaySrc}
                    style={{
                        border: 0,
                        width: '100%',
                        height: '100%',
                        display: 'block',
                    }}
                />
            ) : (
                <Box
                    sx={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Typography color="text.secondary">Ootan ekraani seisu...</Typography>
                </Box>
            )}
        </Box>
    )
}
