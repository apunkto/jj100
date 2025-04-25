import { AppBar, Toolbar, Typography, Container, Box } from '@mui/material'
import { ReactNode } from 'react'

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Box component="img" src="/jj100_logo.svg" alt="Logo" sx={{ height: 40, mr: 2 }} />
                    <Typography variant="h6">Järva-Jaani 100!</Typography>
                </Toolbar>
            </AppBar>
            <Container sx={{ mt: 4 }}>
                {children}
            </Container>
        </>
    )
}
