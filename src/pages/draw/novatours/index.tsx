import {useEffect} from 'react'
import {useRouter} from 'next/router'

export default function FinalGameDrawPage() {
    const router = useRouter()

    useEffect(() => {
        router.replace('/admin/final-game')
    }, [router])

    return null
}
