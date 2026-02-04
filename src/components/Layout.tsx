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
import {ReactNode, useCallback, useEffect, useState} from 'react'
import MenuIcon from '@mui/icons-material/Menu'
import Link from 'next/link'
import Image from 'next/image'
import GolfCourseIcon from '@mui/icons-material/GolfCourse'
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard'
import MapIcon from '@mui/icons-material/Map'
import InfoIcon from '@mui/icons-material/Info'
import FeedbackIcon from '@mui/icons-material/Feedback'
import HistoryIcon from '@mui/icons-material/History'
import LogoutIcon from '@mui/icons-material/Logout'
import LineChartIcon from '@mui/icons-material/ShowChart'
import {useRouter} from 'next/router'
import {supabase} from '@/src/lib/supabaseClient'
import {useAuth} from '@/src/contexts/AuthContext'
import usePlayerApi, {CompetitionOption} from '@/src/api/usePlayerApi'

/** Decode common HTML entities in text (e.g. &rarr; → →) so they display correctly. */
function decodeHtmlEntities(text: string | null | undefined): string {
    if (text == null || text === '') return text ?? ''
    return text
        .replace(/&rarr;/g, '→')
        .replace(/&larr;/g, '←')
        .replace(/&nbsp;/g, '\u00A0')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)))
}

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
    const isAuthed = !!session

    const router = useRouter()
    const currentPath = router.pathname

    useEffect(() => {
        if (user) {
            getPlayerCompetitions().then(setCompetitions)
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
        { href: '/info', label: 'Info', icon: <InfoIcon /> },
        { href: '/course', label: 'Rada', icon: <MapIcon /> },
        { href: '/ctp', label: 'CTP rajad', icon: <GolfCourseIcon /> },
        { href: '/stats', label: 'Statistika', icon: <LineChartIcon /> },
        { href: '/check-in', label: 'Loosimängud', icon: <CardGiftcardIcon /> },
        { href: '/feedback', label: 'Tagasiside', icon: <FeedbackIcon /> },
        { href: '/history', label: 'Ajalugu', icon: <HistoryIcon /> },
    ]

    // Filter menu items based on activeCompetitionId
    const menuItems = allMenuItems.filter((item) => {
        // Always show Info and History
        if (item.href === '/info' || item.href === '/history') {
            return true
        }
        // Only show other items if user has activeCompetitionId
        return !!user?.activeCompetitionId
    })

    return (
        <Box display="flex" flexDirection="column" minHeight="100vh" maxWidth={900} alignItems="center" mx="auto">
            <AppBar position="static">
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    {/* Menu button (hidden in minimal mode) */}
                    {minimal ? (
                        <Box sx={{ width: 40 }} />
                    ) : (
                        <IconButton
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            onClick={() => setDrawerOpen(true)}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}

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

                    <Link href="/" passHref legacyBehavior>
                        <Box display="flex" alignItems="center" sx={{ cursor: 'pointer' }}>
                            <Image src="/logo.webp" alt="Logo" width={57} height={49} priority />
                        </Box>
                    </Link>
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
                            width: 250,
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

                                return (
                                    <Link href={href} passHref legacyBehavior key={href}>
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
                                )
                            })}
                        </List>

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
    )
}
