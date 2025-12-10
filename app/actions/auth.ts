"use server";

import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Helper to get untyped client for operations where types are missing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any;

export async function syncUserToSupabase() {
    try {
        const user = await currentUser();

        if (!user) {
            return { error: "Not authenticated" };
        }

        const { data: existingUser } = await db
            .from("users")
            .select("id")
            .eq("id", user.id)
            .single();

        if (!existingUser) {
            const email = user.emailAddresses.find(
                (email: { id: string; emailAddress: string }) => email.id === user.primaryEmailAddressId
            )?.emailAddress;

            const { error } = await db.from("users").insert({
                id: user.id,
                name: user.fullName || user.username || "Unknown", // Fallback for name
                email: email || "",
                updated_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
            });

            if (error) {
                console.error("Error inserting user into Supabase:", error);
                return { error: error.message };
            }
        }

        return { success: true };
    } catch (error) {
        console.error("Internal error syncing user:", error);
        return { error: "Internal server error" };
    }
}
