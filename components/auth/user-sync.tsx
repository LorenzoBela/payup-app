"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { syncUserToSupabase } from "@/app/actions/auth";
import { getUserTeams } from "@/app/actions/teams";
import { prefetchDashboardData } from "@/lib/hooks/use-dashboard-data";

export function UserSync() {
    const { user, isLoaded } = useUser();

    useEffect(() => {
        if (isLoaded && user) {
            // Sync user to database
            syncUserToSupabase().catch((err) =>
                console.error("Failed to sync user:", err)
            );
            
            // Prefetch user's teams and dashboard data in background
            (async () => {
                try {
                    const teams = await getUserTeams();
                    if (teams && teams.length > 0) {
                        // Prefetch dashboard data for the first (selected) team
                        await prefetchDashboardData(teams[0].id);
                    }
                } catch (err) {
                    // Silent fail - prefetch is just an optimization
                    console.warn("Prefetch failed:", err);
                }
            })();
        }
    }, [user, isLoaded]);

    return null;
}
