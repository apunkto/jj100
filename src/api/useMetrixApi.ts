// src/api/metrixApi.ts

import {authedFetch} from "@/src/api/authedFetch";

export type MetrixPlayerListItem = {
    userId: number;
    name: string;
    className: string;
    diff: number;
    orderNumber: number;
    dnf: boolean;
};

export type MetrixPlayerStats = {
    competitionId: number;
    cachedAt: string;
    player: {
        userId: number;
        name: string;
        className: string;
        orderNumber: number;
        diff: number;
        sum: number;
        dnf: boolean;
    };
    deltaToClassLeader: number | null;
    overallPlace: number | null;
    scoreBreakdown: {
        eagles: number;
        birdies: number;
        pars: number;
        bogeys: number;
        doubleBogeys: number;
        tripleOrWorse: number;
    } | null;
    holes: { played: number; total: number; playedPct: number | null };
    obHoles: number;
};

// Generic envelope your BE returns: { success: true, data: ... }
type ApiSuccess<T> = { success: true; data: T };
type ApiFailure = { success: false; error: unknown };
type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type MetrixIdentity = { userId: number; name: string }

type PreLoginPayload = {
    inDb: boolean
    identities?: MetrixIdentity[]
}

type CheckEmailPayload = {
    metrixUserId: number | null
    identities: MetrixIdentity[]
}

type StatsPayload = MetrixPlayerStats;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE) {
    throw new Error('Missing NEXT_PUBLIC_API_BASE_URL');
}


const getMetrixPlayerStats = async (): Promise<MetrixPlayerStats> => {
    const res = await authedFetch(`${API_BASE}/metrix/player/stats`);
    if (!res.ok) throw new Error('Failed to fetch metrix player stats');

    const result = (await res.json()) as ApiResponse<StatsPayload>;
    if (!result.success) throw new Error('Backend returned error fetching metrix player stats');

    return result.data;
};

const preLogin = async (email: string): Promise<PreLoginPayload> => {
    const res = await fetch(`${API_BASE}/auth/pre-login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email}),
    })

    if (!res.ok) throw new Error('Failed to check email')

    const result = (await res.json()) as ApiResponse<PreLoginPayload>
    if (!result.success) throw new Error('Backend returned error checking email')

    return result.data
}

const registerFromMetrix = async (email: string, metrixUserId: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/auth/register-from-metrix`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, metrixUserId}),
    })

    if (!res.ok) {
        const errorData = (await res.json().catch(() => ({})) as { error?: string })
        throw new Error(errorData.error || 'Failed to register from Metrix')
    }

    const result = (await res.json()) as ApiResponse<unknown>
    if (!result.success) {
        throw new Error(typeof result.error === 'string' ? result.error : 'Failed to register from Metrix')
    }
}

const checkMetrixEmail = async (email: string): Promise<CheckEmailPayload> => {
    const res = await fetch(`${API_BASE}/metrix/check-email`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email}),
    })

    if (!res.ok) throw new Error('Failed to check email')

    const result = (await res.json()) as ApiResponse<CheckEmailPayload>
    if (!result.success) throw new Error('Backend returned error checking email')

    return result.data
}

const getUserCurrentHoleNumber = async (): Promise<number | null> => {
    //TODO: switch to api call when competition is created
    return 1;
    /*
    const res = await authedFetch(`${API_BASE}/metrix/player/current-hole`);
    if (!res.ok) throw new Error('Failed to fetch user current hole number');

    const result = (await res.json()) as ApiResponse<{ currentHole: number | null }>;
    if (!result.success) throw new Error('Backend returned error fetching user current hole number');
    return result.data.currentHole;*/
}


export default function useMetrixApi() {
    return {
        getMetrixPlayerStats,
        preLogin,
        registerFromMetrix,
        checkMetrixEmail,
        getUserCurrentHoleNumber
    };
}


