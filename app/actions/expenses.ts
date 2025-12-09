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

export async function createExpense(input: CreateExpenseInput) {
    try {
        const user = await currentUser();
        if (!user) {
            return { error: "Not authenticated" };
        }

        // Verify user is a member of the team
        const membership = await prisma.teamMember.findUnique({
            where: {
                team_id_user_id: {
                    team_id: input.teamId,
                    user_id: user.id,
                },
            },
        });

        if (!membership) {
            return { error: "Not a member of this team" };
        }

        // Get all team members for splitting the expense
        const teamMembers = await prisma.teamMember.findMany({
            where: { team_id: input.teamId },
            include: { user: true },
        });

        if (teamMembers.length === 0) {
            return { error: "No team members found" };
        }

        // Calculate split amount (divide evenly among all members)
        const splitAmount = input.amount / teamMembers.length;

        // Create expense
        const expense = await prisma.expense.create({
            data: {
                description: input.description,
                amount: input.amount,
                paid_by: user.id,
                currency: "PHP",
                category: input.category as any,
                team_id: input.teamId,
            },
        });

        // Create settlements for each member who owes money (excluding the payer)
        const settlements = teamMembers
            .filter((member) => member.user_id !== user.id)
            .map((member) => ({
                expense_id: expense.id,
                owed_by: member.user_id,
                amount_owed: splitAmount,
                status: Status.pending,
            }));

        if (settlements.length > 0) {
            await prisma.settlement.createMany({
                data: settlements,
            });
        }

        await prisma.activityLog.create({
            data: {
                team_id: input.teamId,
                user_id: user.id,
                action: "ADDED_EXPENSE",
                details: `Added expense '${input.description}' for PHP ${input.amount.toFixed(2)}`,
            },
        });

        revalidatePath("/dashboard");
        return { success: true, expense };
    } catch (error) {
        console.error("Error creating expense:", error);
        return { error: "Failed to create expense" };
    }
}

export async function getTeamExpenses(teamId: string) {
    try {
        const user = await currentUser();
        if (!user) {
            return [];
        }

        // Verify user is a member of the team
        const membership = await prisma.teamMember.findUnique({
            where: {
                team_id_user_id: {
                    team_id: teamId,
                    user_id: user.id,
                },
            },
        });

        if (!membership) {
            return [];
        }

        const expenses = await prisma.expense.findMany({
            where: {
                team_id: teamId,
                deleted_at: null,
            },
            orderBy: { created_at: "desc" },
        });

        // Get user names for paid_by
        const userIds = [...new Set(expenses.map((e) => e.paid_by))];
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
        });

        const userMap = new Map(users.map((u) => [u.id, u.name]));

        return expenses.map((expense) => ({
            ...expense,
            paid_by_name: userMap.get(expense.paid_by) || "Unknown",
        }));
    } catch (error) {
        console.error("Error fetching expenses:", error);
        return [];
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
        });

        if (!expense) {
            return { error: "Expense not found" };
        }

        // Soft delete the expense
        await prisma.expense.update({
            where: { id: expenseId },
            data: { deleted_at: new Date() },
        });

        // Also soft delete related settlements
        // Also soft delete related settlements
        await prisma.settlement.updateMany({
            where: { expense_id: expenseId },
            data: { deleted_at: new Date() },
        });

        if (expense.team_id) {
            await prisma.activityLog.create({
                data: {
                    team_id: expense.team_id,
                    user_id: user.id,
                    action: "DELETED_EXPENSE",
                    details: `Deleted expense '${expense.description}'`,
                },
            });
        }

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error deleting expense:", error);
        return { error: "Failed to delete expense" };
    }
}

export async function getTeamSettlements(teamId: string) {
    try {
        const user = await currentUser();
        if (!user) {
            return [];
        }

        // Verify user is a member of the team
        const membership = await prisma.teamMember.findUnique({
            where: {
                team_id_user_id: {
                    team_id: teamId,
                    user_id: user.id,
                },
            },
        });

        if (!membership) {
            return [];
        }

        // Get expenses for this team
        const expenses = await prisma.expense.findMany({
            where: {
                team_id: teamId,
                deleted_at: null,
            },
        });

        const expenseIds = expenses.map((e) => e.id);
        const expenseMap = new Map(expenses.map((e) => [e.id, e]));

        // Get settlements for team expenses
        const settlements = await prisma.settlement.findMany({
            where: {
                expense_id: { in: expenseIds },
                deleted_at: null,
            },
            orderBy: { created_at: "desc" },
        });

        // Get user names
        const userIds = [
            ...new Set([
                ...settlements.map((s) => s.owed_by),
                ...expenses.map((e) => e.paid_by),
            ]),
        ];
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
        });
        const userMap = new Map(users.map((u) => [u.id, u.name]));

        return settlements.map((settlement) => {
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
        });
    } catch (error) {
        console.error("Error fetching settlements:", error);
        return [];
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

        // Only the person who owes can mark as paid
        if (settlement.owed_by !== user.id) {
            return { error: "Only the person who owes can mark as paid" };
        }

        const updatedSettlement = await prisma.settlement.update({
            where: { id: settlementId },
            data: {
                status: Status.paid,
                paid_at: new Date()
            },
        });

        const expense = await prisma.expense.findUnique({
            where: { id: updatedSettlement.expense_id },
        });

        if (expense && expense.team_id) {
            const owedToUser = await prisma.user.findUnique({ where: { id: expense.paid_by } });

            await prisma.activityLog.create({
                data: {
                    team_id: expense.team_id,
                    user_id: user.id,
                    action: "PAID_SETTLEMENT",
                    details: `Paid PHP ${updatedSettlement.amount_owed.toFixed(2)} to ${owedToUser?.name || 'Unknown'} for '${expense.description}'`,
                },
            });
        }

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error marking settlement as paid:", error);
        return { error: "Failed to mark as paid" };
    }
}

export async function getTeamBalances(teamId: string) {
    try {
        const user = await currentUser();
        if (!user) {
            return { youOwe: 0, owedToYou: 0, youOweCount: 0, owedToYouCount: 0 };
        }

        // Get expenses for this team
        const expenses = await prisma.expense.findMany({
            where: {
                team_id: teamId,
                deleted_at: null,
            },
        });

        const expenseIds = expenses.map((e) => e.id);
        const expenseMap = new Map(expenses.map((e) => [e.id, e]));

        // Get pending settlements
        const settlements = await prisma.settlement.findMany({
            where: {
                expense_id: { in: expenseIds },
                deleted_at: null,
                status: Status.pending,
            },
        });

        let youOwe = 0;
        let owedToYou = 0;
        const youOweToSet = new Set<string>();
        const owedToYouFromSet = new Set<string>();

        for (const settlement of settlements) {
            const expense = expenseMap.get(settlement.expense_id);

            if (settlement.owed_by === user.id) {
                // Current user owes someone
                youOwe += settlement.amount_owed;
                if (expense) youOweToSet.add(expense.paid_by);
            } else if (expense?.paid_by === user.id) {
                // Someone owes current user
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

        // Get expenses
        const expenses = await prisma.expense.findMany({
            where: {
                team_id: teamId,
                deleted_at: null,
            },
        });

        // Get settlements
        const expenseIds = expenses.map(e => e.id);
        const settlements = await prisma.settlement.findMany({
            where: {
                expense_id: { in: expenseIds },
                deleted_at: null,
            },
        });

        const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

        const thisMonthExpenses = expenses.filter(e => e.created_at >= startOfMonth);
        const thisMonthSpent = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

        const avgExpense = expenses.length > 0 ? totalSpent / expenses.length : 0;

        const settlementsCompleted = settlements.filter(s => s.status === "paid").length;
        const settlementsTotal = settlements.length;

        return {
            totalSpent,
            thisMonthSpent,
            avgExpense,
            settlementsCompleted,
            settlementsTotal
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

export async function getCategoryStats(teamId: string) {
    try {
        const user = await currentUser();
        if (!user) return [];

        const expenses = await prisma.expense.findMany({
            where: {
                team_id: teamId,
                deleted_at: null,
            },
        });

        const categoryMap = new Map<string, number>();
        expenses.forEach(e => {
            const current = categoryMap.get(e.category) || 0;
            categoryMap.set(e.category, current + e.amount);
        });

        const result = Array.from(categoryMap.entries()).map(([category, amount]) => ({
            category,
            amount,
            count: expenses.filter(e => e.category === category).length
        })).sort((a, b) => b.amount - a.amount);

        return result;

    } catch (error) {
        console.error("Error fetching category stats:", error);
        return [];
    }
}
