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
                <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
                <link rel="manifest" href="/site.webmanifest" />
                <link rel="shortcut icon" href="/favicon.ico" />
                <meta name="theme-color" content="#ffffff" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="mobile-web-app-capable" content="yes" />
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
