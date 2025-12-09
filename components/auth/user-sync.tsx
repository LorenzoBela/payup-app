"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { syncUserToSupabase } from "@/app/actions/auth";

export function UserSync() {
    const { user, isLoaded } = useUser();

    useEffect(() => {
        if (isLoaded && user) {
            syncUserToSupabase().catch((err) =>
                console.error("Failed to sync user:", err)
            );
        }
    }, [user, isLoaded]);

    return null;
}
