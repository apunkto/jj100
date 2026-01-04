declare global {
    // eslint-disable-next-line no-var
    var __ACCESS_TOKEN__: string | null | undefined
}

export function setAccessToken(token: string | null) {
    globalThis.__ACCESS_TOKEN__ = token
}

export function getAccessToken() {
    return globalThis.__ACCESS_TOKEN__ ?? null
}
