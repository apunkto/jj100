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
