import { createClient, RedisClientType } from "redis";

// Redis client singleton
let redis: RedisClientType | null = null;
let isConnecting = false;
let connectionPromise: Promise<void> | null = null;

// Initialize Redis client (will gracefully fail if not configured)
async function getRedisClient(): Promise<RedisClientType | null> {
    // Check if all required env vars are present
    const host = process.env.REDIS_HOST;
    const port = process.env.REDIS_PORT;
    const password = process.env.REDIS_PASSWORD;

    if (!host || !port || !password) {
        return null;
    }

    // Return existing connected client
    if (redis?.isOpen) {
        return redis;
    }

    // If already connecting, wait for that to complete
    if (isConnecting && connectionPromise) {
        await connectionPromise;
        return redis;
    }

    // Start new connection
    isConnecting = true;
    connectionPromise = (async () => {
        try {
            redis = createClient({
                username: "default",
                password: password,
                socket: {
                    host: host,
                    port: parseInt(port, 10),
                },
            });

            redis.on("error", (err) => console.warn("Redis Client Error:", err));

            await redis.connect();
        } catch (error) {
            console.warn("Redis connection failed:", error);
            redis = null;
        } finally {
            isConnecting = false;
        }
    })();

    await connectionPromise;
    return redis;
}

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
 * Falls back to direct fetch if Redis is not configured or unavailable
 */
export async function cached<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 60
): Promise<T> {
    const client = await getRedisClient();

    // If Redis is not available, just run the fetcher
    if (!client) {
        return fetcher();
    }

    try {
        // Try to get from cache
        const cachedValue = await client.get(key);
        if (cachedValue !== null) {
            return JSON.parse(cachedValue) as T;
        }

        // Cache miss - fetch and store
        const data = await fetcher();

        // Store in cache (non-blocking)
        client.setEx(key, ttlSeconds, JSON.stringify(data)).catch((err) => {
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
    const client = await getRedisClient();
    if (!client || keys.length === 0) return;

    try {
        await client.del(keys);
    } catch (error) {
        console.warn("Cache invalidation failed:", error);
    }
}

/**
 * Invalidate all cache keys for a team (after mutations)
 */
export async function invalidateTeamCache(teamId: string, userId?: string): Promise<void> {
    const client = await getRedisClient();
    if (!client) return;

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
export async function isCacheAvailable(): Promise<boolean> {
    const client = await getRedisClient();
    return client !== null && client.isOpen;
}

/**
 * Get cache stats (for debugging)
 */
export async function getCacheStats(): Promise<{ available: boolean; ping?: number }> {
    const client = await getRedisClient();
    if (!client) {
        return { available: false };
    }

    try {
        const start = Date.now();
        await client.ping();
        return { available: true, ping: Date.now() - start };
    } catch {
        return { available: false };
    }
}
