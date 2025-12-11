import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const start = performance.now();

    try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1`;
        const dbResponseTime = Math.round(performance.now() - start);

        return NextResponse.json({
            status: "healthy",
            timestamp: new Date().toISOString(),
            database: {
                status: "connected",
                responseTime: dbResponseTime,
            },
            api: {
                status: "healthy",
                responseTime: Math.round(performance.now() - start),
            },
        });
    } catch (error) {
        return NextResponse.json({
            status: "unhealthy",
            timestamp: new Date().toISOString(),
            database: {
                status: "disconnected",
                error: error instanceof Error ? error.message : "Unknown error",
            },
            api: {
                status: "degraded",
            },
        }, { status: 500 });
    }
}
