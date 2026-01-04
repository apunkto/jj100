import {ReactNode, useEffect} from "react"
import {useRouter} from "next/router"
import {Box, CircularProgress} from "@mui/material"
import {useAuth} from "@/src/contexts/AuthContext"

type Props = {
    children: ReactNode
    publicRoutes?: string[]
}

export default function AuthGate({children, publicRoutes = ["/login"]}: Props) {
    const router = useRouter()
    const {loading, session} = useAuth()

    const isPublicRoute = publicRoutes.includes(router.pathname)

    useEffect(() => {
        if (loading) return
        if (isPublicRoute) return

        if (!session) {
            const next = encodeURIComponent(router.asPath)
            router.replace(`/login?next=${next}`)
        }
    }, [loading, session, isPublicRoute, router])

    // While auth is loading, block only protected routes
    if (!isPublicRoute && (loading || !session)) {
        return (
            <Box mt={6} display="flex" justifyContent="center">
                <CircularProgress/>
            </Box>
        )
    }

    return <>{children}</>
}
