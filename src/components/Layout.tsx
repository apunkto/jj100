import {
    AppBar,
    Toolbar,
    Typography,
    Container,
    Box,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    ListItemIcon,
} from '@mui/material'
import {ReactNode, useState} from 'react'
import MenuIcon from '@mui/icons-material/Menu'
import Link from 'next/link'
import Image from 'next/image'
import GolfCourseIcon from '@mui/icons-material/GolfCourse'
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard'
import MapIcon from '@mui/icons-material/Map'
import InfoIcon from '@mui/icons-material/Info'
import FeedbackIcon from '@mui/icons-material/Feedback'
import { useRouter } from 'next/router'

export default function Layout({children}: { children: ReactNode }) {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const router = useRouter()
    const currentPath = router.pathname

    return (
        <Box display="flex" flexDirection="column" minHeight="100vh" maxWidth={900} alignItems="center" mx="auto">
            {/* Header */}
            <AppBar position="static">
                <Toolbar sx={{justifyContent: 'space-between'}}>
                    {/* Left side: Menu button */}
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        onClick={() => setDrawerOpen(true)}
                        sx={{mr: 2}}
                    >
                        <MenuIcon/>
                    </IconButton>

                    {/* Title clickable */}
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

                    {/* Logo clickable */}
                    <Link href="/" passHref legacyBehavior>
                        <Box display="flex" alignItems="center" sx={{cursor: 'pointer'}}>
                            <Image
                                src="/logo.webp"
                                alt="Logo"
                                width={57}
                                height={35}
                                priority
                            />
                        </Box>
                    </Link>
                </Toolbar>
            </AppBar>

            {/* Drawer (menu) */}
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
                    sx={{p: 2}}
                    role="presentation"
                    onClick={() => setDrawerOpen(false)}
                    onKeyDown={() => setDrawerOpen(false)}
                >
                    <List>
                        {[
                            { href: '/course', label: 'Rada', icon: <MapIcon /> },
                            { href: '/ctp', label: 'CTP rajad', icon: <GolfCourseIcon /> },
                            { href: '/check-in', label: 'Loosimängud', icon: <CardGiftcardIcon /> },
                            { href: '/info', label: 'Info', icon: <InfoIcon /> },
                            { href: '/feedback', label: 'Tagasiside', icon: <FeedbackIcon /> },
                        ].map(({ href, label, icon }) => {
                            const isActive = currentPath === href

                            return (
                                <Link href={href} passHref legacyBehavior key={href}>
                                    <ListItem disablePadding>
                                        <ListItemButton sx={{ borderRadius: 2 }}>
                                            <ListItemIcon sx={{ color: 'primary.main' }}>
                                                {icon}
                                            </ListItemIcon>
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

                </Box>
            </Drawer>

            {/* Content */}
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

            {/* Footer */}
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
                <Typography variant="body2">
                    Probleem? Helista +372 51994444
                </Typography>
            </Box>
        </Box>
    )
}
