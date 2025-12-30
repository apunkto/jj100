import React, {createContext, useContext, useEffect, useMemo, useRef, useState} from "react"
import type {Session} from "@supabase/supabase-js"
import {supabase} from "@/src/lib/supabaseClient"
import usePlayerApi, {Player} from "@/src/api/usePlayerApi"

type AuthState = {
    loading: boolean
    session: Session | null
    user: Player | null
    refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true)
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<Player | null>(null)

    const { getLoggedInUser } = usePlayerApi()

    const inFlightRef = useRef(false)
    const lastTokenRef = useRef<string | null>(null)

    const refreshMe = async () => {
        const token = session?.access_token ?? null

        // if logged out, clear
        if (!token) {
            setUser(null)
            lastTokenRef.current = null
            return
        }

        // de-dupe: same token already fetched
        if (lastTokenRef.current === token && user) return

        // de-dupe: avoid double-call in StrictMode / fast re-renders
        if (inFlightRef.current) return
        inFlightRef.current = true

        try {
            const res = await getLoggedInUser()
            setUser(res ?? null)
            lastTokenRef.current = token
        } finally {
            inFlightRef.current = false
        }
    }

    useEffect(() => {
        let mounted = true

        ;(async () => {
            const { data } = await supabase.auth.getSession()
            if (!mounted) return
            setSession(data.session ?? null)
            setLoading(false)
        })()

        const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession ?? null)
        })

        return () => {
            mounted = false
            sub.subscription.unsubscribe()
        }
    }, [])

    // Single place that triggers /me when token changes
    useEffect(() => {
        refreshMe()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.access_token])

    const value = useMemo<AuthState>(
        () => ({ loading, session, user, refreshMe }),
        [loading, session, user]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error("useAuth must be used within AuthProvider")
    return ctx
}
