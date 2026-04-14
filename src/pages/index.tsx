import Layout from '@/src/components/Layout'
import {Box, Typography} from '@mui/material'
import Image from 'next/image'
import Countdown from 'react-countdown'
import {useSyncExternalStore} from 'react'
import {useAuth} from '@/src/contexts/AuthContext'

export default function HomePage() {
    const targetDate = new Date('2026-05-02T08:00:00')
    const mounted = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    )
    const {user} = useAuth()
    const firstName = user?.name?.split(' ')[0]

    return (
        <Layout>
              <Box textAlign="center" mt={6}>
                {firstName && (
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        Tere tulemast {firstName}!
                    </Typography>
                )}
                </Box>
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
                
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Maratoni alguseni
                </Typography>

                <Typography variant="h5" fontWeight="bold">
                    {mounted && ( // 👈 Only render Countdown after mounted
                        <Countdown
                            date={targetDate}
                            daysInHours={false}
                            renderer={({ days, hours, minutes, seconds }) => (
                                <>
                                    {days} päeva<br />
                                    {hours} tundi {minutes} min {seconds} sek
                                </>
                            )}
                        />
                    )}
                </Typography>
            </Box>
        </Layout>
    )
}
