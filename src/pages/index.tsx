import Layout from '@/src/components/Layout'
import { Box, Typography } from '@mui/material'
import Image from 'next/image'
import Countdown from 'react-countdown'

export default function HomePage() {
    const targetDate = new Date('2025-05-03T08:00:00')

    return (
        <Layout>
            <Box display="flex" justifyContent="center" alignItems="center" mt={2}>
                <Image
                    src="/white_logo.webp"
                    alt="Logo"
                    width={300}
                    height={255}
                    priority
                    style={{ maxWidth: '100%', height: 'auto' }}
                />
            </Box>

            <Box textAlign="center" mt={6}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Aega ürituseni
                </Typography>

                <Typography variant="h5" fontWeight="bold">
                    <Countdown
                        date={targetDate}
                        daysInHours={false}
                        renderer={({ days, hours, minutes, seconds }) => (
                            <>
                                {days} päeva<br/>
                                {hours} tundi {minutes} min {seconds} sek

                            </>
                        )}
                    />
                </Typography>
            </Box>
        </Layout>
    )
}
