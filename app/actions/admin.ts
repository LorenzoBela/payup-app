"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-utils";
import { Status, UserRole } from "@prisma/client";

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

