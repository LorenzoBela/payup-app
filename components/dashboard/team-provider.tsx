"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getUserTeams } from "@/app/actions/teams";
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
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshTeams = useCallback(async () => {
        if (!user) return;
        try {
            // Don't set loading to true on refresh to avoid flicker if just updating data
            // Only initial load needs generic loading state
            const userTeams = await getUserTeams();
            setTeams(userTeams);

            if (userTeams.length > 0) {
                // If we have a selected team, try to keep it selected (update its data)
                // Otherwise select the first one
                if (selectedTeam) {
                    const current = userTeams.find((t: any) => t.id === selectedTeam.id);
                    setSelectedTeam(current || userTeams[0]);
                } else {
                    setSelectedTeam(userTeams[0]);
                }
            } else {
                setSelectedTeam(null);
            }
        } catch (error) {
            console.error("Failed to fetch teams", error);
            toast.error("Failed to load teams");
        } finally {
            setIsLoading(false);
        }
    }, [user, selectedTeam]);

    useEffect(() => {
        if (isLoaded && user) {
            refreshTeams();
        } else if (isLoaded && !user) {
            setIsLoading(false);
        }
    }, [isLoaded, user]);

    return (
        <TeamContext.Provider value={{ teams, selectedTeam, setSelectedTeam, isLoading, refreshTeams }}>
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
