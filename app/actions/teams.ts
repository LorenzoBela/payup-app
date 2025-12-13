"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { TeamRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { sendTeamInvite } from "@/lib/emails";
import { invalidateTeamCache } from "@/lib/cache";

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

        // Ensure user exists in database before creating team
        // This prevents foreign key constraint failures for new users
        const email = user.emailAddresses.find(
            (email: { id: string; emailAddress: string }) => email.id === user.primaryEmailAddressId
        )?.emailAddress;

        const fullName = [user.firstName, user.lastName]
            .filter(Boolean)
            .join(" ")
            .trim() || user.fullName || "Unknown";

        await prisma.user.upsert({
            where: { id: user.id },
            update: {
                name: fullName,
                email: email || "",
            },
            create: {
                id: user.id,
                name: fullName,
                email: email || "",
            },
        });

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

        // Ensure user exists in database before joining team
        // This prevents foreign key constraint failures for new users
        const email = user.emailAddresses.find(
            (email: { id: string; emailAddress: string }) => email.id === user.primaryEmailAddressId
        )?.emailAddress;

        const fullName = [user.firstName, user.lastName]
            .filter(Boolean)
            .join(" ")
            .trim() || user.fullName || "Unknown";

        await prisma.user.upsert({
            where: { id: user.id },
            update: {
                name: fullName,
                email: email || "",
            },
            create: {
                id: user.id,
                name: fullName,
                email: email || "",
            },
        });

        // Single query to find team, check membership, and get current member count
        const team = await prisma.team.findUnique({
            where: { code: code.toUpperCase() },
            include: {
                members: {
                    select: { id: true, user_id: true },
                },
            },
        });

        if (!team) {
            return { error: "Team not found" };
        }

        // Check if already a member
        if (team.members.some(m => m.user_id === user.id)) {
            return { error: "Already a member of this team" };
        }

        // Use transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
            // 1. Add the new member
            await tx.teamMember.create({
                data: {
                    team_id: team.id,
                    user_id: user.id,
                    role: TeamRole.MEMBER,
                },
            });

            // 2. Get the new member count (existing + 1)
            const newMemberCount = team.members.length + 1;

            // 3. Find all pending expenses for this team that need to be recalculated
            const pendingExpenses = await tx.expense.findMany({
                where: {
                    team_id: team.id,
                    deleted_at: null,
                    // Only consider expenses that still have pending settlements
                    settlements: {
                        some: {
                            status: "pending",
                            deleted_at: null,
                        },
                    },
                },
                include: {
                    settlements: {
                        where: { deleted_at: null },
                    },
                },
            });

            // 4. For each pending expense, recalculate and add settlement for new member
            for (const expense of pendingExpenses) {
                // Calculate new split amount based on new member count
                const newSplitAmount = expense.amount / newMemberCount;

                // Update existing pending settlements with new amount
                await tx.settlement.updateMany({
                    where: {
                        expense_id: expense.id,
                        status: "pending",
                        deleted_at: null,
                    },
                    data: {
                        amount_owed: newSplitAmount,
                    },
                });

                // Check if new member already has a settlement for this expense (shouldn't happen, but safety check)
                const existingSettlement = expense.settlements.find(s => s.owed_by === user.id);

                if (!existingSettlement) {
                    // Create new settlement for the joining member
                    await tx.settlement.create({
                        data: {
                            expense_id: expense.id,
                            owed_by: user.id,
                            amount_owed: newSplitAmount,
                            status: "pending",
                        },
                    });
                }
            }

            // 5. Log the activity
            await tx.activityLog.create({
                data: {
                    team_id: team.id,
                    user_id: user.id,
                    action: "JOINED_TEAM",
                    details: `Joined the team. Expense shares recalculated for ${pendingExpenses.length} pending expense(s).`,
                },
            });
        });

        // Invalidate cache for all team members so they see updated expense shares
        // Invalidate for the new member
        await invalidateTeamCache(team.id, user.id);
        // Invalidate for all existing members so they see the recalculated amounts
        for (const member of team.members) {
            await invalidateTeamCache(team.id, member.user_id);
        }

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

        // Use transaction to handle member removal and settlement recalculation
        await prisma.$transaction(async (tx) => {
            // 1. Get all team members before removal to know the current count
            const currentMembers = await tx.teamMember.findMany({
                where: { team_id: teamId },
                select: { user_id: true },
            });

            const currentMemberCount = currentMembers.length;
            const newMemberCount = currentMemberCount - 1;

            if (newMemberCount === 0) {
                throw new Error("Cannot remove the last member of the team");
            }

            // 2. Find all pending expenses for this team that need recalculation
            const pendingExpenses = await tx.expense.findMany({
                where: {
                    team_id: teamId,
                    deleted_at: null,
                    settlements: {
                        some: {
                            status: "pending",
                            deleted_at: null,
                        },
                    },
                },
                include: {
                    settlements: {
                        where: { deleted_at: null },
                    },
                },
            });

            // 3. For each pending expense, delete removed member's settlements and recalculate
            for (const expense of pendingExpenses) {
                // Delete all settlements for the removed member
                await tx.settlement.updateMany({
                    where: {
                        expense_id: expense.id,
                        owed_by: memberId,
                        deleted_at: null,
                    },
                    data: {
                        deleted_at: new Date(),
                    },
                });

                // Recalculate split amount based on new member count
                const newSplitAmount = expense.amount / newMemberCount;

                // Update remaining pending settlements with new amount
                await tx.settlement.updateMany({
                    where: {
                        expense_id: expense.id,
                        status: "pending",
                        deleted_at: null,
                        owed_by: { not: memberId }, // Only update remaining members
                    },
                    data: {
                        amount_owed: newSplitAmount,
                    },
                });
            }

            // 4. Remove the team member
            await tx.teamMember.delete({
                where: {
                    team_id_user_id: {
                        team_id: teamId,
                        user_id: memberId,
                    },
                },
            });

            // 5. Log the activity
            await tx.activityLog.create({
                data: {
                    team_id: teamId,
                    user_id: user.id,
                    action: "REMOVED_MEMBER",
                    details: `Removed member from team. Recalculated ${pendingExpenses.length} pending expense(s).`,
                },
            });
        });

        // Invalidate cache for all team members
        await invalidateTeamCache(teamId, user.id);

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error removing team member:", error);
        return { error: error instanceof Error ? error.message : "Failed to remove member" };
    }
}

export async function leaveTeam(teamId: string) {
    try {
        const user = await currentUser();
        if (!user) return { error: "Not authenticated" };

        // Find user's membership in this team
        const membership = await prisma.teamMember.findUnique({
            where: {
                team_id_user_id: {
                    team_id: teamId,
                    user_id: user.id,
                },
            },
        });

        if (!membership) {
            return { error: "You are not a member of this team" };
        }

        // If user is an admin, check if they're the only admin
        if (membership.role === TeamRole.ADMIN) {
            const adminCount = await prisma.teamMember.count({
                where: {
                    team_id: teamId,
                    role: TeamRole.ADMIN,
                },
            });

            if (adminCount <= 1) {
                return { error: "Cannot leave team: You are the only admin. Please assign another admin first or delete the team." };
            }
        }

        // Remove user from team
        await prisma.teamMember.delete({
            where: {
                team_id_user_id: {
                    team_id: teamId,
                    user_id: user.id,
                },
            },
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error leaving team:", error);
        return { error: "Failed to leave team" };
    }
}

export async function inviteMemberByEmail(teamId: string, email: string) {
    try {
        const user = await currentUser();
        if (!user) return { error: "Not authenticated" };

        const team = await prisma.team.findUnique({
            where: { id: teamId },
            select: { name: true, code: true }
        });

        if (!team) return { error: "Team not found" };

        // Verify sender is a member
        const membership = await prisma.teamMember.findUnique({
            where: {
                team_id_user_id: {
                    team_id: teamId,
                    user_id: user.id
                }
            }
        });

        if (!membership) return { error: "You must be a member to invite others" };

        // Send the invite
        const result = await sendTeamInvite(email, {
            inviterName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : "A friend",
            teamName: team.name,
            teamCode: team.code
        });

        if (!result.success) {
            console.error("Failed to send invite:", result.error);
            return { error: "Failed to send email invite" };
        }

        return { success: true };
    } catch (error) {
        console.error("Error inviting member:", error);
        return { error: "Failed to invite member" };
    }
}

export async function recalculateTeamExpenses(teamId: string) {
    try {
        const user = await currentUser();
        if (!user) return { error: "Not authenticated" };

        // Verify user is an admin of this team
        const membership = await prisma.teamMember.findUnique({
            where: {
                team_id_user_id: {
                    team_id: teamId,
                    user_id: user.id,
                },
            },
        });

        if (!membership || membership.role !== TeamRole.ADMIN) {
            return { error: "Unauthorized: Only admins can recalculate expenses" };
        }

        // Use transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get all current active team members
            const activeMembers = await tx.teamMember.findMany({
                where: { team_id: teamId },
                select: { user_id: true },
            });

            const activeMemberIds = new Set(activeMembers.map(m => m.user_id));
            const activeMemberCount = activeMembers.length;

            if (activeMemberCount === 0) {
                throw new Error("No active members in team");
            }

            // 2. Find all pending expenses for this team
            const pendingExpenses = await tx.expense.findMany({
                where: {
                    team_id: teamId,
                    deleted_at: null,
                    settlements: {
                        some: {
                            status: "pending",
                            deleted_at: null,
                        },
                    },
                },
                include: {
                    settlements: {
                        where: { deleted_at: null },
                    },
                },
            });

            let settlementsRemoved = 0;
            let settlementsUpdated = 0;
            let settlementsCreated = 0;

            // 3. For each pending expense, recalculate settlements
            for (const expense of pendingExpenses) {
                // Calculate new split amount - divide by ALL active members (including payer)
                // Each person's share = total / all members
                // The payer's share is already "paid" by them, so we only create settlements for others
                const membersWhoOwe = activeMembers.filter(m => m.user_id !== expense.paid_by);
                const newSplitAmount = activeMemberCount > 0
                    ? expense.amount / activeMemberCount
                    : 0;

                // Soft-delete settlements for users who are no longer active members
                for (const settlement of expense.settlements) {
                    if (!activeMemberIds.has(settlement.owed_by)) {
                        await tx.settlement.update({
                            where: { id: settlement.id },
                            data: { deleted_at: new Date() },
                        });
                        settlementsRemoved++;
                    }
                }

                // Update all pending settlements for active members with new amount
                const updateResult = await tx.settlement.updateMany({
                    where: {
                        expense_id: expense.id,
                        status: "pending",
                        deleted_at: null,
                        owed_by: { in: Array.from(activeMemberIds) },
                    },
                    data: {
                        amount_owed: newSplitAmount,
                    },
                });
                settlementsUpdated += updateResult.count;

                // Check for active members who don't have a settlement yet
                const existingSettlementUserIds = new Set(
                    expense.settlements
                        .filter(s => s.deleted_at === null)
                        .map(s => s.owed_by)
                );

                for (const member of membersWhoOwe) {
                    if (!existingSettlementUserIds.has(member.user_id)) {
                        await tx.settlement.create({
                            data: {
                                expense_id: expense.id,
                                owed_by: member.user_id,
                                amount_owed: newSplitAmount,
                                status: "pending",
                            },
                        });
                        settlementsCreated++;
                    }
                }
            }

            // 4. Log the activity
            await tx.activityLog.create({
                data: {
                    team_id: teamId,
                    user_id: user.id,
                    action: "RECALCULATED_EXPENSES",
                    details: `Recalculated ${pendingExpenses.length} expense(s). Removed ${settlementsRemoved} orphaned settlement(s), updated ${settlementsUpdated}, created ${settlementsCreated} new settlement(s).`,
                },
            });

            return {
                expensesProcessed: pendingExpenses.length,
                settlementsRemoved,
                settlementsUpdated,
                settlementsCreated,
            };
        });

        // Invalidate cache for all team members
        const allMembers = await prisma.teamMember.findMany({
            where: { team_id: teamId },
            select: { user_id: true },
        });

        for (const member of allMembers) {
            await invalidateTeamCache(teamId, member.user_id);
        }

        revalidatePath("/dashboard");

        return {
            success: true,
            ...result,
        };
    } catch (error) {
        console.error("Error recalculating expenses:", error);
        return { error: error instanceof Error ? error.message : "Failed to recalculate expenses" };
    }
}
