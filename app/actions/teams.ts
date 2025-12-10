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

        // Generate unique code with retry limit
        let code = generateTeamCode();
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
            const existingTeam = await prisma.team.findUnique({
                where: { code },
                select: { id: true },
            });
            if (!existingTeam) break;
            code = generateTeamCode();
            attempts++;
        }

        if (attempts >= maxAttempts) {
            return { error: "Failed to generate unique code, please try again" };
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

        // Single query to find team and check membership
        const team = await prisma.team.findUnique({
            where: { code: code.toUpperCase() },
            include: {
                members: {
                    where: { user_id: user.id },
                    select: { id: true },
                },
            },
        });

        if (!team) {
            return { error: "Team not found" };
        }

        if (team.members.length > 0) {
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
        return { success: true, team: { id: team.id, name: team.name, code: team.code } };
    } catch (error) {
        console.error("Error joining team:", error);
        return { error: "Failed to join team" };
    }
}

// Optimized: Single query with proper includes
export async function getUserTeams() {
    try {
        const user = await currentUser();
        if (!user) {
            return [];
        }

        const members = await prisma.teamMember.findMany({
            where: { user_id: user.id },
            select: {
                role: true,
                team: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        created_at: true,
                        _count: {
                            select: { members: true },
                        },
                    },
                },
            },
        });

        return members.map((member) => ({
            id: member.team.id,
            name: member.team.name,
            code: member.team.code,
            created_at: member.team.created_at,
            role: member.role,
            memberCount: member.team._count.members,
        }));
    } catch (error) {
        console.error("Error fetching user teams:", error);
        return [];
    }
}

// Optimized: Combined membership check with data fetch
export async function getTeamMembers(teamId: string) {
    try {
        const user = await currentUser();
        if (!user) return [];

        // Single query that also verifies membership
        const members = await prisma.teamMember.findMany({
            where: { team_id: teamId },
            select: {
                user_id: true,
                role: true,
                joined_at: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { joined_at: 'asc' },
        });

        // Check if current user is a member
        const isMember = members.some(m => m.user_id === user.id);
        if (!isMember) return [];

        return members.map(m => ({
            id: m.user.id,
            name: m.user.name || "Unknown",
            email: m.user.email,
            role: m.role,
            joinedAt: m.joined_at,
        }));
    } catch (error) {
        console.error("Error fetching team members", error);
        return [];
    }
}

export async function renameTeam(teamId: string, newName: string) {
    try {
        const user = await currentUser();
        if (!user) return { error: "Not authenticated" };

        const member = await prisma.teamMember.findUnique({
            where: {
                team_id_user_id: {
                    team_id: teamId,
                    user_id: user.id,
                },
            },
        });

        if (!member || member.role !== TeamRole.ADMIN) {
            return { error: "Unauthorized: Only admins can rename the team" };
        }

        const team = await prisma.team.update({
            where: { id: teamId },
            data: { name: newName },
        });

        revalidatePath("/dashboard");
        return { success: true, team };
    } catch (error) {
        console.error("Error renaming team:", error);
        return { error: "Failed to rename team" };
    }
}

export async function removeTeamMember(teamId: string, memberId: string) {
    try {
        const user = await currentUser();
        if (!user) return { error: "Not authenticated" };

        // Check if requester is admin
        const requester = await prisma.teamMember.findUnique({
            where: {
                team_id_user_id: {
                    team_id: teamId,
                    user_id: user.id,
                },
            },
        });

        if (!requester || requester.role !== TeamRole.ADMIN) {
            return { error: "Unauthorized: Only admins can remove members" };
        }

        // Prevent removing yourself
        if (memberId === user.id) {
            return { error: "Cannot remove yourself from the team" };
        }

        // Check if the member to be removed exists in the team
        // We find by user_id inside the team context. 
        // Note: memberId passed here should be the user_id of the member to remove.
        const memberToRemove = await prisma.teamMember.findUnique({
            where: {
                team_id_user_id: {
                    team_id: teamId,
                    user_id: memberId,
                },
            },
        });

        if (!memberToRemove) {
            return { error: "Member not found in this team" };
        }

        await prisma.teamMember.delete({
            where: {
                team_id_user_id: {
                    team_id: teamId,
                    user_id: memberId,
                },
            },
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error removing team member:", error);
        return { error: "Failed to remove member" };
    }
}
