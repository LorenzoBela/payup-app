"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { cached } from "@/lib/cache";

interface PaginationParams {
    cursor?: string;
    limit?: number;
}

// Cache key for first page of logs
const logsPageCacheKey = (teamId: string) => `logs:${teamId}:first`;

// Optimized with pagination support + caching for first page
export async function getTeamLogs(
    teamId: string,
    { cursor, limit = 30 }: PaginationParams = {}
) {
    try {
        const { userId } = await auth();
        if (!userId) return { logs: [], nextCursor: null };

        // Fetch function - the actual DB query
        const fetchLogs = async () => {
            // Single query with membership check built into the query
            const logs = await prisma.activityLog.findMany({
                where: {
                    team_id: teamId,
                    ...(cursor ? { id: { lt: cursor } } : {}),
                },
                select: {
                    id: true,
                    action: true,
                    details: true,
                    created_at: true,
                    user: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                    team: {
                        select: {
                            members: {
                                where: { user_id: userId },
                                select: { id: true },
                            },
                        },
                    },
                },
                orderBy: { created_at: 'desc' },
                take: limit + 1,
            });

            // If first log doesn't have membership, user isn't in team
            if (logs.length > 0 && logs[0].team.members.length === 0) {
                return { logs: [], nextCursor: null };
            }

            // If no logs but we need to verify membership
            if (logs.length === 0) {
                const membership = await prisma.teamMember.findUnique({
                    where: {
                        team_id_user_id: {
                            team_id: teamId,
                            user_id: userId,
                        },
                    },
                    select: { id: true },
                });
                if (!membership) return { logs: [], nextCursor: null };
            }

            // Check pagination
            const hasMore = logs.length > limit;
            const resultLogs = hasMore ? logs.slice(0, -1) : logs;
            const nextCursor = hasMore ? resultLogs[resultLogs.length - 1]?.id : null;

            return {
                logs: resultLogs.map(log => ({
                    id: log.id,
                    action: log.action,
                    details: log.details,
                    created_at: log.created_at,
                    user_name: log.user.name || "Former Member",
                    user_email: log.user.email,
                })),
                nextCursor,
            };
        };

        // Cache first page only (no cursor), subsequent pages are direct DB queries
        if (!cursor) {
            return await cached(logsPageCacheKey(teamId), fetchLogs, 30);
        }

        return await fetchLogs();
    } catch (error) {
        console.error("Error fetching logs:", error);
        return { logs: [], nextCursor: null };
    }
}
