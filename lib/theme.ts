import {createTheme} from '@mui/material/styles'

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#2D448FFF',
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
            lineHeight: 1.2,
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

export default theme
