import {ThemeProvider, CssBaseline} from '@mui/material'
import type {AppProps} from 'next/app'
import theme from '@/lib/theme'
import '@/styles/fonts.css'
import {ToastProvider} from "@/src/contexts/ToastContext";

export default function App({Component, pageProps}: AppProps) {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline/>
            <ToastProvider>
                <Component {...pageProps} />
            </ToastProvider>
        </ThemeProvider>
    )
}
