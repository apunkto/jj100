// components/Layout.tsx
import {
    AppBar,
    Box,
    Container,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
} from '@mui/material'
import {ReactNode, useEffect, useState} from 'react'
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

export default function Layout({
                                   children,
                                   minimal = false,
                               }: {
    children: ReactNode
    minimal?: boolean
}) {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [isAuthed, setIsAuthed] = useState(false)

    const router = useRouter()
    const currentPath = router.pathname

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setIsAuthed(!!data.session)
        })

        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthed(!!session)
        })

        return () => {
            sub.subscription.unsubscribe()
        }
    }, [])

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut()
            setDrawerOpen(false)
            await router.push('/login')
        } catch (e) {
            console.error('Logout failed:', e)
        }
    }

    const menuItems = [
        { href: '/info', label: 'Info', icon: <InfoIcon /> },
        { href: '/course', label: 'Rada', icon: <MapIcon /> },
        { href: '/ctp', label: 'CTP rajad', icon: <GolfCourseIcon /> },
        { href: '/stats', label: 'Statistika', icon: <LineChartIcon /> },
        { href: '/check-in', label: 'Loosimängud', icon: <CardGiftcardIcon /> },
        { href: '/feedback', label: 'Tagasiside', icon: <FeedbackIcon /> },
        { href: '/history', label: 'Ajalugu', icon: <HistoryIcon /> },
    ]

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
                    mt: 4,
                    mb: 6,
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
                    py: 2,
                    px: 2,
                    mt: 'auto',
                    backgroundColor: 'secondary.main',
                    color: 'white',
                    textAlign: 'center',
                    width: '100%',
                }}
            >
                <Typography variant="body2">Probleem? Helista +372 51994444</Typography>
            </Box>
        </Box>
    )
}
