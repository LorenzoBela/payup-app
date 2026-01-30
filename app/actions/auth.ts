"use server";

import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Syncs the current Clerk user to Supabase database and syncs role to Clerk metadata.
 * SECURITY: This function NEVER modifies the 'role' field in the database.
 * Role can only be changed directly in Supabase Dashboard.
 * Role IS synced to Clerk's publicMetadata for fast access via session claims.
 */
export async function syncUserToSupabase() {
    try {
        const user = await currentUser();

        if (!user) {
            return { error: "Not authenticated" };
        }

        const email = user.emailAddresses.find(
            (email: { id: string; emailAddress: string }) => email.id === user.primaryEmailAddressId
        )?.emailAddress;

        // Build full name from firstName and lastName, falling back to fullName or "Unknown"
        const fullName = [user.firstName, user.lastName]
            .filter(Boolean)
            .join(" ")
            .trim() || user.fullName || "Unknown";

        // Use Prisma upsert - bypasses RLS since Prisma uses direct connection
        // IMPORTANT: We explicitly DO NOT include 'role' in create/update
        // New users automatically get 'Client' role via database default
        // Role can ONLY be changed via Supabase Dashboard Editor
        const dbUser = await prisma.user.upsert({
            where: { id: user.id },
            update: {
                // Only update name and email - NEVER touch role
                name: fullName,
                email: email || "",
            },
            create: {
                id: user.id,
                name: fullName,
                email: email || "",
                // role is intentionally omitted - uses database default 'Client'
            },
            select: { role: true }, // Get the role to sync to Clerk
        });

        // Sync role to Clerk's publicMetadata for fast access via sessionClaims
        // This eliminates the need for /api/user/role DB calls on every page load
        const currentRole = user.publicMetadata?.role as string | undefined;
        if (currentRole !== dbUser.role) {
            const client = await clerkClient();
            await client.users.updateUserMetadata(user.id, {
                publicMetadata: {
                    role: dbUser.role,
                },
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Internal error syncing user:", error);
        return { error: "Internal server error" };
    }
}

/**
 * Updates the user's GCash number.
 * SECURITY: Only updates gcash_number field - role cannot be modified.
 */
export async function updateGcashNumber(number: string) {
    try {
        const user = await currentUser();
        if (!user) {
            return { error: "Not authenticated" };
        }

        // Validate basic format (09xxxxxxxxx)
        const gcashRegex = /^09\d{9}$/;
        if (!gcashRegex.test(number)) {
            return { error: "Invalid GCash number format. Must start with 09 and be 11 digits." };
        }

        // Only update gcash_number - explicitly select the field to prevent any accidental role modification
        await prisma.user.update({
            where: { id: user.id },
            data: { gcash_number: number },
            select: { id: true, gcash_number: true }, // Only return safe fields
        });

        return { success: true };
    } catch (error) {
        console.error("Error updating GCash number:", error);
        return { error: "Failed to update GCash number" };
    }
}

export async function getGcashNumber() {
    try {
        const user = await currentUser();
        if (!user) {
            return { number: null };
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { gcash_number: true },
        });

        return { number: dbUser?.gcash_number || null };
    } catch (error) {
        console.error("Error fetching GCash number:", error);
        return { number: null };
    }
}

/**
 * Deletes the current user's account.
 * SECURITY: This performs a soft delete by setting deleted_at.
 * User must first leave/transfer all teams where they are the sole admin.
 */
export async function deleteAccount() {
    try {
        const user = await currentUser();
        if (!user) {
            return { error: "Not authenticated" };
        }

        // Check if user is sole admin of any team
        const teamMemberships = await prisma.teamMember.findMany({
            where: { user_id: user.id },
            include: {
                team: {
                    include: {
                        members: {
                            where: { role: "ADMIN" },
                            select: { user_id: true },
                        },
                    },
                },
            },
        });

        // Find teams where user is the only admin
        const teamsWithSoleAdmin = teamMemberships.filter(
            (m) => m.role === "ADMIN" && m.team.members.length === 1
        );

        if (teamsWithSoleAdmin.length > 0) {
            const teamNames = teamsWithSoleAdmin.map((t) => t.team.name).join(", ");
            return {
                error: `Cannot delete account: You are the only admin of: ${teamNames}. Please assign another admin or delete these teams first.`,
            };
        }

        // Remove from all teams first
        await prisma.teamMember.deleteMany({
            where: { user_id: user.id },
        });

        // Soft delete user account (set deleted_at)
        await prisma.user.update({
            where: { id: user.id },
            data: { deleted_at: new Date() },
        });

        return { success: true };
    } catch (error) {
        console.error("Error deleting account:", error);
        return { error: "Failed to delete account" };
    }
}

