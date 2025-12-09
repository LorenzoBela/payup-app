"use server";

import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function syncUserToSupabase() {
    try {
        const user = await currentUser();

        if (!user) {
            return { error: "Not authenticated" };
        }

        const { data: existingUser } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("id", user.id)
            .single();

        if (!existingUser) {
            const email = user.emailAddresses.find(
                (email) => email.id === user.primaryEmailAddressId
            )?.emailAddress;

            const { error } = await supabaseAdmin.from("users").insert({
                id: user.id,
                name: user.fullName || user.username || "Unknown", // Fallback for name
                email: email || "",
                updated_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
            } as any);

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
