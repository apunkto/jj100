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

type PlayersPayload = {
    competitionId: number;
    cachedAt: string;
    players: MetrixPlayerListItem[];
};

type CheckEmailPayload = {
    metrixUserId: number | null
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

const checkMetrixEmail = async (email: string): Promise<number | null> => {
    const res = await fetch(`${API_BASE}/metrix/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    })

    if (!res.ok) throw new Error('Failed to check email')

    const result = (await res.json()) as ApiResponse<CheckEmailPayload>
    if (!result.success) throw new Error('Backend returned error checking email')

    return result.data.metrixUserId
}


export default function useMetrixApi() {
    return {
        getMetrixPlayerStats,
        checkMetrixEmail,
    };
}


