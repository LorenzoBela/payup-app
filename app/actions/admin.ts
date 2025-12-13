"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-utils";
import { Status, UserRole, TeamRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { invalidateTeamCache } from "@/lib/cache";

/**
 * Get system-wide statistics for the admin dashboard.
 * Requires SuperAdmin privileges.
 */
export async function getSystemStats() {
    await requireSuperAdmin();

    try {
        const [
            totalUsers,
            superAdminCount,
            totalTeams,
            totalExpenses,
            totalSettlements,
            pendingSettlements,
            expenseVolume,
        ] = await Promise.all([
            prisma.user.count({ where: { deleted_at: null } }),
            prisma.user.count({ where: { role: UserRole.SuperAdmin, deleted_at: null } }),
            prisma.team.count(),
            prisma.expense.count({ where: { deleted_at: null } }),
            prisma.settlement.count({ where: { deleted_at: null } }),
            prisma.settlement.count({ where: { status: Status.pending, deleted_at: null } }),
            prisma.expense.aggregate({
                where: { deleted_at: null },
                _sum: { amount: true },
            }),
        ]);

        return {
            totalUsers,
            superAdminCount,
            totalTeams,
            totalExpenses,
            totalSettlements,
            pendingSettlements,
            totalVolume: expenseVolume._sum.amount || 0,
        };
    } catch (error) {
        console.error("Error fetching system stats:", error);
        return {
            totalUsers: 0,
            superAdminCount: 0,
            totalTeams: 0,
            totalExpenses: 0,
            totalSettlements: 0,
            pendingSettlements: 0,
            totalVolume: 0,
        };
    }
}

/**
 * Get all users in the system with their roles.
 * Requires SuperAdmin privileges.
 * Note: Role is READ-ONLY in the application - changes only via Supabase Dashboard.
 */
export async function getAllUsers(options?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
}) {
    await requireSuperAdmin();

    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    try {
        const where = {
            deleted_at: null,
            ...(options?.search && {
                OR: [
                    { name: { contains: options.search, mode: 'insensitive' as const } },
                    { email: { contains: options.search, mode: 'insensitive' as const } },
                ],
            }),
            ...(options?.role && { role: options.role }),
        };

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    gcash_number: true,
                    created_at: true,
                    _count: {
                        select: { teams: true },
                    },
                },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        return {
            users: users.map(u => ({
                ...u,
                teamCount: u._count.teams,
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    } catch (error) {
        console.error("Error fetching all users:", error);
        return { users: [], total: 0, page: 1, totalPages: 0 };
    }
}

/**
 * Get all teams in the system with member counts.
 * Requires SuperAdmin privileges.
 */
export async function getAllTeams(options?: {
    page?: number;
    limit?: number;
    search?: string;
}) {
    await requireSuperAdmin();

    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    try {
        const where = {
            ...(options?.search && {
                OR: [
                    { name: { contains: options.search, mode: 'insensitive' as const } },
                    { code: { contains: options.search, mode: 'insensitive' as const } },
                ],
            }),
        };

        const [teams, total] = await Promise.all([
            prisma.team.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    code: true,
                    created_at: true,
                    _count: {
                        select: {
                            members: true,
                            expenses: true,
                        },
                    },
                },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit,
            }),
            prisma.team.count({ where }),
        ]);

        return {
            teams: teams.map(t => ({
                ...t,
                memberCount: t._count.members,
                expenseCount: t._count.expenses,
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    } catch (error) {
        console.error("Error fetching all teams:", error);
        return { teams: [], total: 0, page: 1, totalPages: 0 };
    }
}

/**
 * Get all transactions (expenses) across the entire system.
 * Requires SuperAdmin privileges.
 */
export async function getAllTransactions(options?: {
    page?: number;
    limit?: number;
    teamId?: string;
    status?: Status;
}) {
    await requireSuperAdmin();

    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    try {
        const expenseWhere = {
            deleted_at: null,
            ...(options?.teamId && { team_id: options.teamId }),
        };

        const [expenses, total] = await Promise.all([
            prisma.expense.findMany({
                where: expenseWhere,
                select: {
                    id: true,
                    amount: true,
                    description: true,
                    category: true,
                    currency: true,
                    created_at: true,
                    paid_by: true,
                    team_id: true,
                    team: {
                        select: { name: true, code: true },
                    },
                    settlements: {
                        where: { deleted_at: null },
                        select: {
                            id: true,
                            amount_owed: true,
                            status: true,
                            owed_by: true,
                        },
                    },
                },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit,
            }),
            prisma.expense.count({ where: expenseWhere }),
        ]);

        // Get user names for payers
        const userIds = [...new Set(expenses.map(e => e.paid_by))];
        const users = userIds.length > 0
            ? await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, name: true },
            })
            : [];
        const userMap = new Map(users.map(u => [u.id, u.name]));

        return {
            transactions: expenses.map(e => ({
                ...e,
                paidByName: userMap.get(e.paid_by) || "Unknown",
                teamName: e.team?.name || "No Team",
                settlementCount: e.settlements.length,
                pendingCount: e.settlements.filter(s => s.status === Status.pending).length,
                paidCount: e.settlements.filter(s => s.status === Status.paid).length,
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    } catch (error) {
        console.error("Error fetching all transactions:", error);
        return { transactions: [], total: 0, page: 1, totalPages: 0 };
    }
}

/**
 * Get all activity logs across the entire system.
 * Requires SuperAdmin privileges.
 */
export async function getAllActivityLogs(options?: {
    page?: number;
    limit?: number;
    teamId?: string;
    userId?: string;
}) {
    await requireSuperAdmin();

    const page = options?.page || 1;
    const limit = options?.limit || 30;
    const skip = (page - 1) * limit;

    try {
        const where = {
            ...(options?.teamId && { team_id: options.teamId }),
            ...(options?.userId && { user_id: options.userId }),
        };

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                select: {
                    id: true,
                    action: true,
                    details: true,
                    created_at: true,
                    team: {
                        select: { name: true, code: true },
                    },
                    user: {
                        select: { name: true, email: true },
                    },
                },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit,
            }),
            prisma.activityLog.count({ where }),
        ]);

        return {
            logs: logs.map(log => ({
                id: log.id,
                action: log.action,
                details: log.details,
                createdAt: log.created_at,
                teamName: log.team.name,
                teamCode: log.team.code,
                userName: log.user.name,
                userEmail: log.user.email,
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    } catch (error) {
        console.error("Error fetching all activity logs:", error);
        return { logs: [], total: 0, page: 1, totalPages: 0 };
    }
}

/**
 * Get recent activity for the admin dashboard overview.
 * Requires SuperAdmin privileges.
 */
export async function getRecentActivity(limit: number = 10) {
    await requireSuperAdmin();

    try {
        const logs = await prisma.activityLog.findMany({
            select: {
                id: true,
                action: true,
                details: true,
                created_at: true,
                team: {
                    select: { name: true },
                },
                user: {
                    select: { name: true },
                },
            },
            orderBy: { created_at: 'desc' },
            take: limit,
        });

        return logs.map(log => ({
            id: log.id,
            action: log.action,
            details: log.details,
            createdAt: log.created_at,
            teamName: log.team.name,
            userName: log.user.name,
        }));
    } catch (error) {
        console.error("Error fetching recent activity:", error);
        return [];
    }
}

/**
 * Get detailed information about a specific user.
 * Requires SuperAdmin privileges.
 * Note: Role is READ-ONLY - cannot be modified via this action.
 */
export async function getUserDetails(userId: string) {
    await requireSuperAdmin();

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                gcash_number: true,
                created_at: true,
                updated_at: true,
                teams: {
                    select: {
                        role: true,
                        joined_at: true,
                        team: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                    },
                },
                activities: {
                    select: {
                        id: true,
                        action: true,
                        details: true,
                        created_at: true,
                        team: {
                            select: { name: true },
                        },
                    },
                    orderBy: { created_at: 'desc' },
                    take: 20,
                },
            },
        });

        if (!user) return null;

        return {
            ...user,
            teams: user.teams.map(t => ({
                teamId: t.team.id,
                teamName: t.team.name,
                teamCode: t.team.code,
                role: t.role,
                joinedAt: t.joined_at,
            })),
            recentActivity: user.activities.map(a => ({
                id: a.id,
                action: a.action,
                details: a.details,
                createdAt: a.created_at,
                teamName: a.team.name,
            })),
        };
    } catch (error) {
        console.error("Error fetching user details:", error);
        return null;
    }
}

/**
 * Get detailed information about a specific team.
 * Requires SuperAdmin privileges.
 */
export async function getTeamDetails(teamId: string) {
    await requireSuperAdmin();

    try {
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            select: {
                id: true,
                name: true,
                code: true,
                created_at: true,
                members: {
                    select: {
                        role: true,
                        joined_at: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                            },
                        },
                    },
                },
                expenses: {
                    where: { deleted_at: null },
                    select: {
                        id: true,
                        amount: true,
                        description: true,
                        category: true,
                        created_at: true,
                    },
                    orderBy: { created_at: 'desc' },
                    take: 20,
                },
                _count: {
                    select: {
                        members: true,
                        expenses: true,
                        activities: true,
                    },
                },
            },
        });

        if (!team) return null;

        // Calculate team totals
        const expenseTotal = await prisma.expense.aggregate({
            where: { team_id: teamId, deleted_at: null },
            _sum: { amount: true },
        });

        return {
            ...team,
            memberCount: team._count.members,
            expenseCount: team._count.expenses,
            activityCount: team._count.activities,
            totalExpenseVolume: expenseTotal._sum.amount || 0,
            members: team.members.map(m => ({
                userId: m.user.id,
                userName: m.user.name,
                userEmail: m.user.email,
                userRole: m.user.role,
                teamRole: m.role,
                joinedAt: m.joined_at,
            })),
            recentExpenses: team.expenses,
        };
    } catch (error) {
        console.error("Error fetching team details:", error);
        return null;
    }
}

/**
 * Soft delete a user (set deleted_at timestamp).
 * Requires SuperAdmin privileges.
 */
export async function softDeleteUser(userId: string) {
    await requireSuperAdmin();

    try {
        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, role: true, deleted_at: true },
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        if (user.deleted_at) {
            return { success: false, error: "User already deleted" };
        }

        // Prevent deleting SuperAdmins through this interface
        if (user.role === UserRole.SuperAdmin) {
            return { success: false, error: "Cannot delete SuperAdmin users through this interface" };
        }

        await prisma.user.update({
            where: { id: userId },
            data: { deleted_at: new Date() },
        });

        return { success: true, message: `User "${user.name}" has been deleted` };
    } catch (error) {
        console.error("Error deleting user:", error);
        return { success: false, error: "Failed to delete user" };
    }
}

/**
 * Remove a user from a specific team.
 * Requires SuperAdmin privileges.
 */
export async function removeUserFromTeam(userId: string, teamId: string) {
    await requireSuperAdmin();

    try {
        const membership = await prisma.teamMember.findFirst({
            where: { user_id: userId, team_id: teamId },
            include: {
                user: { select: { name: true } },
                team: { select: { name: true } },
            },
        });

        if (!membership) {
            return { success: false, error: "User is not a member of this team" };
        }

        await prisma.teamMember.delete({
            where: { id: membership.id },
        });

        return {
            success: true,
            message: `"${membership.user.name}" removed from "${membership.team.name}"`
        };
    } catch (error) {
        console.error("Error removing user from team:", error);
        return { success: false, error: "Failed to remove user from team" };
    }
}

/**
 * Soft delete a team and all its related data.
 * Requires SuperAdmin privileges.
 * Note: This will cascade delete team members and activity logs due to onDelete: Cascade.
 * Expenses are soft-deleted.
 */
export async function softDeleteTeam(teamId: string) {
    await requireSuperAdmin();

    try {
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            select: { id: true, name: true, _count: { select: { members: true, expenses: true } } },
        });

        if (!team) {
            return { success: false, error: "Team not found" };
        }

        // Soft delete all team expenses
        await prisma.expense.updateMany({
            where: { team_id: teamId, deleted_at: null },
            data: { deleted_at: new Date() },
        });

        // Soft delete all settlements for team expenses
        await prisma.settlement.updateMany({
            where: {
                expense: { team_id: teamId },
                deleted_at: null,
            },
            data: { deleted_at: new Date() },
        });

        // Delete team (cascades to team members and activity logs)
        await prisma.team.delete({
            where: { id: teamId },
        });

        return {
            success: true,
            message: `Team "${team.name}" and all related data have been deleted`
        };
    } catch (error) {
        console.error("Error deleting team:", error);
        return { success: false, error: "Failed to delete team" };
    }
}

/**
 * Get advanced statistics with growth metrics.
 * Requires SuperAdmin privileges.
 */
export async function getAdvancedStats() {
    await requireSuperAdmin();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    try {
        const [
            // Current counts
            totalUsers,
            totalTeams,
            totalExpenses,
            pendingSettlements,
            unconfirmedSettlements,
            paidSettlements,

            // This week's data
            usersThisWeek,
            teamsThisWeek,
            expensesThisWeek,
            settlementsThisWeek,

            // Last week's data (for comparison)
            usersLastWeek,
            teamsLastWeek,
            expensesLastWeek,
            settlementsLastWeek,

            // Expense volumes
            volumeThisWeek,
            volumeLastWeek,
            volumeThisMonth,

            // Today's data
            expensesToday,
            settlementsToday,
        ] = await Promise.all([
            // Current counts
            prisma.user.count({ where: { deleted_at: null } }),
            prisma.team.count(),
            prisma.expense.count({ where: { deleted_at: null } }),
            prisma.settlement.count({ where: { status: Status.pending, deleted_at: null } }),
            prisma.settlement.count({ where: { status: Status.unconfirmed, deleted_at: null } }),
            prisma.settlement.count({ where: { status: Status.paid, deleted_at: null } }),

            // This week
            prisma.user.count({ where: { created_at: { gte: weekAgo }, deleted_at: null } }),
            prisma.team.count({ where: { created_at: { gte: weekAgo } } }),
            prisma.expense.count({ where: { created_at: { gte: weekAgo }, deleted_at: null } }),
            prisma.settlement.count({ where: { created_at: { gte: weekAgo }, deleted_at: null } }),

            // Last week
            prisma.user.count({ where: { created_at: { gte: twoWeeksAgo, lt: weekAgo }, deleted_at: null } }),
            prisma.team.count({ where: { created_at: { gte: twoWeeksAgo, lt: weekAgo } } }),
            prisma.expense.count({ where: { created_at: { gte: twoWeeksAgo, lt: weekAgo }, deleted_at: null } }),
            prisma.settlement.count({ where: { created_at: { gte: twoWeeksAgo, lt: weekAgo }, deleted_at: null } }),

            // Volumes
            prisma.expense.aggregate({ where: { created_at: { gte: weekAgo }, deleted_at: null }, _sum: { amount: true } }),
            prisma.expense.aggregate({ where: { created_at: { gte: twoWeeksAgo, lt: weekAgo }, deleted_at: null }, _sum: { amount: true } }),
            prisma.expense.aggregate({ where: { created_at: { gte: monthAgo }, deleted_at: null }, _sum: { amount: true } }),

            // Today
            prisma.expense.count({ where: { created_at: { gte: today }, deleted_at: null } }),
            prisma.settlement.count({ where: { created_at: { gte: today }, deleted_at: null } }),
        ]);

        const calcGrowth = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        return {
            // Totals
            totalUsers,
            totalTeams,
            totalExpenses,

            // Settlement status breakdown
            pendingSettlements,
            unconfirmedSettlements,
            paidSettlements,
            totalSettlements: pendingSettlements + unconfirmedSettlements + paidSettlements,

            // Weekly growth
            usersThisWeek,
            teamsThisWeek,
            expensesThisWeek,
            settlementsThisWeek,

            userGrowth: calcGrowth(usersThisWeek, usersLastWeek),
            teamGrowth: calcGrowth(teamsThisWeek, teamsLastWeek),
            expenseGrowth: calcGrowth(expensesThisWeek, expensesLastWeek),
            settlementGrowth: calcGrowth(settlementsThisWeek, settlementsLastWeek),

            // Volume
            volumeThisWeek: volumeThisWeek._sum.amount || 0,
            volumeLastWeek: volumeLastWeek._sum.amount || 0,
            volumeThisMonth: volumeThisMonth._sum.amount || 0,
            volumeGrowth: calcGrowth(volumeThisWeek._sum.amount || 0, volumeLastWeek._sum.amount || 0),

            // Today's activity
            expensesToday,
            settlementsToday,
        };
    } catch (error) {
        console.error("Error fetching advanced stats:", error);
        return null;
    }
}

/**
 * Get expense analytics with date range filtering.
 * Requires SuperAdmin privileges.
 */
export async function getExpenseAnalytics(options?: {
    startDate?: Date;
    endDate?: Date;
    days?: number;
}) {
    await requireSuperAdmin();

    const now = new Date();
    const days = options?.days || 30;
    const endDate = options?.endDate || now;
    const startDate = options?.startDate || new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    try {
        // Get expenses in date range
        const expenses = await prisma.expense.findMany({
            where: {
                deleted_at: null,
                created_at: { gte: startDate, lte: endDate },
            },
            select: {
                id: true,
                amount: true,
                category: true,
                created_at: true,
                team_id: true,
                team: { select: { name: true } },
            },
        });

        // Category breakdown
        const categoryBreakdown = expenses.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + e.amount;
            return acc;
        }, {} as Record<string, number>);

        // Daily trends
        const dailyTrends = expenses.reduce((acc, e) => {
            const dateKey = e.created_at.toISOString().split('T')[0];
            acc[dateKey] = (acc[dateKey] || 0) + e.amount;
            return acc;
        }, {} as Record<string, number>);

        // Top teams by volume
        const teamVolumes = expenses.reduce((acc, e) => {
            const teamName = e.team?.name || 'No Team';
            if (!acc[teamName]) {
                acc[teamName] = { name: teamName, amount: 0, count: 0 };
            }
            acc[teamName].amount += e.amount;
            acc[teamName].count += 1;
            return acc;
        }, {} as Record<string, { name: string; amount: number; count: number }>);

        const topTeams = Object.values(teamVolumes)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10);

        // Settlement metrics for expenses in range
        const expenseIds = expenses.map(e => e.id);
        const settlements = expenseIds.length > 0
            ? await prisma.settlement.findMany({
                where: {
                    expense_id: { in: expenseIds },
                    deleted_at: null,
                },
                select: { status: true, paid_at: true, created_at: true },
            })
            : [];

        const totalSettlements = settlements.length;
        const paidSettlements = settlements.filter(s => s.status === Status.paid).length;
        const settlementRate = totalSettlements > 0 ? Math.round((paidSettlements / totalSettlements) * 100) : 0;

        // Average time to settle (for paid settlements)
        const paidWithTime = settlements.filter(s => s.status === Status.paid && s.paid_at);
        const avgSettlementTime = paidWithTime.length > 0
            ? paidWithTime.reduce((sum, s) => {
                const diff = s.paid_at!.getTime() - s.created_at.getTime();
                return sum + diff;
            }, 0) / paidWithTime.length / (1000 * 60 * 60 * 24) // Convert to days
            : 0;

        return {
            summary: {
                totalExpenses: expenses.length,
                totalVolume: expenses.reduce((sum, e) => sum + e.amount, 0),
                avgExpenseAmount: expenses.length > 0
                    ? expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length
                    : 0,
                dateRange: { start: startDate, end: endDate },
            },
            categoryBreakdown: Object.entries(categoryBreakdown).map(([category, amount]) => ({
                category,
                amount,
                percentage: Math.round((amount / expenses.reduce((sum, e) => sum + e.amount, 0)) * 100) || 0,
            })).sort((a, b) => b.amount - a.amount),
            dailyTrends: Object.entries(dailyTrends)
                .map(([date, amount]) => ({ date, amount }))
                .sort((a, b) => a.date.localeCompare(b.date)),
            topTeams,
            settlementMetrics: {
                total: totalSettlements,
                paid: paidSettlements,
                pending: settlements.filter(s => s.status === Status.pending).length,
                unconfirmed: settlements.filter(s => s.status === Status.unconfirmed).length,
                settlementRate,
                avgDaysToSettle: Math.round(avgSettlementTime * 10) / 10,
            },
        };
    } catch (error) {
        console.error("Error fetching expense analytics:", error);
        return null;
    }
}

/**
 * Get real-time performance metrics for system monitoring.
 * Requires SuperAdmin privileges.
 */
export async function getPerformanceMetrics() {
    await requireSuperAdmin();

    const metrics: {
        database: {
            status: "connected" | "slow" | "disconnected";
            responseTime: number;
            queryCount: number;
            activeQueries: number;
        };
        api: {
            status: "healthy" | "degraded" | "down";
            serverTime: Date;
        };
        system: {
            totalUsers: number;
            totalTeams: number;
            totalExpenses: number;
            totalSettlements: number;
            pendingSettlements: number;
            unconfirmedSettlements: number;
            activitiesToday: number;
            expensesToday: number;
            settlementsToday: number;
        };
        recentActivity: {
            last5Minutes: number;
            last15Minutes: number;
            lastHour: number;
        };
    } = {
        database: {
            status: "disconnected",
            responseTime: 0,
            queryCount: 0,
            activeQueries: 0,
        },
        api: {
            status: "healthy",
            serverTime: new Date(),
        },
        system: {
            totalUsers: 0,
            totalTeams: 0,
            totalExpenses: 0,
            totalSettlements: 0,
            pendingSettlements: 0,
            unconfirmedSettlements: 0,
            activitiesToday: 0,
            expensesToday: 0,
            settlementsToday: 0,
        },
        recentActivity: {
            last5Minutes: 0,
            last15Minutes: 0,
            lastHour: 0,
        },
    };

    try {
        // Measure database response time with a simple query
        const dbStart = performance.now();
        await prisma.$queryRaw`SELECT 1`;
        const dbResponseTime = Math.round(performance.now() - dbStart);

        metrics.database.responseTime = dbResponseTime;
        metrics.database.status = dbResponseTime < 100 ? "connected" : dbResponseTime < 500 ? "slow" : "disconnected";

        // Get current timestamp references
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        // Execute all queries in parallel for speed
        const [
            totalUsers,
            totalTeams,
            totalExpenses,
            totalSettlements,
            pendingSettlements,
            unconfirmedSettlements,
            activitiesToday,
            expensesToday,
            settlementsToday,
            activityLast5Min,
            activityLast15Min,
            activityLastHour,
        ] = await Promise.all([
            prisma.user.count({ where: { deleted_at: null } }),
            prisma.team.count(),
            prisma.expense.count({ where: { deleted_at: null } }),
            prisma.settlement.count({ where: { deleted_at: null } }),
            prisma.settlement.count({ where: { status: Status.pending, deleted_at: null } }),
            prisma.settlement.count({ where: { status: Status.unconfirmed, deleted_at: null } }),
            prisma.activityLog.count({ where: { created_at: { gte: startOfToday } } }),
            prisma.expense.count({ where: { created_at: { gte: startOfToday }, deleted_at: null } }),
            prisma.settlement.count({ where: { created_at: { gte: startOfToday }, deleted_at: null } }),
            prisma.activityLog.count({ where: { created_at: { gte: fiveMinutesAgo } } }),
            prisma.activityLog.count({ where: { created_at: { gte: fifteenMinutesAgo } } }),
            prisma.activityLog.count({ where: { created_at: { gte: oneHourAgo } } }),
        ]);

        // Calculate query count (12 queries were just executed)
        metrics.database.queryCount = 12;

        metrics.system = {
            totalUsers,
            totalTeams,
            totalExpenses,
            totalSettlements,
            pendingSettlements,
            unconfirmedSettlements,
            activitiesToday,
            expensesToday,
            settlementsToday,
        };

        metrics.recentActivity = {
            last5Minutes: activityLast5Min,
            last15Minutes: activityLast15Min,
            lastHour: activityLastHour,
        };

        return metrics;
    } catch (error) {
        console.error("Error fetching performance metrics:", error);
        metrics.database.status = "disconnected";
        metrics.api.status = "down";
        return metrics;
    }
}

/**
 * Search for users that can be added to a team.
 * Returns users who are NOT already members of the specified team.
 * Requires SuperAdmin privileges.
 */
export async function searchUsersForTeam(teamId: string, query: string) {
    await requireSuperAdmin();

    if (!query || query.length < 2) {
        return { users: [] };
    }

    try {
        // Get current team members
        const teamMembers = await prisma.teamMember.findMany({
            where: { team_id: teamId },
            select: { user_id: true },
        });
        const memberIds = teamMembers.map(m => m.user_id);

        // Search for users not in the team
        const users = await prisma.user.findMany({
            where: {
                deleted_at: null,
                id: { notIn: memberIds },
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
            take: 10,
        });

        return { users };
    } catch (error) {
        console.error("Error searching users for team:", error);
        return { users: [], error: "Failed to search users" };
    }
}

/**
 * Add an existing user to a team (SuperAdmin only).
 * Recalculates pending expense shares just like joinTeam does.
 * Requires SuperAdmin privileges.
 */
export async function adminAddUserToTeam(
    teamId: string,
    userId: string,
    role: TeamRole = TeamRole.MEMBER
) {
    await requireSuperAdmin();

    try {
        // Get team with current members
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                members: {
                    select: { id: true, user_id: true },
                },
            },
        });

        if (!team) {
            return { success: false, error: "Team not found" };
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId, deleted_at: null },
            select: { id: true, name: true },
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        // Check if already a member
        if (team.members.some(m => m.user_id === userId)) {
            return { success: false, error: "User is already a member of this team" };
        }

        // Use transaction for atomicity (mirrors joinTeam logic)
        await prisma.$transaction(async (tx) => {
            // 1. Add the new member
            await tx.teamMember.create({
                data: {
                    team_id: team.id,
                    user_id: userId,
                    role: role,
                },
            });

            // 2. Get the new member count
            const newMemberCount = team.members.length + 1;

            // 3. Find all pending expenses for this team
            const pendingExpenses = await tx.expense.findMany({
                where: {
                    team_id: team.id,
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

            // 4. Recalculate and add settlement for new member
            for (const expense of pendingExpenses) {
                const newSplitAmount = expense.amount / newMemberCount;

                // Update existing pending settlements
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

                // Check if user already has a settlement
                const existingSettlement = expense.settlements.find(s => s.owed_by === userId);

                if (!existingSettlement) {
                    // Create settlement for the new member
                    await tx.settlement.create({
                        data: {
                            expense_id: expense.id,
                            owed_by: userId,
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
                    user_id: userId,
                    action: "ADDED_TO_TEAM",
                    details: `Added to team by admin. Expense shares recalculated for ${pendingExpenses.length} pending expense(s).`,
                },
            });
        });

        // Invalidate cache
        await invalidateTeamCache(team.id, userId);
        for (const member of team.members) {
            await invalidateTeamCache(team.id, member.user_id);
        }

        revalidatePath(`/admin/teams/${teamId}`);

        return {
            success: true,
            message: `"${user.name}" has been added to the team`,
        };
    } catch (error) {
        console.error("Error adding user to team:", error);
        return { success: false, error: "Failed to add user to team" };
    }
}
