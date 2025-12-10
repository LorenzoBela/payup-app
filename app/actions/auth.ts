"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Syncs the current Clerk user to Supabase database.
 * SECURITY: This function NEVER modifies the 'role' field.
 * Role can only be changed directly in Supabase Dashboard.
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

        // Use Prisma upsert - bypasses RLS since Prisma uses direct connection
        // IMPORTANT: We explicitly DO NOT include 'role' in create/update
        // New users automatically get 'Client' role via database default
        // Role can ONLY be changed via Supabase Dashboard Editor
        await prisma.user.upsert({
            where: { id: user.id },
            update: {
                // Only update name and email - NEVER touch role
                name: user.fullName || user.username || "Unknown",
                email: email || "",
            },
            create: {
                id: user.id,
                name: user.fullName || user.username || "Unknown",
                email: email || "",
                // role is intentionally omitted - uses database default 'Client'
            },
        });

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
