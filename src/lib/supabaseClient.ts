import {createClient, type SupabaseClient} from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL")
if (!anon) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY")

declare global {
    // eslint-disable-next-line no-var
    var __SUPABASE__: SupabaseClient | undefined
}

export const supabase =
    globalThis.__SUPABASE__ ?? createClient(url, anon)

if (process.env.NODE_ENV !== "production") {
    globalThis.__SUPABASE__ = supabase
}
