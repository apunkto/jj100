import {useEffect} from 'react'

/**
 * LED / dashboard URLs: dark (high-contrast) theme is the default.
 * Pass `darkMode=false` for the normal light theme.
 */
export function isDashboardLedDarkMode(queryDarkMode: string | string[] | undefined): boolean {
    const raw = Array.isArray(queryDarkMode) ? queryDarkMode[0] : queryDarkMode
    if (raw == null || String(raw).trim() === '') return true
    return String(raw).toLowerCase() !== 'false'
}

/** Paints the document chrome black for LED walls (outer theme in _app stays light). */
export function useLedDashboardChrome(ledDark: boolean): void {
    useEffect(() => {
        if (!ledDark) return
        const html = document.documentElement
        const body = document.body
        const nextRoot = document.getElementById('__next')
        html.style.backgroundColor = '#000000'
        body.style.backgroundColor = '#000000'
        if (nextRoot) nextRoot.style.backgroundColor = '#000000'
        return () => {
            html.style.removeProperty('background-color')
            body.style.removeProperty('background-color')
            nextRoot?.style.removeProperty('background-color')
        }
    }, [ledDark])
}
