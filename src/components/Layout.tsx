import { AppBar, Toolbar, Typography, Container, Box } from '@mui/material'
import { ReactNode } from 'react'

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <Box
            display="flex"
            flexDirection="column"
            minHeight="100vh"
        >
            {/* Header */}
            <AppBar position="static">
                <Toolbar>
                    <Box
                        sx={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <Box component="img" src="/logo.png" alt="Logo" sx={{ height: 40, mr: 2 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Järva-Jaani 100!
                        </Typography>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Content */}
            <Container sx={{ mt: 4, mb: 6 }} component="main">
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
