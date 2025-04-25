import {AppBar, Toolbar, Typography, Container, Box} from '@mui/material'
import {ReactNode} from 'react'

export default function Layout({children}: { children: ReactNode }) {
    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Box sx={{width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <Box component="img" src="/logo.png" alt="Logo" sx={{height: 40, mr: 2}}/>
                        <Typography variant="h6">Järva-Jaani 100!</Typography>
                    </Box>
                </Toolbar>
            </AppBar>
            <Container sx={{mt: 4}}>
                {children}
            </Container>
        </>
    )
}
