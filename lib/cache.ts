import { Redis } from "@upstash/redis";

// Initialize Redis client (will gracefully fail if not configured)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
    BALANCES: 30,       // Team balances - frequently updated
    STATS: 60,          // Expense stats - moderate updates
    MEMBERS: 120,       // Team members - rarely changes
    TEAMS: 180,         // User's teams list
} as const;

// Cache key generators
export const cacheKeys = {
    teamBalances: (teamId: string, userId: string) => `balance:${teamId}:${userId}`,
    expenseStats: (teamId: string) => `stats:${teamId}`,
    teamMembers: (teamId: string) => `members:${teamId}`,
    userTeams: (userId: string) => `teams:${userId}`,
    dashboardData: (teamId: string, userId: string) => `dashboard:${teamId}:${userId}`,
};

/**
 * Get cached value or execute fetcher and cache result
 * Falls back to direct fetch if Redis is not configured
 */
export async function cached<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 60
): Promise<T> {
    // If Redis is not configured, just run the fetcher
    if (!redis) {
        return fetcher();
    }

    try {
        // Try to get from cache
        const cached = await redis.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        // Cache miss - fetch and store
        const data = await fetcher();
        
        // Store in cache (non-blocking)
        redis.setex(key, ttlSeconds, data).catch((err) => {
            console.warn("Cache write failed:", err);
        });

        return data;
    } catch (error) {
        // On any cache error, fall back to direct fetch
        console.warn("Cache read failed, fetching directly:", error);
        return fetcher();
    }
}

/**
 * Invalidate cache keys (single or pattern-based)
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
    if (!redis || keys.length === 0) return;

    try {
        await redis.del(...keys);
    } catch (error) {
        console.warn("Cache invalidation failed:", error);
    }
}

/**
 * Invalidate all cache keys for a team (after mutations)
 */
export async function invalidateTeamCache(teamId: string, userId?: string): Promise<void> {
    if (!redis) return;

    const keysToInvalidate = [
        cacheKeys.expenseStats(teamId),
        cacheKeys.teamMembers(teamId),
    ];

    if (userId) {
        keysToInvalidate.push(
            cacheKeys.teamBalances(teamId, userId),
            cacheKeys.dashboardData(teamId, userId),
            cacheKeys.userTeams(userId)
        );
    }

    await invalidateCache(...keysToInvalidate);
}

/**
 * Check if Redis cache is available
 */
export function isCacheAvailable(): boolean {
    return redis !== null;
}

/**
 * Get cache stats (for debugging)
 */
export async function getCacheStats(): Promise<{ available: boolean; ping?: number }> {
    if (!redis) {
        return { available: false };
    }

    try {
        const start = Date.now();
        await redis.ping();
        return { available: true, ping: Date.now() - start };
    } catch {
        return { available: false };
    }
}

