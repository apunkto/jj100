import {useRouter} from 'next/router'
import {useEffect, useState} from 'react'
import {Box, Typography, CircularProgress} from '@mui/material'
import Layout from '@/src/components/Layout'
import useCtpApi, {CtpResult} from '@/src/api/useCtpApi'

export default function CtpHolePage() {
    const router = useRouter()
    const {hole} = router.query
    const {getCtp} = useCtpApi()

    const [ctp, setCtp] = useState<CtpResult | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!hole) return

        getCtp(parseInt(hole as string)).then((result) => {
            setCtp(result)
            setLoading(false)
        })
    }, [hole])

    return (
        <Layout>
            <Box textAlign="center" mt={4}>
                <Typography variant="h4" gutterBottom>
                    CTP #{hole}
                </Typography>

                {loading ? (
                    <CircularProgress/>
                ) : ctp?.player_name ? (
                    <>
                        <Typography variant="h6">
                            {ctp.player_name}
                        </Typography>
                        <Typography variant="h5">
                            {ctp.distance_cm} cm
                        </Typography>
                    </>
                ) : (
                    <Typography variant="body1">
                        No one has submitted a result for this hole yet.
                    </Typography>
                )}
            </Box>
        </Layout>
    )
}
