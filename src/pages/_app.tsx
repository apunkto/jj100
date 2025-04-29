import {ThemeProvider, CssBaseline} from '@mui/material'
import type {AppProps} from 'next/app'
import theme from '@/lib/theme'
import '@/styles/fonts.css'
import {ToastProvider} from "@/src/contexts/ToastContext";
import Head from 'next/head' // 👈 ADD THIS

export default function App({Component, pageProps}: AppProps) {
    return (
        <>
            <Head>
                <title>Järva-Jaani 100!</title>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <meta name="description" content="Järva-Jaani 100 discgolfi üritus"/>
            </Head>
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                <ToastProvider>
                    <Component {...pageProps} />
                </ToastProvider>
            </ThemeProvider>
        </>
    )
}
