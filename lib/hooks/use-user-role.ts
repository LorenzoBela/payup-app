"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

type UserRole = "Client" | "SuperAdmin";

interface UserRoleData {
    role: UserRole;
    isLoading: boolean;
    isSuperAdmin: boolean;
}

export function useUserRole(): UserRoleData {
    const { user, isLoaded } = useUser();
    const [role, setRole] = useState<UserRole>("Client");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchRole() {
            if (!isLoaded || !user) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch("/api/user/role");
                if (response.ok) {
                    const data = await response.json();
                    setRole(data.role || "Client");
                }
            } catch (error) {
                console.error("Error fetching user role:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchRole();
    }, [user, isLoaded]);

    return {
        role,
        isLoading,
        isSuperAdmin: role === "SuperAdmin",
    };
}

