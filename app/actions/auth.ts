"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

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
        await prisma.user.upsert({
            where: { id: user.id },
            update: {
                name: user.fullName || user.username || "Unknown",
                email: email || "",
            },
            create: {
                id: user.id,
                name: user.fullName || user.username || "Unknown",
                email: email || "",
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Internal error syncing user:", error);
        return { error: "Internal server error" };
    }
}
