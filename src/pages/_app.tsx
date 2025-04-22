import { ThemeProvider, CssBaseline } from '@mui/material'
import type { AppProps } from 'next/app'
import theme from '@/lib/theme'

export default function App({ Component, pageProps }: AppProps) {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Component {...pageProps} />
        </ThemeProvider>
    )
}
