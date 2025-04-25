import { ThemeProvider, CssBaseline } from '@mui/material'
import type { AppProps } from 'next/app'
import theme from '@/lib/theme'
import '@/styles/fonts.css'

export default function App({ Component, pageProps }: AppProps) {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Component {...pageProps} />
        </ThemeProvider>
    )
}
