// src/api/metrixApi.ts

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

type StatsPayload = MetrixPlayerStats;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE) {
    throw new Error('Missing NEXT_PUBLIC_API_BASE_URL');
}

const getMetrixPlayers = async (): Promise<MetrixPlayerListItem[]> => {
    const res = await fetch(`${API_BASE}/metrix/players`);
    if (!res.ok) throw new Error('Failed to fetch metrix players');

    const result = (await res.json()) as ApiResponse<PlayersPayload>;
    if (!result.success) throw new Error('Backend returned error fetching metrix players');

    return result.data.players;
};

const getMetrixPlayerStats = async (userId: number): Promise<MetrixPlayerStats> => {
    const res = await fetch(`${API_BASE}/metrix/player/${userId}/stats`);
    if (!res.ok) throw new Error('Failed to fetch metrix player stats');

    const result = (await res.json()) as ApiResponse<StatsPayload>;
    if (!result.success) throw new Error('Backend returned error fetching metrix player stats');

    return result.data;
};

export default function useMetrixApi() {
    return {
        getMetrixPlayers,
        getMetrixPlayerStats,
    };
}
