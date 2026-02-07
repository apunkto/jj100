import {useEffect, useState} from 'react'
import {Box, CircularProgress, Tab, Tabs, Typography} from '@mui/material'
import {useRouter} from 'next/router'
import Layout from '@/src/components/Layout'
import {useAuth} from '@/src/contexts/AuthContext'
import {useTopPlayersByDivision} from '@/src/api/useTopPlayersByDivision'
import {TopPlayersByDivisionResults} from '@/src/components/admin/TopPlayersByDivisionResults'

function ResultsTabs({ competitionId }: { competitionId: number }) {
    const { topPlayersByDivision, loading, error } = useTopPlayersByDivision(competitionId)
    const divisionEntries = Object.entries(topPlayersByDivision)
    const [selectedTab, setSelectedTab] = useState(0)

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setSelectedTab(newValue)
    }

    if (loading && divisionEntries.length === 0) {
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
                <Typography ml={2}>Laen...</Typography>
            </Box>
        )
    }

    if (error && divisionEntries.length === 0) {
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

    if (divisionEntries.length === 0) {
        return (
            <Box
                sx={{
                    p: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography>Tulemusi ei leitud</Typography>
            </Box>
        )
    }

    const selectedDivision = divisionEntries[selectedTab]
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
                {divisionEntries.map(([division]) => (
                    <Tab key={division} label={division} />
                ))}
            </Tabs>
            <Box sx={{ flex: 1, overflow: 'auto' }}>
                {selectedDivision && (
                    <TopPlayersByDivisionResults
                        division={selectedDivisionName}
                        players={selectedDivisionPlayers}
                    />
                )}
            </Box>
        </Box>
    )
}

export default function AdminResults() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()

    // Redirect unauthenticated users to login
    useEffect(() => {
        if (authLoading) return
        if (!user) {
            router.replace('/login')
        }
    }, [authLoading, user, router])

    // Show loading while auth is loading or user data is not yet available
    if (authLoading || !user) {
        return (
            <Layout>
                <Box textAlign="center" mt={6}>
                    <CircularProgress />
                    <Typography variant="h6" mt={2}>Laadimine...</Typography>
                </Box>
            </Layout>
        )
    }

    // Show message if no active competition
    if (!user.activeCompetitionId) {
        return (
            <Layout>
                <Box px={2} textAlign="center">
                    <Typography variant="h4" fontWeight="bold" mb={2}>
                        Tulemused
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Aktiivset võistlust ei ole valitud. Palun vali võistlus oma profiilis.
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
                <ResultsTabs competitionId={user.activeCompetitionId} />
            </Box>
        </Layout>
    )
}
