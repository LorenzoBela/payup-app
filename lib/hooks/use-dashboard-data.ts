"use client";

import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { 
    getTeamExpenses, 
    getTeamSettlements, 
    getTeamBalances,
    getDashboardData 
} from "@/app/actions/expenses";
import { getTeamLogs } from "@/app/actions/logs";
import { getTeamMembers } from "@/app/actions/teams";

// SWR configuration for optimal performance
const swrConfig = {
    revalidateOnFocus: false, // Don't refetch on window focus (reduce API calls)
    revalidateOnReconnect: true,
    dedupingInterval: 5000, // Dedupe requests within 5 seconds
    errorRetryCount: 2,
};

// Fast refresh config for data that updates frequently
const fastRefreshConfig = {
    ...swrConfig,
    refreshInterval: 30000, // Refresh every 30 seconds
};

// Type definitions
interface Expense {
    id: string;
    description: string;
    amount: number;
    category: string;
    paid_by_name: string;
    created_at: Date;
    paid_by: string;
    currency: string;
    receipt_url: string | null;
    team_id: string | null;
    updated_at: Date;
    deleted_at: Date | null;
}

interface Settlement {
    id: string;
    expense_id: string;
    expense_description: string;
    owed_by: string;
    owed_to: string;
    owed_by_id: string;
    owed_to_id: string;
    amount: number;
    status: string;
    paid_at: Date | null;
    isCurrentUserOwing: boolean;
    isCurrentUserOwed: boolean;
}

interface Balances {
    youOwe: number;
    owedToYou: number;
    youOweCount: number;
    owedToYouCount: number;
}

interface Log {
    id: string;
    action: string;
    details: string;
    created_at: Date;
    user_name: string;
    user_email: string;
}

interface Member {
    id: string;
    name: string;
    email: string;
    role: string;
    joinedAt: Date;
}

// Hook for unified dashboard data (recommended for initial load)
export function useDashboardData(teamId: string | null) {
    const { data, error, isLoading, mutate } = useSWR(
        teamId ? ["dashboard", teamId] : null,
        () => getDashboardData(teamId!),
        fastRefreshConfig
    );

    return {
        data,
        isLoading,
        isError: !!error,
        mutate,
    };
}

// Hook for team balances with optimistic updates
export function useTeamBalances(teamId: string | null) {
    const { data, error, isLoading, mutate } = useSWR<Balances>(
        teamId ? ["balances", teamId] : null,
        async () => {
            const result = await getTeamBalances(teamId!);
            return result;
        },
        fastRefreshConfig
    );

    return {
        balances: data || { youOwe: 0, owedToYou: 0, youOweCount: 0, owedToYouCount: 0 },
        isLoading,
        isError: !!error,
        mutate,
    };
}

// Infinite scroll hook for expenses
export function useTeamExpenses(teamId: string | null, pageSize = 20) {
    const getKey = (pageIndex: number, previousPageData: { expenses: Expense[]; nextCursor: string | null } | null) => {
        if (!teamId) return null;
        if (previousPageData && !previousPageData.nextCursor) return null; // No more pages
        
        const cursor = previousPageData?.nextCursor;
        return ["expenses", teamId, cursor, pageSize];
    };

    const { data, error, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite(
        getKey,
        async ([, teamId, cursor]) => {
            const result = await getTeamExpenses(teamId as string, { 
                cursor: cursor as string | undefined, 
                limit: pageSize 
            });
            return result;
        },
        {
            ...swrConfig,
            revalidateFirstPage: true,
            parallel: false, // Load pages sequentially
        }
    );

    // Flatten all pages
    const expenses = data ? data.flatMap(page => page.expenses) : [];
    const hasMore = data ? data[data.length - 1]?.nextCursor !== null : false;

    return {
        expenses,
        isLoading,
        isLoadingMore: isValidating && size > 1,
        isError: !!error,
        hasMore,
        loadMore: () => setSize(size + 1),
        mutate,
    };
}

// Infinite scroll hook for settlements
export function useTeamSettlements(teamId: string | null, pageSize = 15) {
    const getKey = (pageIndex: number, previousPageData: { settlements: Settlement[]; nextCursor: string | null } | null) => {
        if (!teamId) return null;
        if (previousPageData && !previousPageData.nextCursor) return null;
        
        const cursor = previousPageData?.nextCursor;
        return ["settlements", teamId, cursor, pageSize];
    };

    const { data, error, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite(
        getKey,
        async ([, teamId, cursor]) => {
            const result = await getTeamSettlements(teamId as string, { 
                cursor: cursor as string | undefined, 
                limit: pageSize 
            });
            return result;
        },
        {
            ...swrConfig,
            revalidateFirstPage: true,
            parallel: false,
        }
    );

    const settlements = data ? data.flatMap(page => page.settlements) : [];
    const hasMore = data ? data[data.length - 1]?.nextCursor !== null : false;

    return {
        settlements,
        isLoading,
        isLoadingMore: isValidating && size > 1,
        isError: !!error,
        hasMore,
        loadMore: () => setSize(size + 1),
        mutate,
    };
}

// Infinite scroll hook for logs
export function useTeamLogs(teamId: string | null, pageSize = 30) {
    const getKey = (pageIndex: number, previousPageData: { logs: Log[]; nextCursor: string | null } | null) => {
        if (!teamId) return null;
        if (previousPageData && !previousPageData.nextCursor) return null;
        
        const cursor = previousPageData?.nextCursor;
        return ["logs", teamId, cursor, pageSize];
    };

    const { data, error, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite(
        getKey,
        async ([, teamId, cursor]) => {
            const result = await getTeamLogs(teamId as string, { 
                cursor: cursor as string | undefined, 
                limit: pageSize 
            });
            return result;
        },
        {
            ...swrConfig,
            revalidateFirstPage: true,
            parallel: false,
        }
    );

    const logs = data ? data.flatMap(page => page.logs) : [];
    const hasMore = data ? data[data.length - 1]?.nextCursor !== null : false;

    return {
        logs,
        isLoading,
        isLoadingMore: isValidating && size > 1,
        isError: !!error,
        hasMore,
        loadMore: () => setSize(size + 1),
        mutate,
    };
}

// Hook for team members (usually small list, no pagination needed)
export function useTeamMembers(teamId: string | null) {
    const { data, error, isLoading, mutate } = useSWR<Member[]>(
        teamId ? ["members", teamId] : null,
        () => getTeamMembers(teamId!),
        swrConfig
    );

    return {
        members: data || [],
        isLoading,
        isError: !!error,
        mutate,
    };
}

// Utility hook to invalidate all dashboard data (call after mutations)
export function useInvalidateDashboard() {
    const { mutate } = useSWR(null);
    
    return (teamId: string) => {
        // Invalidate all dashboard-related caches for this team
        mutate((key: unknown) => {
            if (Array.isArray(key)) {
                return key[1] === teamId;
            }
            return false;
        }, undefined, { revalidate: true });
    };
}

