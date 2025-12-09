"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { TeamRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Generate a random 6-character alphanumeric code
function generateTeamCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export async function createTeam(name: string) {
    try {
        const user = await currentUser();
        if (!user) {
            return { error: "Not authenticated" };
        }

        let code = generateTeamCode();
        let isUnique = false;

        // Ensure code uniqueness
        while (!isUnique) {
            const existingTeam = await prisma.team.findUnique({
                where: { code },
            });
            if (!existingTeam) {
                isUnique = true;
            } else {
                code = generateTeamCode();
            }
        }

        const team = await prisma.team.create({
            data: {
                name,
                code,
                members: {
                    create: {
                        user_id: user.id,
                        role: TeamRole.ADMIN,
                    },
                },
            },
        });

        revalidatePath("/dashboard");
        return { success: true, team };
    } catch (error) {
        console.error("Error creating team:", error);
        return { error: "Failed to create team" };
    }
}

export async function joinTeam(code: string) {
    try {
        const user = await currentUser();
        if (!user) {
            return { error: "Not authenticated" };
        }

        const team = await prisma.team.findUnique({
            where: { code: code.toUpperCase() }, // Case insensitive matching usually good for codes
        });

        if (!team) {
            return { error: "Team not found" };
        }

        const existingMember = await prisma.teamMember.findUnique({
            where: {
                team_id_user_id: {
                    team_id: team.id,
                    user_id: user.id,
                },
            },
        });

        if (existingMember) {
            return { error: "Already a member of this team" };
        }

        await prisma.teamMember.create({
            data: {
                team_id: team.id,
                user_id: user.id,
                role: TeamRole.MEMBER,
            },
        });

        revalidatePath("/dashboard");
        return { success: true, team };
    } catch (error) {
        console.error("Error joining team:", error);
        return { error: "Failed to join team" };
    }
}

export async function getUserTeams() {
    try {
        const user = await currentUser();
        if (!user) {
            return [];
        }

        const members = await prisma.teamMember.findMany({
            where: { user_id: user.id },
            include: {
                team: {
                    include: {
                        _count: {
                            select: { members: true },
                        },
                    },
                },
            },
        });

        return members.map((member) => ({
            ...member.team,
            role: member.role,
            memberCount: member.team._count.members,
        }));
    } catch (error) {
        console.error("Error fetching user teams:", error);
        return [];
    }
}

export async function getTeamMembers(teamId: string) {
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

        const members = await prisma.teamMember.findMany({
            where: { team_id: teamId },
            include: {
                user: true
            },
            orderBy: { joined_at: 'desc' }
        });

        // Enrich with real user data if needed, but 'user' relation should work if User table is synced
        return members.map(m => ({
            id: m.user.id, // Return user ID as the member ID for display purposes
            name: m.user.name || "Unknown",
            email: m.user.email,
            role: m.role,
            joinedAt: m.joined_at
        }));

    } catch (error) {
        console.error("Error fetching team members", error);
        return [];
    }
}
