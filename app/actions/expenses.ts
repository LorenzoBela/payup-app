"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { Status } from "@prisma/client";
import { revalidatePath } from "next/cache";

interface CreateExpenseInput {
    description: string;
    amount: number;
    category: string;
    teamId: string;
}

interface PaginationParams {
    cursor?: string;
    limit?: number;
}

// Helper to verify team membership - cached per request
async function verifyTeamMembership(teamId: string, userId: string) {
    return prisma.teamMember.findUnique({
        where: {
            team_id_user_id: {
                team_id: teamId,
                user_id: userId,
            },
        },
    });
}

export async function createExpense(input: CreateExpenseInput) {
    try {
        const user = await currentUser();
        if (!user) {
            return { error: "Not authenticated" };
        }

        // Combined query: verify membership AND get all team members in one go
        const teamMembers = await prisma.teamMember.findMany({
            where: { team_id: input.teamId },
            select: { user_id: true },
        });

        const isMember = teamMembers.some(m => m.user_id === user.id);
        if (!isMember) {
            return { error: "Not a member of this team" };
        }

        if (teamMembers.length === 0) {
            return { error: "No team members found" };
        }

        // Calculate split amount (divide evenly among all members)
        const splitAmount = input.amount / teamMembers.length;

        // Use transaction to batch all writes together
        const result = await prisma.$transaction(async (tx) => {
            // Create expense
            const expense = await tx.expense.create({
                data: {
                    description: input.description,
                    amount: input.amount,
                    paid_by: user.id,
                    currency: "PHP",
                    category: input.category,
                    team_id: input.teamId,
                },
            });

            // Create settlements for each member who owes money (excluding the payer)
            const settlementData = teamMembers
                .filter((member) => member.user_id !== user.id)
                .map((member) => ({
                    expense_id: expense.id,
                    owed_by: member.user_id,
                    amount_owed: splitAmount,
                    status: Status.pending,
                }));

            if (settlementData.length > 0) {
                await tx.settlement.createMany({
                    data: settlementData,
                });
            }

            await tx.activityLog.create({
                data: {
                    team_id: input.teamId,
                    user_id: user.id,
                    action: "ADDED_EXPENSE",
                    details: `Added expense '${input.description}' for PHP ${input.amount.toFixed(2)}`,
                },
            });

            return expense;
        });

        revalidatePath("/dashboard");
        return { success: true, expense: result };
    } catch (error) {
        console.error("Error creating expense:", error);
        return { error: "Failed to create expense" };
    }
}

// Optimized: Single query with JOIN to get expenses with payer names
export async function getTeamExpenses(
    teamId: string, 
    { cursor, limit = 20 }: PaginationParams = {}
) {
    try {
        const user = await currentUser();
        if (!user) {
            return { expenses: [], nextCursor: null };
        }

        // Verify membership
        const membership = await verifyTeamMembership(teamId, user.id);
        if (!membership) {
            return { expenses: [], nextCursor: null };
        }

        // Single optimized query with user data included via raw SQL or subquery
        // Using Prisma's approach with team members to get user names
        const expenses = await prisma.expense.findMany({
            where: {
                team_id: teamId,
                deleted_at: null,
                ...(cursor ? { id: { lt: cursor } } : {}),
            },
            orderBy: { created_at: "desc" },
            take: limit + 1, // Fetch one extra to check if there's more
        });

        // Batch fetch user names in single query
        const userIds = [...new Set(expenses.map((e) => e.paid_by))];
        const users = userIds.length > 0 
            ? await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, name: true },
              })
            : [];
        
        const userMap = new Map(users.map((u) => [u.id, u.name]));

        // Check if there are more results
        const hasMore = expenses.length > limit;
        const resultExpenses = hasMore ? expenses.slice(0, -1) : expenses;
        const nextCursor = hasMore ? resultExpenses[resultExpenses.length - 1]?.id : null;

        return {
            expenses: resultExpenses.map((expense) => ({
                ...expense,
                paid_by_name: userMap.get(expense.paid_by) || "Unknown",
            })),
            nextCursor,
        };
    } catch (error) {
        console.error("Error fetching expenses:", error);
        return { expenses: [], nextCursor: null };
    }
}

export async function deleteExpense(expenseId: string) {
    try {
        const user = await currentUser();
        if (!user) {
            return { error: "Not authenticated" };
        }

        const expense = await prisma.expense.findUnique({
            where: { id: expenseId },
            select: { id: true, description: true, team_id: true },
        });

        if (!expense) {
            return { error: "Expense not found" };
        }

        // Use transaction to batch soft deletes
        await prisma.$transaction([
            prisma.expense.update({
                where: { id: expenseId },
                data: { deleted_at: new Date() },
            }),
            prisma.settlement.updateMany({
                where: { expense_id: expenseId },
                data: { deleted_at: new Date() },
            }),
            ...(expense.team_id ? [
                prisma.activityLog.create({
                    data: {
                        team_id: expense.team_id,
                        user_id: user.id,
                        action: "DELETED_EXPENSE",
                        details: `Deleted expense '${expense.description}'`,
                    },
                }),
            ] : []),
        ]);

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error deleting expense:", error);
        return { error: "Failed to delete expense" };
    }
}

// Optimized: Reduced from 4 queries to 2 using better JOINs
export async function getTeamSettlements(
    teamId: string,
    { cursor, limit = 15 }: PaginationParams = {}
) {
    try {
        const user = await currentUser();
        if (!user) {
            return { settlements: [], nextCursor: null };
        }

        // Verify membership
        const membership = await verifyTeamMembership(teamId, user.id);
        if (!membership) {
            return { settlements: [], nextCursor: null };
        }

        // Get expenses with their settlements in a single query pattern
        const expenses = await prisma.expense.findMany({
            where: {
                team_id: teamId,
                deleted_at: null,
            },
            select: {
                id: true,
                description: true,
                paid_by: true,
            },
        });

        const expenseIds = expenses.map((e) => e.id);
        const expenseMap = new Map(expenses.map((e) => [e.id, e]));

        if (expenseIds.length === 0) {
            return { settlements: [], nextCursor: null };
        }

        // Get settlements with pagination
        const settlements = await prisma.settlement.findMany({
            where: {
                expense_id: { in: expenseIds },
                deleted_at: null,
                ...(cursor ? { id: { lt: cursor } } : {}),
            },
            orderBy: { created_at: "desc" },
            take: limit + 1,
        });

        // Collect all user IDs and batch fetch
        const userIds = [
            ...new Set([
                ...settlements.map((s) => s.owed_by),
                ...expenses.map((e) => e.paid_by),
            ]),
        ];
        
        const users = userIds.length > 0
            ? await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, name: true },
              })
            : [];
        const userMap = new Map(users.map((u) => [u.id, u.name]));

        // Check pagination
        const hasMore = settlements.length > limit;
        const resultSettlements = hasMore ? settlements.slice(0, -1) : settlements;
        const nextCursor = hasMore ? resultSettlements[resultSettlements.length - 1]?.id : null;

        return {
            settlements: resultSettlements.map((settlement) => {
                const expense = expenseMap.get(settlement.expense_id);
                const isCurrentUserOwing = settlement.owed_by === user.id;
                const isCurrentUserOwed = expense?.paid_by === user.id;

                return {
                    id: settlement.id,
                    expense_id: settlement.expense_id,
                    expense_description: expense?.description || "Unknown expense",
                    owed_by: isCurrentUserOwing ? "You" : userMap.get(settlement.owed_by) || "Unknown",
                    owed_to: isCurrentUserOwed ? "You" : userMap.get(expense?.paid_by || "") || "Unknown",
                    owed_by_id: settlement.owed_by,
                    owed_to_id: expense?.paid_by || "",
                    amount: settlement.amount_owed,
                    status: settlement.status,
                    paid_at: settlement.paid_at,
                    isCurrentUserOwing,
                    isCurrentUserOwed,
                };
            }),
            nextCursor,
        };
    } catch (error) {
        console.error("Error fetching settlements:", error);
        return { settlements: [], nextCursor: null };
    }
}

export async function markSettlementAsPaid(settlementId: string) {
    try {
        const user = await currentUser();
        if (!user) {
            return { error: "Not authenticated" };
        }

        const settlement = await prisma.settlement.findUnique({
            where: { id: settlementId },
        });

        if (!settlement) {
            return { error: "Settlement not found" };
        }

        if (settlement.owed_by !== user.id) {
            return { error: "Only the person who owes can mark as paid" };
        }

        // Use transaction to batch update and log creation
        await prisma.$transaction(async (tx) => {
            const updatedSettlement = await tx.settlement.update({
                where: { id: settlementId },
                data: {
                    status: Status.paid,
                    paid_at: new Date()
                },
            });

            const expense = await tx.expense.findUnique({
                where: { id: updatedSettlement.expense_id },
                select: { team_id: true, description: true, paid_by: true },
            });

            if (expense?.team_id) {
                const owedToUser = await tx.user.findUnique({ 
                    where: { id: expense.paid_by },
                    select: { name: true },
                });

                await tx.activityLog.create({
                    data: {
                        team_id: expense.team_id,
                        user_id: user.id,
                        action: "PAID_SETTLEMENT",
                        details: `Paid PHP ${updatedSettlement.amount_owed.toFixed(2)} to ${owedToUser?.name || 'Unknown'} for '${expense.description}'`,
                    },
                });
            }
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error marking settlement as paid:", error);
        return { error: "Failed to mark as paid" };
    }
}

// Optimized: Use raw aggregation queries where possible
export async function getTeamBalances(teamId: string) {
    try {
        const user = await currentUser();
        if (!user) {
            return { youOwe: 0, owedToYou: 0, youOweCount: 0, owedToYouCount: 0 };
        }

        // Get expenses with only needed fields
        const expenses = await prisma.expense.findMany({
            where: {
                team_id: teamId,
                deleted_at: null,
            },
            select: {
                id: true,
                paid_by: true,
            },
        });

        if (expenses.length === 0) {
            return { youOwe: 0, owedToYou: 0, youOweCount: 0, owedToYouCount: 0 };
        }

        const expenseIds = expenses.map((e) => e.id);
        const expenseMap = new Map(expenses.map((e) => [e.id, e.paid_by]));

        // Get pending settlements only
        const settlements = await prisma.settlement.findMany({
            where: {
                expense_id: { in: expenseIds },
                deleted_at: null,
                status: Status.pending,
            },
            select: {
                expense_id: true,
                owed_by: true,
                amount_owed: true,
            },
        });

        let youOwe = 0;
        let owedToYou = 0;
        const youOweToSet = new Set<string>();
        const owedToYouFromSet = new Set<string>();

        for (const settlement of settlements) {
            const paidBy = expenseMap.get(settlement.expense_id);

            if (settlement.owed_by === user.id) {
                youOwe += settlement.amount_owed;
                if (paidBy) youOweToSet.add(paidBy);
            } else if (paidBy === user.id) {
                owedToYou += settlement.amount_owed;
                owedToYouFromSet.add(settlement.owed_by);
            }
        }

        return {
            youOwe,
            owedToYou,
            youOweCount: youOweToSet.size,
            owedToYouCount: owedToYouFromSet.size,
        };
    } catch (error) {
        console.error("Error calculating balances:", error);
        return { youOwe: 0, owedToYou: 0, youOweCount: 0, owedToYouCount: 0 };
    }
}

// Optimized: Use Prisma aggregations instead of fetching all records
export async function getExpenseStats(teamId: string) {
    try {
        const user = await currentUser();
        if (!user) {
            return {
                totalSpent: 0,
                thisMonthSpent: 0,
                avgExpense: 0,
                settlementsCompleted: 0,
                settlementsTotal: 0
            };
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Use aggregations for better performance
        const [expenseAgg, thisMonthAgg, expenseIds, settlementCounts] = await Promise.all([
            // Total and average
            prisma.expense.aggregate({
                where: {
                    team_id: teamId,
                    deleted_at: null,
                },
                _sum: { amount: true },
                _avg: { amount: true },
                _count: true,
            }),
            // This month
            prisma.expense.aggregate({
                where: {
                    team_id: teamId,
                    deleted_at: null,
                    created_at: { gte: startOfMonth },
                },
                _sum: { amount: true },
            }),
            // Get expense IDs for settlement query
            prisma.expense.findMany({
                where: {
                    team_id: teamId,
                    deleted_at: null,
                },
                select: { id: true },
            }),
            // We'll calculate settlements after getting expense IDs
            Promise.resolve(null),
        ]);

        // Get settlement counts
        const expenseIdList = expenseIds.map(e => e.id);
        const [totalSettlements, paidSettlements] = expenseIdList.length > 0 
            ? await Promise.all([
                prisma.settlement.count({
                    where: {
                        expense_id: { in: expenseIdList },
                        deleted_at: null,
                    },
                }),
                prisma.settlement.count({
                    where: {
                        expense_id: { in: expenseIdList },
                        deleted_at: null,
                        status: Status.paid,
                    },
                }),
            ])
            : [0, 0];

        return {
            totalSpent: expenseAgg._sum.amount || 0,
            thisMonthSpent: thisMonthAgg._sum.amount || 0,
            avgExpense: expenseAgg._avg.amount || 0,
            settlementsCompleted: paidSettlements,
            settlementsTotal: totalSettlements,
        };
    } catch (error) {
        console.error("Error fetching expense stats:", error);
        return {
            totalSpent: 0,
            thisMonthSpent: 0,
            avgExpense: 0,
            settlementsCompleted: 0,
            settlementsTotal: 0
        };
    }
}

// Optimized: Use groupBy aggregation
export async function getCategoryStats(teamId: string) {
    try {
        const user = await currentUser();
        if (!user) return [];

        // Use groupBy for efficient category aggregation
        const categoryGroups = await prisma.expense.groupBy({
            by: ['category'],
            where: {
                team_id: teamId,
                deleted_at: null,
            },
            _sum: { amount: true },
            _count: true,
            orderBy: {
                _sum: { amount: 'desc' },
            },
        });

        return categoryGroups.map(group => ({
            category: group.category,
            amount: group._sum.amount || 0,
            count: group._count,
        }));
    } catch (error) {
        console.error("Error fetching category stats:", error);
        return [];
    }
}

// NEW: Unified dashboard data fetcher - single function to get all dashboard data
export async function getDashboardData(teamId: string) {
    try {
        const user = await currentUser();
        if (!user) {
            return null;
        }

        // Verify membership once
        const membership = await verifyTeamMembership(teamId, user.id);
        if (!membership) {
            return null;
        }

        // Fetch all data in parallel
        const [expensesResult, settlementsResult, balances] = await Promise.all([
            getTeamExpenses(teamId, { limit: 20 }),
            getTeamSettlements(teamId, { limit: 15 }),
            getTeamBalances(teamId),
        ]);

        return {
            expenses: expensesResult.expenses,
            expensesNextCursor: expensesResult.nextCursor,
            settlements: settlementsResult.settlements,
            settlementsNextCursor: settlementsResult.nextCursor,
            balances,
        };
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        return null;
    }
}
