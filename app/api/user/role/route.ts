import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const { userId, sessionClaims } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // First, try to get role from Clerk session claims (instant, no DB call)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const clerkRole = (sessionClaims as any)?.publicMetadata?.role as string | undefined;

        if (clerkRole) {
            return NextResponse.json({
                role: clerkRole,
                source: "session" // For debugging
            });
        }

        // Fallback: Fetch from DB if not in session claims (first login before sync)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        return NextResponse.json({
            role: user?.role || "Client",
            source: "database" // For debugging
        });
    } catch (error) {
        console.error("Error fetching user role:", error);
        return NextResponse.json({
            role: "Client"
        });
    }
}
