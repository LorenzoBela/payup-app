import { createClient, RedisClientType } from "redis";

// Redis client singleton
let redis: RedisClientType | null = null;
let isConnecting = false;
let connectionPromise: Promise<void> | null = null;

// In-memory cache fallback (for when Redis is not available)
interface MemoryCacheEntry {
    value: string;
    expiresAt: number;
}
const memoryCache = new Map<string, MemoryCacheEntry>();

// Cleanup expired entries periodically (every 60 seconds)
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of memoryCache.entries()) {
            if (entry.expiresAt < now) {
                memoryCache.delete(key);
            }
        }
    }, 60000);
}

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
    paymentsData: (teamId: string, userId: string) => `payments:${teamId}:${userId}`,
    receiptsData: (teamId: string) => `receipts:${teamId}`,
    teamSettlements: (teamId: string) => `settlements:${teamId}`,
};

/**
 * Get cached value or execute fetcher and cache result
 * Falls back to in-memory cache if Redis is not configured or unavailable
 */
export async function cached<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 60
): Promise<T> {
    const client = await getRedisClient();

    // Try Redis first if available
    if (client) {
        try {
            // Try to get from Redis
            const cachedValue = await client.get(key);
            if (cachedValue !== null) {
                return JSON.parse(cachedValue) as T;
            }

            // Cache miss - fetch and store
            const data = await fetcher();

            // Store in Redis (non-blocking)
            client.setEx(key, ttlSeconds, JSON.stringify(data)).catch((err) => {
                console.warn("Redis write failed:", err);
            });

            return data;
        } catch (error) {
            console.warn("Redis error, falling back to memory cache:", error);
        }
    }

    // Fallback: In-memory cache (works without Redis)
    const now = Date.now();
    const memoryCacheEntry = memoryCache.get(key);
    
    if (memoryCacheEntry && memoryCacheEntry.expiresAt > now) {
        return JSON.parse(memoryCacheEntry.value) as T;
    }

    // Cache miss - fetch and store in memory
    const data = await fetcher();
    
    memoryCache.set(key, {
        value: JSON.stringify(data),
        expiresAt: now + (ttlSeconds * 1000)
    });

    return data;
}

/**
 * Invalidate cache keys (single or pattern-based)
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    // Always clear from memory cache
    for (const key of keys) {
        memoryCache.delete(key);
    }

    // Also clear from Redis if available
    const client = await getRedisClient();
    if (client) {
        try {
            await client.del(keys);
        } catch (error) {
            console.warn("Redis invalidation failed:", error);
        }
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
        cacheKeys.receiptsData(teamId),
        cacheKeys.teamSettlements(teamId),
    ];

    if (userId) {
        keysToInvalidate.push(
            cacheKeys.teamBalances(teamId, userId),
            cacheKeys.dashboardData(teamId, userId),
            cacheKeys.paymentsData(teamId, userId),
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
