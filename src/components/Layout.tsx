import { AppBar, Toolbar, Typography, Container } from '@mui/material'
import { ReactNode } from 'react'

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6">Järva-Jaani 100!</Typography>
                </Toolbar>
            </AppBar>
            <Container sx={{ mt: 4 }}>
                {children}
            </Container>
        </>
    )
}
