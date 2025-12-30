import Layout from '@/src/components/Layout'
import {Box, Button, Typography} from '@mui/material'
import FacebookIcon from '@mui/icons-material/Facebook'

export default function InfoPage() {
    return (
        <Layout>
            <Box mt={2} display="flex" flexDirection="column" alignItems="center" textAlign="center" gap={3}>
                {/* Title */}
                <Typography variant="h4" fontWeight="bold">
                    Info
                </Typography>

                {/* Google Map Link */}
                <Button
                    variant="outlined"
                    color="primary"
                    href="https://www.google.com/maps/d/u/0/viewer?mid=1MKfo8i7cJcaNYnHXZGOwrDgGy2x_HSY&ll=59.03964897449547%2C25.88895708498072&z=15"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    📍 Google Maps Kaart
                </Button>

                {/* Organizers Contacts */}
                <Box>
                    <Typography fontWeight="bold" mb={1}>
                        Korraldajad:
                    </Typography>
                    <Typography>
                        Arto Saar:{' '}
                        <a href="tel:+3725257373" style={{ color: '#1976d2', textDecoration: 'none' }}>
                            52 57373
                        </a>
                    </Typography>
                    <Typography>
                        Anti Orgla:{' '}
                        <a href="tel:+37251994444" style={{ color: '#1976d2', textDecoration: 'none' }}>
                            51 994444
                        </a>
                    </Typography>
                </Box>

                {/* Competition Link */}
                <Button
                    variant="outlined"
                    color="primary"
                    href="https://discgolfmetrix.com/3522494"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    🏆 Discgolf Metrix
                </Button>

                {/* Facebook Event Link */}
                <Button
                    variant="outlined"
                    color="primary"
                    href="https://www.facebook.com/events/1663196438386742"
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<FacebookIcon />}
                >
                    Facebooki Leht
                </Button>

            </Box>
        </Layout>
    )
}
