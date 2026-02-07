// components/Layout.tsx
import {
    AppBar,
    Box,
    Container,
    Divider,
    Drawer,
    FormControl,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Select,
    Toolbar,
    Typography,
} from '@mui/material'
import React, {ReactNode, useCallback, useEffect, useState} from 'react'
import MenuIcon from '@mui/icons-material/Menu'
import Link from 'next/link'
import Image from 'next/image'
import GolfCourseIcon from '@mui/icons-material/GolfCourse'
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard'
import MapIcon from '@mui/icons-material/Map'
import InfoIcon from '@mui/icons-material/Info'
import FeedbackIcon from '@mui/icons-material/Feedback'
import HistoryIcon from '@mui/icons-material/History'
import QuizIcon from '@mui/icons-material/Quiz'
import LogoutIcon from '@mui/icons-material/Logout'
import LineChartIcon from '@mui/icons-material/ShowChart'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import {useRouter} from 'next/router'
import {supabase} from '@/src/lib/supabaseClient'
import {useAuth} from '@/src/contexts/AuthContext'
import usePlayerApi, {CompetitionOption} from '@/src/api/usePlayerApi'
import useAdminApi from '@/src/api/useAdminApi'
import {decodeHtmlEntities} from '@/src/utils/textUtils'

export default function Layout({
                                   children,
                                   minimal = false,
                               }: {
    children: ReactNode
    minimal?: boolean
}) {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [competitions, setCompetitions] = useState<CompetitionOption[]>([])
    const { session, user, refreshMe } = useAuth()
    const { getPlayerCompetitions, setActiveCompetition } = usePlayerApi()
    const { getAdminCompetitions } = useAdminApi()
    const isAuthed = !!session

    const router = useRouter()
    const currentPath = router.pathname

    useEffect(() => {
        if (user) {
            if (user.isAdmin) {
                // Admin: fetch all competitions from admin endpoint
                getAdminCompetitions()
                    .then(adminComps => {
                        // Map AdminCompetition to CompetitionOption format
                        setCompetitions(adminComps.map(c => ({ id: c.id, name: c.name })))
                    })
                    .catch(() => setCompetitions([]))
            } else {
                // Regular user: fetch their competitions
                getPlayerCompetitions().then(setCompetitions)
            }
        } else {
            setCompetitions([])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut()
            setDrawerOpen(false)
            await router.push('/login')
        } catch (e) {
            console.error('Logout failed:', e)
        }
    }

    const handleCompetitionChange = useCallback(
        async (selectedId: number) => {
            const updated = await setActiveCompetition(selectedId)
            if (updated) {
                await refreshMe()
                router.reload()
            }
        },
        [setActiveCompetition, refreshMe, router]
    )

    const allMenuItems = [
        { href: '/info', label: 'Üldinfo', icon: <InfoIcon /> },
        { href: '/course', label: 'Rada', icon: <MapIcon /> },
        { href: '/ctp', label: 'CTP rajad', icon: <GolfCourseIcon /> },
        { href: '/stats', label: 'Minu statistika', icon: <LineChartIcon /> },
        { href: '/results', label: 'Top 10', icon: <EmojiEventsIcon /> },
        { href: '/check-in', label: 'Loosimised', icon: <CardGiftcardIcon /> },
        { href: '/prediction', label: 'Ennustusmäng', icon: <QuizIcon /> },
        { href: '/feedback', label: 'Tagasiside', icon: <FeedbackIcon /> },
        { href: '/history', label: 'Ajalugu', icon: <HistoryIcon /> },
    ]

    // Filter menu items based on activeCompetitionId
    const menuItems = allMenuItems.filter((item) => {
        // Always show Info, History, and Results
        if (item.href === '/info' || item.href === '/history' || item.href === '/results') {
            return true
        }
        // Only show other items if user has activeCompetitionId
        return !!user?.activeCompetitionId
    })

    return (
        <Box display="flex" flexDirection="column" minHeight="100vh">
            <AppBar position="static" sx={{ width: '100%' }}>
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', px: { xs: 2, sm: 3 } }}>
                    {/* Left side - Menu button */}
                    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 40 }}>
                        {minimal ? (
                            <Box sx={{ width: 40 }} />
                        ) : (
                            <IconButton
                                edge="start"
                                color="inherit"
                                aria-label="menu"
                                onClick={() => setDrawerOpen(true)}
                            >
                                <MenuIcon />
                            </IconButton>
                        )}
                    </Box>

                    {/* Center - Title */}
                    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                        <Link href="/" passHref legacyBehavior>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    cursor: 'pointer',
                                }}
                            >
                                Järva-Jaani 100!
                            </Typography>
                        </Link>
                    </Box>

                    {/* Right side - Logo */}
                    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 57 }}>
                        <Link href="/" passHref legacyBehavior>
                            <Box display="flex" alignItems="center" sx={{ cursor: 'pointer' }}>
                                <Image src="/logo.webp" alt="Logo" width={57} height={49} priority />
                            </Box>
                        </Link>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Drawer only in non-minimal mode */}
            {!minimal && (
                <Drawer
                    anchor="left"
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    PaperProps={{
                        sx: {
                            backgroundColor: '#f9f9f9',
                            width: 275,
                        },
                    }}
                >
                    <Box
                        sx={{ p: 2 }}
                        role="presentation"
                        onClick={() => setDrawerOpen(false)}
                        onKeyDown={() => setDrawerOpen(false)}
                    >
                        {isAuthed && competitions.length > 0 && (
                            <Box sx={{ mb: 2 }} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                                    Võistlus
                                </Typography>
                                {competitions.length > 1 ? (
                                    <FormControl fullWidth size="small">
                                        <Select
                                            value={user?.activeCompetitionId ?? ''}
                                            displayEmpty
                                            onChange={(e) => {
                                                const id = Number(e.target.value)
                                                if (Number.isFinite(id)) handleCompetitionChange(id)
                                            }}
                                            renderValue={(value) => {
                                                const c = competitions.find((x) => x.id === value)
                                                return (
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            whiteSpace: 'normal',
                                                            wordBreak: 'break-word',
                                                            py: 0.5,
                                                        }}
                                                    >
                                                        {decodeHtmlEntities(c?.name ?? null) || `Competition ${value ?? ''}`}
                                                    </Typography>
                                                )
                                            }}
                                            sx={{
                                                '& .MuiSelect-select': {
                                                    whiteSpace: 'normal',
                                                    wordBreak: 'break-word',
                                                    py: 1,
                                                },
                                            }}
                                        >
                                            {competitions.map((c) => (
                                                <MenuItem key={c.id} value={c.id} sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                                    {decodeHtmlEntities(c.name) || `Competition ${c.id}`}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                ) : (
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 500,
                                            color: 'text.primary',
                                            whiteSpace: 'normal',
                                            wordBreak: 'break-word',
                                        }}
                                    >
                                        {decodeHtmlEntities(competitions[0]?.name) || `Competition ${competitions[0]?.id ?? ''}`}
                                    </Typography>
                                )}
                            </Box>
                        )}
                        <List>
                            {menuItems.map(({ href, label, icon }) => {
                                const isActive = currentPath === href
                                const showDividerBefore = href === '/check-in'

                                return (
                                    <React.Fragment key={href}>
                                        {showDividerBefore && <Divider sx={{ my: 1.5 }} />}
                                        <Link href={href} passHref legacyBehavior>
                                            <ListItem disablePadding>
                                                <ListItemButton sx={{ borderRadius: 2 }}>
                                                    <ListItemIcon sx={{ color: 'primary.main' }}>{icon}</ListItemIcon>
                                                    <ListItemText
                                                        primary={
                                                            <Typography
                                                                sx={{
                                                                    fontWeight: 500,
                                                                    textDecoration: isActive ? 'underline' : 'none',
                                                                    textDecorationColor: isActive ? 'primary.main' : 'inherit',
                                                                    textUnderlineOffset: '6px',
                                                                    color: 'text.primary',
                                                                }}
                                                            >
                                                                {label}
                                                            </Typography>
                                                        }
                                                    />
                                                </ListItemButton>
                                            </ListItem>
                                        </Link>
                                    </React.Fragment>
                                )
                            })}
                        </List>

                        {isAuthed && user?.isAdmin && (
                            <>
                                <Divider sx={{ my: 1.5 }} />
                                <List>
                                    <Link href="/admin" passHref legacyBehavior>
                                        <ListItem disablePadding>
                                            <ListItemButton sx={{ borderRadius: 2 }}>
                                                <ListItemIcon sx={{ color: 'primary.main' }}>
                                                    <AdminPanelSettingsIcon />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Typography
                                                            sx={{
                                                                fontWeight: 500,
                                                                textDecoration: currentPath === '/admin' ? 'underline' : 'none',
                                                                textDecorationColor: currentPath === '/admin' ? 'primary.main' : 'inherit',
                                                                textUnderlineOffset: '6px',
                                                                color: 'text.primary',
                                                            }}
                                                        >
                                                            Admin
                                                        </Typography>
                                                    }
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                    </Link>
                                </List>
                            </>
                        )}

                        {isAuthed && (
                            <>
                                <Divider sx={{ my: 1.5 }} />
                                <List>
                                    <ListItem disablePadding>
                                        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2 }}>
                                            <ListItemIcon sx={{ color: 'primary.main' }}>
                                                <LogoutIcon />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Typography sx={{ fontWeight: 500, color: 'text.primary' }}>
                                                        Logi välja
                                                    </Typography>
                                                }
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                </List>
                            </>
                        )}
                    </Box>
                </Drawer>
            )}

            <Box sx={{ maxWidth: 900, mx: 'auto', width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Container
                    sx={{
                        mt: 2,
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                    component="main"
                >
                    {children}
                </Container>

                <Box
                    component="footer"
                    sx={{
                        py: 1,
                        px: 2,
                        mt: '1rem',
                        backgroundColor: 'secondary.main',
                        color: 'white',
                        textAlign: 'center',
                        width: '100%',
                    }}
                >
                    <Typography variant="body2" sx={{fontSize: '0.8rem'}}>
                        Probleem? Helista +372 51994444</Typography>
                </Box>
            </Box>
        </Box>
    )
}
