"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { getUserTeams } from "@/app/actions/teams";
import useSWR from "swr";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

type Team = {
    id: string;
    name: string;
    code: string;
    role: string;
    memberCount: number;
};

type TeamContextType = {
    teams: Team[];
    selectedTeam: Team | null;
    setSelectedTeam: (team: Team | null) => void;
    isLoading: boolean;
    refreshTeams: () => Promise<void>;
};

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: React.ReactNode }) {
    const { user, isLoaded } = useUser();
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

    // Use SWR for caching team data with optimized config
    const { data: teams = [], isLoading, mutate } = useSWR<Team[]>(
        isLoaded && user ? ["user-teams", user.id] : null,
        () => getUserTeams(),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 30000,    // Cache for 30 seconds (increased from 10s)
            errorRetryCount: 2,
            keepPreviousData: true,     // Keep showing old data while fetching
            onError: (error) => {
                console.error("Failed to fetch teams", error);
                toast.error("Failed to load teams");
            },
        }
    );

    // Handle team selection when teams load
    useEffect(() => {
        if (teams.length > 0 && !selectedTeam) {
            setSelectedTeam(teams[0]);
        } else if (teams.length > 0 && selectedTeam) {
            // Update selected team data if it changed
            const current = teams.find((t) => t.id === selectedTeam.id);
            if (current && JSON.stringify(current) !== JSON.stringify(selectedTeam)) {
                setSelectedTeam(current);
            }
        } else if (teams.length === 0) {
            setSelectedTeam(null);
        }
    }, [teams, selectedTeam]);

    // Handle user logout
    useEffect(() => {
        if (isLoaded && !user) {
            setSelectedTeam(null);
        }
    }, [isLoaded, user]);

    const refreshTeams = useCallback(async () => {
        await mutate();
    }, [mutate]);

    const loading = !isLoaded || isLoading;

    // Memoize context value to prevent unnecessary re-renders of child components
    const contextValue = useMemo(() => ({
        teams,
        selectedTeam,
        setSelectedTeam,
        isLoading: loading,
        refreshTeams
    }), [teams, selectedTeam, loading, refreshTeams]);

    return (
        <TeamContext.Provider value={contextValue}>
            {children}
        </TeamContext.Provider>
    );
}

export function useTeam() {
    const context = useContext(TeamContext);
    if (context === undefined) {
        throw new Error("useTeam must be used within a TeamProvider");
    }
    return context;
}
