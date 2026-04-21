import Layout from '@/src/components/Layout'
import {Box, Typography} from '@mui/material'
import Image from 'next/image'
import Countdown from 'react-countdown'
import {useSyncExternalStore} from 'react'
import {useAuth} from '@/src/contexts/AuthContext'
import {useTranslation} from 'react-i18next'

export default function HomePage() {
    const {t} = useTranslation('home')
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
                        {t('welcome', {name: firstName})}
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
                    {t('countdownTitle')}
                </Typography>

                <Typography variant="h5" fontWeight="bold" component="div">
                    {mounted && (
                        <Countdown
                            date={targetDate}
                            daysInHours={false}
                            renderer={({ days, hours, minutes, seconds }) => (
                                <>
                                    <Typography variant="h5" fontWeight="bold" component="span" display="block">
                                        {t('countdownDays', {days})}
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold" component="span" display="block">
                                        {t('countdownRest', {hours, minutes, seconds})}
                                    </Typography>
                                </>
                            )}
                        />
                    )}
                </Typography>
            </Box>
        </Layout>
    )
}
