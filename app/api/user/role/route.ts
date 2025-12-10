import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        return NextResponse.json({ 
            role: user?.role || "Client" 
        });
    } catch (error) {
        console.error("Error fetching user role:", error);
        return NextResponse.json({ 
            role: "Client" 
        });
    }
}

