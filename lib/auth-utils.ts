"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

/**
 * Fetches the role of a user by their ID.
 * Returns 'Client' as default if user not found.
 */
export async function getUserRole(userId: string): Promise<UserRole> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        return user?.role ?? UserRole.Client;
    } catch (error) {
        console.error("Error fetching user role:", error);
        return UserRole.Client;
    }
}

/**
 * Checks if a user has SuperAdmin role.
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
    const role = await getUserRole(userId);
    return role === UserRole.SuperAdmin;
}

/**
 * Gets the current authenticated user's role.
 * Returns null if not authenticated.
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
    try {
        const user = await currentUser();
        if (!user) return null;
        return await getUserRole(user.id);
    } catch (error) {
        console.error("Error getting current user role:", error);
        return null;
    }
}

/**
 * Checks if the current authenticated user is a SuperAdmin.
 */
export async function isCurrentUserSuperAdmin(): Promise<boolean> {
    try {
        const user = await currentUser();
        if (!user) return false;
        return await isSuperAdmin(user.id);
    } catch (error) {
        console.error("Error checking SuperAdmin status:", error);
        return false;
    }
}

/**
 * Server action guard that throws/redirects if user is not a SuperAdmin.
 * Use this at the beginning of admin-only server actions.
 * @throws Redirects to /dashboard if not authorized
 */
export async function requireSuperAdmin(): Promise<{ userId: string }> {
    const user = await currentUser();
    
    if (!user) {
        redirect("/signin");
    }

    const isAdmin = await isSuperAdmin(user.id);
    
    if (!isAdmin) {
        redirect("/dashboard");
    }

    return { userId: user.id };
}

/**
 * Non-redirecting version of requireSuperAdmin for API routes.
 * Returns an error response if not authorized.
 */
export async function checkSuperAdminAccess(): Promise<{ 
    authorized: boolean; 
    userId?: string; 
    error?: string 
}> {
    try {
        const user = await currentUser();
        
        if (!user) {
            return { authorized: false, error: "Not authenticated" };
        }

        const isAdmin = await isSuperAdmin(user.id);
        
        if (!isAdmin) {
            return { authorized: false, error: "Access denied: SuperAdmin privileges required" };
        }

        return { authorized: true, userId: user.id };
    } catch (error) {
        console.error("Error checking SuperAdmin access:", error);
        return { authorized: false, error: "Authorization check failed" };
    }
}

/**
 * Gets the current user with their role information.
 * Useful for components that need to display role-based UI.
 */
export async function getCurrentUserWithRole() {
    try {
        const user = await currentUser();
        if (!user) return null;

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { 
                id: true, 
                name: true, 
                email: true, 
                role: true,
                gcash_number: true,
            },
        });

        if (!dbUser) return null;

        return {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            gcash_number: dbUser.gcash_number,
            clerkUser: user,
        };
    } catch (error) {
        console.error("Error getting current user with role:", error);
        return null;
    }
}

