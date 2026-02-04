import {useEffect} from 'react'
import {useRouter} from 'next/router'

export default function DrawPage() {
    const router = useRouter()

    useEffect(() => {
        router.replace('/admin/draw')
    }, [router])

    return null
}
