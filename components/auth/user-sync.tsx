"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { syncUserToSupabase } from "@/app/actions/auth";

export function UserSync() {
    const { user, isLoaded } = useUser();
    const hasSynced = useRef(false);

    useEffect(() => {
        // Only sync once per session to avoid duplicate calls
        if (isLoaded && user && !hasSynced.current) {
            hasSynced.current = true;
            // Sync user to database - this is the only essential operation
            // Teams are already fetched by TeamProvider, dashboard data by pages
            syncUserToSupabase().catch((err) =>
                console.error("Failed to sync user:", err)
            );
        }
    }, [user, isLoaded]);

    return null;
}
