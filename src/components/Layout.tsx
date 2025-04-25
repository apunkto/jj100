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
    ListItemButton, ListItemIcon
} from '@mui/material'
import { ReactNode, useState } from 'react'
import MenuIcon from '@mui/icons-material/Menu'
import Link from 'next/link'
import Image from 'next/image'
import GolfCourseIcon from '@mui/icons-material/GolfCourse'
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard'
export default function Layout({ children }: { children: ReactNode }) {
    const [drawerOpen, setDrawerOpen] = useState(false)

    return (
        <Box display="flex" flexDirection="column" minHeight="100vh">
            {/* Header */}
            <AppBar position="static">
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    {/* Left side: Menu button */}
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        onClick={() => setDrawerOpen(true)}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>


                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Järva-Jaani 100!
                    </Typography>

                    <Box display="flex" alignItems="center">
                        <Image
                            src="/logo.webp"
                            alt="Logo"
                            width={57}
                            height={35}
                            priority
                        />

                    </Box>
                </Toolbar>
            </AppBar>

            {/* Drawer (menu) */}
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{
                    sx: {
                        backgroundColor: '#f9f9f9', // light background
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
                    {/* Menu Title */}
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Menüü
                    </Typography>

                    {/* Links */}
                    <List>
                        <Link href="/ctp" passHref legacyBehavior>
                            <ListItem disablePadding>
                                <ListItemButton sx={{ borderRadius: 2 }}>
                                    <ListItemIcon>
                                        <GolfCourseIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="CTP mängud" />
                                </ListItemButton>
                            </ListItem>
                        </Link>

                        <Link href="/check-in" passHref legacyBehavior>
                            <ListItem disablePadding>
                                <ListItemButton sx={{ borderRadius: 2 }}>
                                    <ListItemIcon>
                                        <CardGiftcardIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Loosimängud" />
                                </ListItemButton>
                            </ListItem>
                        </Link>
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
                }}
            >
                <Typography variant="body2">
                    Probleem? Helista +372 51994444
                </Typography>
            </Box>
        </Box>
    )
}
