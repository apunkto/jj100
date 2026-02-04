import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from "react"
import type {Session} from "@supabase/supabase-js"
import {supabase} from "@/src/lib/supabaseClient"
import usePlayerApi, {Player} from "@/src/api/usePlayerApi"
import {setAccessToken} from "@/src/contexts/tokenStore"

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

    const refreshMe = useCallback(async () => {
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
    }, [session?.access_token, user, getLoggedInUser])

    useEffect(() => {
        let mounted = true

        ;(async () => {
            console.log("AuthProvider: checking initial session")
            const tTok = performance.now();
            const { data } = await supabase.auth.getSession()
            const tTokEnd = performance.now();
            console.log("AuthProvider: checking initial session took", (tTokEnd - tTok).toFixed(2), "ms")
            if (!mounted) return

            setSession(data.session ?? null)
            setAccessToken(data.session?.access_token ?? null) // ✅ add
            setLoading(false)
        })()

        const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession ?? null)
            setAccessToken(newSession?.access_token ?? null)
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
        [loading, session, user, refreshMe]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error("useAuth must be used within AuthProvider")
    return ctx
}
