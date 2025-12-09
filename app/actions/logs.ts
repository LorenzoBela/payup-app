"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function getTeamLogs(teamId: string) {
    try {
        const user = await currentUser();
        if (!user) return [];

        // Verify membership
        const membership = await prisma.teamMember.findUnique({
            where: {
                team_id_user_id: {
                    team_id: teamId,
                    user_id: user.id
                }
            }
        });
        if (!membership) return [];

        const logs = await prisma.activityLog.findMany({
            where: { team_id: teamId },
            include: { user: true },
            orderBy: { created_at: 'desc' }
        });

        return logs.map(log => ({
            id: log.id,
            action: log.action,
            details: log.details,
            created_at: log.created_at,
            user_name: log.user.name || "Unknown",
            user_email: log.user.email
        }));

    } catch (error) {
        console.error("Error fetching logs:", error);
        return [];
    }
}
