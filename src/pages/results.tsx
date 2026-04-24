import {useCallback, useEffect, useMemo, useState} from 'react'
import {Box, CircularProgress, Tab, Tabs, Typography} from '@mui/material'
import Layout from '@/src/components/Layout'
import {useAuth} from '@/src/contexts/AuthContext'
import type {MyDivisionResultPayload} from '@/src/api/useMetrixApi'
import useMetrixApi from '@/src/api/useMetrixApi'
import {useTopPlayersByDivision} from '@/src/api/useTopPlayersByDivision'
import {TopPlayersByDivisionResults} from '@/src/components/admin/TopPlayersByDivisionResults'
import {useTranslation} from 'react-i18next'

const PREFERRED_DIVISION_ORDER = [
    'Noored Mehed',
    'Peened Preilid',
    'Kogenud Härrad',
    'Soliidsed Daamid',
    'Elurõõm',
]

function ResultsTabs({
    competitionId,
    currentUserMetrixId,
}: {
    competitionId: number
    currentUserMetrixId?: number
}) {
    const { t } = useTranslation('pages')
    const { topPlayersByDivision, loading, error, refetch } = useTopPlayersByDivision(competitionId)
    const { getMyDivisionResult } = useMetrixApi()
    const [myDivisionResult, setMyDivisionResult] = useState<MyDivisionResultPayload>(null)
    const myDivisionName = myDivisionResult?.player?.ClassName

    const loadMyDivision = useCallback(() => {
        if (currentUserMetrixId == null) {
            queueMicrotask(() => setMyDivisionResult(null))
            return
        }
        getMyDivisionResult(competitionId)
            .then(setMyDivisionResult)
            .catch(() => setMyDivisionResult(null))
    }, [competitionId, currentUserMetrixId, getMyDivisionResult])

    const divisionEntriesOrdered = useMemo(() => {
        const divisionEntries = Object.entries(topPlayersByDivision)
        const divisionMap = new Map(divisionEntries)
        const ordered: [string, (typeof divisionEntries)[0][1]][] = []
        const added = new Set<string>()
        if (myDivisionName != null && divisionMap.has(myDivisionName)) {
            ordered.push(divisionEntries.find(([n]) => n === myDivisionName)!)
            added.add(myDivisionName)
        }
        for (const name of PREFERRED_DIVISION_ORDER) {
            if (divisionMap.has(name) && !added.has(name)) {
                ordered.push(divisionEntries.find(([n]) => n === name)!)
                added.add(name)
            }
        }
        for (const entry of divisionEntries) {
            if (!added.has(entry[0])) {
                ordered.push(entry)
                added.add(entry[0])
            }
        }
        return ordered
    }, [topPlayersByDivision, myDivisionName])
    const [selectedTab, setSelectedTab] = useState(0)

    useEffect(() => {
        loadMyDivision()
    }, [loadMyDivision])

    /** Reload after screen lock / backgrounding (same idea as stats page). */
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState !== 'visible') return
            void refetch()
            loadMyDivision()
        }
        const onPageShow = (e: PageTransitionEvent) => {
            if (e.persisted) {
                void refetch()
                loadMyDivision()
            }
        }
        document.addEventListener('visibilitychange', onVisible)
        window.addEventListener('pageshow', onPageShow)
        return () => {
            document.removeEventListener('visibilitychange', onVisible)
            window.removeEventListener('pageshow', onPageShow)
        }
    }, [refetch, loadMyDivision])

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setSelectedTab(newValue)
    }

    if (loading && divisionEntriesOrdered.length === 0) {
        return (
            <Box
                sx={{
                    p: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <CircularProgress />
                <Typography ml={2}>{t('results.loading')}</Typography>
            </Box>
        )
    }

    if (error && divisionEntriesOrdered.length === 0) {
        return (
            <Box
                sx={{
                    p: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography color="error">{error}</Typography>
            </Box>
        )
    }

    if (divisionEntriesOrdered.length === 0) {
        return (
            <Box
                sx={{
                    p: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography>{t('results.notFound')}</Typography>
            </Box>
        )
    }

    const selectedDivision = divisionEntriesOrdered[selectedTab]
    const selectedDivisionName = selectedDivision ? selectedDivision[0] : ''
    const selectedDivisionPlayers = selectedDivision ? selectedDivision[1] : []

    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Tabs
                value={selectedTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    mb: 2,
                }}
            >
                {divisionEntriesOrdered.map(([division]) => (
                    <Tab key={division} label={division} />
                ))}
            </Tabs>
            <Box sx={{ flex: 1, overflow: 'auto' }}>
                {selectedDivision && (
                    <TopPlayersByDivisionResults
                        division={selectedDivisionName}
                        players={selectedDivisionPlayers}
                        currentUserMetrixId={currentUserMetrixId}
                        myDivisionResult={
                            myDivisionResult != null &&
                            myDivisionResult.player.ClassName === selectedDivisionName &&
                            myDivisionResult.place > 10
                                ? myDivisionResult
                                : undefined
                        }
                    />
                )}
            </Box>
        </Box>
    )
}

export default function ResultsPage() {
    const { user } = useAuth()
    const { t } = useTranslation('pages')

    if (!user) return <Layout><Box /></Layout>

    // Show message if no active competition
    if (!user.activeCompetitionId) {
        return (
            <Layout>
                <Box px={2} textAlign="center">
                    <Typography variant="h4" fontWeight="bold" mb={2}>
                        {t('results.title')}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {t('results.noCompetition')}
                    </Typography>
                </Box>
            </Layout>
        )
    }

    return (
        <Layout>
            <Box sx={{
                height: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}>
                <ResultsTabs
                    competitionId={user.activeCompetitionId}
                    currentUserMetrixId={user.metrixUserId}
                />
            </Box>
        </Layout>
    )
}
