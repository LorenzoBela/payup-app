import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Configure connection pool settings for high concurrency
const createPrismaClient = () => {
    return new PrismaClient({
        // Minimal logging in production for performance
        log: process.env.NODE_ENV === "development" 
            ? ["warn", "error"] 
            : [],
        // Transaction settings for better performance
        transactionOptions: {
            maxWait: 5000,  // Max time to wait for transaction slot (ms)
            timeout: 10000, // Max transaction duration (ms)
        },
    });
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

// Graceful shutdown handling
if (typeof window === "undefined") {
    process.on("beforeExit", async () => {
        await prisma.$disconnect();
    });
}
