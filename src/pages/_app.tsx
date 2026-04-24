import {CssBaseline, ThemeProvider} from '@mui/material'
import type {AppProps} from 'next/app'
import theme from '@/lib/theme'
import '@/styles/fonts.css'
import {ToastProvider} from "@/src/contexts/ToastContext"
import Head from 'next/head'
import '@/styles/globals.css'
import AuthGate from "@/src/components/AuthGate"
import {AuthProvider} from "@/src/contexts/AuthContext"
import {ErrorBoundary} from "@/src/components/ErrorBoundary"
import '@/src/i18n/i18n'
import {I18nHead} from '@/src/components/I18nHead'

export default function App({Component, pageProps}: AppProps) {
    return (
        <>
            <I18nHead />
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png"/>
                <link rel="manifest" href="/site.webmanifest"/>
                <link rel="shortcut icon" href="/favicon.ico"/>
                <meta name="theme-color" content="#313690"/>
                <meta name="apple-mobile-web-app-capable" content="yes"/>
                <meta name="mobile-web-app-capable" content="yes"/>
            </Head>
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                <ErrorBoundary>
                    <ToastProvider>
                        <AuthProvider>
                            <AuthGate publicRoutes={['/login']}>
                                <Component {...pageProps} />
                            </AuthGate>
                        </AuthProvider>
                    </ToastProvider>
                </ErrorBoundary>
            </ThemeProvider>
        </>
    )
}
