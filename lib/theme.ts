import {createTheme} from '@mui/material/styles'

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#313690FF',
        },
        secondary: {
            main: '#3e3e3e',
        },
    },
    shape: {
        borderRadius: 12,
    },
    typography: {
        fontFamily: `'Poppins', sans-serif`,
        h4: {
            fontSize: '22px',           // default (xs)
            fontWeight: 700,
            lineHeight: "1.5rem",
            '@media (min-width:600px)': {
                fontSize: '28px',         // sm and up
            },
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                },
            },
        },
    },
})

/**
 * Nested `ThemeProvider` on LED dashboard routes (default; use `?darkMode=false` for light).
 * High contrast for outdoor P5 LED — not tied to system dark mode.
 */
export const dashboardLedDarkTheme = createTheme({
    ...theme,
    palette: {
        ...theme.palette,
        mode: 'dark',
        primary: {
            main: '#9aa3ff',
            dark: '#6f78cc',
            light: '#b8c0ff',
        },
        background: {
            default: '#050508',
            paper: '#0c0d12',
        },
        text: {
            primary: 'rgba(255,255,255,0.95)',
            secondary: 'rgba(255,255,255,0.72)',
        },
        divider: 'rgba(255,255,255,0.14)',
    },
})

export default theme
