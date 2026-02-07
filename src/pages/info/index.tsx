import Layout from '@/src/components/Layout'
import {Box, Link as MuiLink, Typography} from '@mui/material'
import FacebookIcon from '@mui/icons-material/Facebook'
import MapIcon from '@mui/icons-material/Map'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

const cardSx = {
    width: '100%',
    boxSizing: 'border-box' as const,
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'divider',
    backgroundColor: 'background.paper',
    px: 2.5,
    py: 2,
}

const linkCardSx = {
    ...cardSx,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    textDecoration: 'none',
    color: 'inherit',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
    '&:hover': {
        backgroundColor: 'action.hover',
        borderColor: 'primary.main',
    },
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <Typography
            variant="subtitle2"
            color="text.secondary"
            fontWeight={600}
            sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}
        >
            {children}
        </Typography>
    )
}

export default function InfoPage() {
    return (
        <Layout>
            <Box sx={{ width: '100%', maxWidth: '100%', px: 2, py: 3, boxSizing: 'border-box' }}>
                <Typography variant="h4" fontWeight="bold" textAlign="center">
                    Üldinfo
                </Typography>

                <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Map */}
                    <Box>
                        <SectionTitle>Raja kaart</SectionTitle>
                        <Box
                            component="a"
                            href="https://www.google.com/maps/d/u/0/viewer?mid=1MKfo8i7cJcaNYnHXZGOwrDgGy2x_HSY&ll=59.03964897449547%2C25.88895708498072&z=15"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={linkCardSx}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <MapIcon color="primary" />
                                <Typography fontWeight={600} color="primary.main">
                                    Google Maps Kaart
                                </Typography>
                            </Box>
                            <ChevronRightIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                        </Box>
                    </Box>

                    {/* Organizers */}
                    <Box>
                        <SectionTitle>Korraldajad</SectionTitle>
                        <Box sx={cardSx}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 0.5 }}>
                                    <Typography variant="body1" fontWeight={500}>
                                        Arto Saar:
                                    </Typography>
                                    <MuiLink href="tel:+3725257373" color="primary" underline="hover">
                                        52 57373
                                    </MuiLink>
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 0.5 }}>
                                    <Typography variant="body1" fontWeight={500}>
                                        Anti Orgla:
                                    </Typography>
                                    <MuiLink href="tel:+37251994444" color="primary" underline="hover">
                                        51 994444
                                    </MuiLink>
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Metrix */}
                    <Box>
                        <SectionTitle>Tulemused</SectionTitle>
                        <Box
                            component="a"
                            href="https://discgolfmetrix.com/3522494"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={linkCardSx}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <EmojiEventsIcon color="primary" />
                                <Typography fontWeight={600} color="primary.main">
                                    Discgolf Metrix
                                </Typography>
                            </Box>
                            <ChevronRightIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                        </Box>
                    </Box>

                    {/* Facebook */}
                    <Box>
                        <SectionTitle>Sotsiaalmeedia</SectionTitle>
                        <Box
                            component="a"
                            href="https://www.facebook.com/events/1663196438386742"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={linkCardSx}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <FacebookIcon color="primary" />
                                <Typography fontWeight={600} color="primary.main">
                                    Facebook
                                </Typography>
                            </Box>
                            <ChevronRightIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Layout>
    )
}
