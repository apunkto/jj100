import {useEffect, useState} from 'react'
import {Box, CircularProgress, Tab, Tabs, Typography} from '@mui/material'
import {useRouter} from 'next/router'
import Layout from '@/src/components/Layout'
import {useAuth} from '@/src/contexts/AuthContext'
import {
    TopPlayersByDivisionContent,
    useTopPlayersByDivision
} from '@/src/components/dashboard/TopPlayersByDivisionSlide'

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
                    <TopPlayersByDivisionContent 
                        division={selectedDivisionName} 
                        players={selectedDivisionPlayers} 
                    />
                )}
            </Box>
        </Box>
    )
}

export default function AdminResults() {
    const {user, loading: authLoading} = useAuth()
    const router = useRouter()
    const isAdmin = user?.isAdmin ?? false

    // Redirect non-admin users
    useEffect(() => {
        if (authLoading) return
        if (!user) return
        if (!isAdmin) {
            router.replace('/')
        }
    }, [authLoading, user, isAdmin, router])

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

    // If user is loaded but not admin, show access denied (will redirect)
    if (!isAdmin) {
        return (
            <Layout>
                <Box textAlign="center" mt={6}>
                    <Typography variant="h4">Puudub juurdepääs</Typography>
                    <Typography variant="body1" mt={2}>
                        Ainult administraatoritel on juurdepääs sellele lehele.
                    </Typography>
                </Box>
            </Layout>
        )
    }

    // Show message if no active competition
    if (!user.activeCompetitionId) {
        return (
            <Layout>
                <Box mt={4} px={2} textAlign="center">
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
