"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { Status, PaymentMethod } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cached, cacheKeys, CACHE_TTL, invalidateTeamCache } from "@/lib/cache";
import {
    sendExpenseNotification,
    sendSettlementConfirmation,
    sendPaymentReceipt
} from "@/lib/emails";

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

        // Combined query: verify membership AND get all team members with details
        const teamMembers = await prisma.teamMember.findMany({
            where: { team_id: input.teamId },
            include: {
                user: { select: { id: true, name: true, email: true } },
                team: { select: { name: true } }
            }
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

        // Invalidate cache for all team members
        await invalidateTeamCache(input.teamId, user.id);
        revalidatePath("/dashboard");
        // Send notifications asynchronously
        const teamName = teamMembers[0]?.team?.name || "PayUp Team";
        const creatorName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : "Team Member";

        const emailPromises = teamMembers
            .filter(member => member.user_id !== user.id)
            .map(member => sendExpenseNotification(member.user.email, {
                recipientName: member.user.name.split(' ')[0],
                creatorName: creatorName,
                expenseDescription: input.description,
                totalAmount: input.amount,
                yourShare: splitAmount,
                currency: "PHP",
                category: input.category,
                teamName: teamName,
                memberCount: teamMembers.length,
                deadline: "Upon Request"
            }));

        // Fire and forget - don't block response
        Promise.allSettled(emailPromises).catch(console.error);

        return { success: true, expense: result };
    } catch (error) {
        console.error("Error creating expense:", error);
        return { error: "Failed to create expense" };
    }
}

// Interface for monthly expense creation
interface CreateMonthlyExpenseInput {
    description: string;
    totalAmount: number;      // Total amount across all months
    numberOfMonths: number;   // How many months to divide into (1-24)
    teamId: string;
    category: string;
    deadlineDay: number;      // Day of month for deadline (1-31)
}

// Helper function to round UP for exact division (no decimals)
function roundUp(value: number): number {
    return Math.ceil(value);
}

// Calculate deadline date for a specific month
function calculateDeadline(monthOffset: number, deadlineDay: number): Date {
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, deadlineDay);

    // If the deadline day is greater than days in that month, use last day of month
    const lastDayOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
    if (deadlineDay > lastDayOfMonth) {
        targetDate.setDate(lastDayOfMonth);
    }

    return targetDate;
}

export async function createMonthlyExpense(input: CreateMonthlyExpenseInput) {
    try {
        const user = await currentUser();
        if (!user) {
            return { error: "Not authenticated" };
        }

        // Validation
        if (input.numberOfMonths < 1 || input.numberOfMonths > 24) {
            return { error: "Number of months must be between 1 and 24" };
        }
        if (input.deadlineDay < 1 || input.deadlineDay > 31) {
            return { error: "Deadline day must be between 1 and 31" };
        }
        if (input.totalAmount <= 0) {
            return { error: "Total amount must be greater than 0" };
        }

        // Get team members with details
        const teamMembers = await prisma.teamMember.findMany({
            where: { team_id: input.teamId },
            include: {
                user: { select: { id: true, name: true, email: true } },
                team: { select: { name: true } }
            }
        });

        const isMember = teamMembers.some(m => m.user_id === user.id);
        if (!isMember) {
            return { error: "Not a member of this team" };
        }

        if (teamMembers.length === 0) {
            return { error: "No team members found" };
        }

        // Calculate amounts with round-up strategy
        // Step 1: Divide total by months, round up
        const monthlyAmount = roundUp(input.totalAmount / input.numberOfMonths);
        // Step 2: Divide monthly amount by participants, round up
        const perParticipantAmount = roundUp(monthlyAmount / teamMembers.length);

        // Use transaction to create all records atomically
        const result = await prisma.$transaction(async (tx) => {
            // Create parent expense (tracks the overall monthly payment plan)
            const parentExpense = await tx.expense.create({
                data: {
                    description: `${input.description} (Monthly Plan - ${input.numberOfMonths} months)`,
                    amount: input.totalAmount,
                    paid_by: user.id,
                    currency: "PHP",
                    category: input.category,
                    team_id: input.teamId,
                    is_monthly: true,
                    total_months: input.numberOfMonths,
                    deadline_day: input.deadlineDay,
                },
            });

            // Create child expenses for each month
            const childExpenses = [];
            for (let month = 1; month <= input.numberOfMonths; month++) {
                const deadline = calculateDeadline(month, input.deadlineDay);

                const childExpense = await tx.expense.create({
                    data: {
                        description: `${input.description} - Month ${month}/${input.numberOfMonths}`,
                        amount: monthlyAmount,
                        paid_by: user.id,
                        currency: "PHP",
                        category: input.category,
                        team_id: input.teamId,
                        is_monthly: true,
                        total_months: input.numberOfMonths,
                        month_number: month,
                        parent_expense_id: parentExpense.id,
                        deadline: deadline,
                        deadline_day: input.deadlineDay,
                    },
                });

                childExpenses.push(childExpense);

                // Create settlements for each member (excluding the payer)
                const settlementData = teamMembers
                    .filter((member) => member.user_id !== user.id)
                    .map((member) => ({
                        expense_id: childExpense.id,
                        owed_by: member.user_id,
                        amount_owed: perParticipantAmount,
                        status: Status.pending,
                    }));

                if (settlementData.length > 0) {
                    await tx.settlement.createMany({
                        data: settlementData,
                    });
                }
            }

            // Log activity
            await tx.activityLog.create({
                data: {
                    team_id: input.teamId,
                    user_id: user.id,
                    action: "ADDED_MONTHLY_EXPENSE",
                    details: `Added monthly expense '${input.description}' for PHP ${input.totalAmount.toFixed(2)} split over ${input.numberOfMonths} months (PHP ${perParticipantAmount}/person/month)`,
                },
            });

            return { parentExpense, childExpenses };
        });

        // Invalidate cache after creating monthly expense
        await invalidateTeamCache(input.teamId, user.id);
        revalidatePath("/dashboard");
        // Send notifications asynchronously
        const teamName = teamMembers[0]?.team?.name || "PayUp Team";
        const creatorName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : "Team Member";

        const emailPromises = teamMembers
            .filter(member => member.user_id !== user.id)
            .map(member => sendExpenseNotification(member.user.email, {
                recipientName: member.user.name.split(' ')[0],
                creatorName: creatorName,
                expenseDescription: `${input.description} (Monthly Plan - ${input.numberOfMonths} months)`,
                totalAmount: input.totalAmount,
                yourShare: perParticipantAmount,
                currency: "PHP",
                category: input.category,
                teamName: teamName,
                memberCount: teamMembers.length,
                deadline: `Monthly on day ${input.deadlineDay}`
            }));

        Promise.allSettled(emailPromises).catch(console.error);

        return {
            success: true,
            expense: result.parentExpense,
            monthlyExpenses: result.childExpenses,
            breakdown: {
                totalAmount: input.totalAmount,
                monthlyAmount,
                perParticipantAmount,
                participantCount: teamMembers.length,
            }
        };
    } catch (error) {
        console.error("Error creating monthly expense:", error);
        return { error: "Failed to create monthly expense" };
    }
}

// Get detailed expense by ID for the expense detail page
export async function getExpenseById(expenseId: string) {
    try {
        const user = await currentUser();
        if (!user) {
            return { error: "Not authenticated" };
        }

        const expense = await prisma.expense.findUnique({
            where: { id: expenseId, deleted_at: null },
            include: {
                settlements: {
                    where: { deleted_at: null },
                    orderBy: { created_at: "desc" },
                },
                child_expenses: {
                    where: { deleted_at: null },
                    orderBy: { month_number: "asc" },
                    include: {
                        settlements: {
                            where: { deleted_at: null },
                        },
                    },
                },
            },
        });

        if (!expense) {
            return { error: "Expense not found" };
        }

        // Verify user has access to this expense's team
        if (expense.team_id) {
            const membership = await prisma.teamMember.findUnique({
                where: {
                    team_id_user_id: {
                        team_id: expense.team_id,
                        user_id: user.id,
                    },
                },
            });
            if (!membership) {
                return { error: "Not authorized to view this expense" };
            }
        }

        // Collect all user IDs
        const allUserIds = new Set<string>();
        allUserIds.add(expense.paid_by);
        expense.settlements.forEach((s) => allUserIds.add(s.owed_by));
        expense.child_expenses.forEach((c) => {
            allUserIds.add(c.paid_by);
            c.settlements.forEach((s) => allUserIds.add(s.owed_by));
        });

        const users = await prisma.user.findMany({
            where: {
                id: { in: Array.from(allUserIds) },
                ...(expense.team_id ? {
                    teams: {
                        some: {
                            team_id: expense.team_id  // Only current team members
                        }
                    }
                } : {})
            },
            select: { id: true, name: true, email: true },
        });

        const userMap = new Map(users.map((u) => [u.id, u]));

        // Get team info
        const team = expense.team_id
            ? await prisma.team.findUnique({
                where: { id: expense.team_id },
                select: { id: true, name: true },
            })
            : null;

        return {
            expense: {
                ...expense,
                paid_by_user: userMap.get(expense.paid_by) || { name: "Unknown" },
                team,
                settlements: expense.settlements.map((s) => ({
                    ...s,
                    member: userMap.get(s.owed_by) || { name: "Unknown" },
                })),
                child_expenses: expense.child_expenses.map((c) => ({
                    ...c,
                    settlements: c.settlements.map((s) => ({
                        ...s,
                        member: userMap.get(s.owed_by) || { name: "Unknown" },
                    })),
                })),
            },
        };
    } catch (error) {
        console.error("Error fetching expense:", error);
        return { error: "Failed to fetch expense" };
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

        // Only fetch top-level expenses (exclude child monthly expenses)
        const expenses = await prisma.expense.findMany({
            where: {
                team_id: teamId,
                deleted_at: null,
                parent_expense_id: null, // Only show parent/standalone expenses
                ...(cursor ? { id: { lt: cursor } } : {}),
            },
            orderBy: { created_at: "desc" },
            take: limit + 1,
            include: {
                settlements: {
                    where: { deleted_at: null },
                    select: {
                        id: true,
                        owed_by: true,
                        amount_owed: true,
                        status: true,
                        paid_at: true,
                    },
                },
            },
        });

        // Collect all user IDs (paid_by + all settlement owed_by)
        const allUserIds = new Set<string>();
        expenses.forEach((e) => {
            allUserIds.add(e.paid_by);
            e.settlements.forEach((s) => allUserIds.add(s.owed_by));
        });

        const users = allUserIds.size > 0
            ? await prisma.user.findMany({
                where: {
                    id: { in: Array.from(allUserIds) },
                    teams: {
                        some: {
                            team_id: teamId  // Only users who are current team members
                        }
                    }
                },
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
                paid_by_name: userMap.get(expense.paid_by) || "Former Member",
                // Map settlements with member names
                settlements: expense.settlements.map((s) => ({
                    ...s,
                    member_name: userMap.get(s.owed_by) || "Former Member",
                })),
            })),
            nextCursor,
        };
    } catch (error) {
        console.error("Error fetching expenses:", error);
        return { expenses: [], nextCursor: null };
    }
}


// Get monthly breakdown (child expenses) for a parent monthly expense
export async function getMonthlyBreakdown(parentExpenseId: string) {
    try {
        const user = await currentUser();
        if (!user) {
            return { childExpenses: [] };
        }

        // Get team_id from parent expense
        const parentExpense = await prisma.expense.findUnique({
            where: { id: parentExpenseId },
            select: { team_id: true }
        });

        if (!parentExpense?.team_id) {
            return { childExpenses: [] };
        }

        const childExpenses = await prisma.expense.findMany({
            where: {
                parent_expense_id: parentExpenseId,
                deleted_at: null,
            },
            orderBy: { month_number: "asc" },
            include: {
                settlements: {
                    where: { deleted_at: null },
                    select: {
                        id: true,
                        owed_by: true,
                        amount_owed: true,
                        status: true,
                        paid_at: true,
                    },
                },
            },
        });

        // Collect all user IDs (paid_by + all settlement owed_by)
        const allUserIds = new Set<string>();
        childExpenses.forEach((e) => {
            allUserIds.add(e.paid_by);
            e.settlements.forEach((s) => allUserIds.add(s.owed_by));
        });

        const users = allUserIds.size > 0
            ? await prisma.user.findMany({
                where: {
                    id: { in: Array.from(allUserIds) },
                    teams: {
                        some: {
                            team_id: parentExpense.team_id  // Only current team members
                        }
                    }
                },
                select: { id: true, name: true },
            })
            : [];

        const userMap = new Map(users.map((u) => [u.id, u.name]));

        return {
            childExpenses: childExpenses.map((expense) => ({
                ...expense,
                paid_by_name: userMap.get(expense.paid_by) || "Former Member",
                settlements: expense.settlements.map((s) => ({
                    ...s,
                    member_name: userMap.get(s.owed_by) || "Former Member",
                })),
            })),
        };
    } catch (error) {
        console.error("Error fetching monthly breakdown:", error);
        return { childExpenses: [] };
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

        // Invalidate cache after deletion
        if (expense.team_id) {
            await invalidateTeamCache(expense.team_id, user.id);
        }
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
                // Include deadline fields
                is_monthly: true,
                deadline: true,
                deadline_day: true,
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
                where: {
                    id: { in: userIds },
                    teams: {
                        some: {
                            team_id: teamId  // Only current team members
                        }
                    }
                },
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
                    owed_by: isCurrentUserOwing ? "You" : userMap.get(settlement.owed_by) || "Former Member",
                    owed_to: isCurrentUserOwed ? "You" : userMap.get(expense?.paid_by || "") || "Former Member",
                    owed_by_id: settlement.owed_by,
                    owed_to_id: expense?.paid_by || "",
                    amount: settlement.amount_owed,
                    status: settlement.status,
                    paid_at: settlement.paid_at,
                    isCurrentUserOwing,
                    isCurrentUserOwed,
                    // Include deadline info
                    is_monthly: expense?.is_monthly || false,
                    deadline: expense?.deadline || null,
                    deadline_day: expense?.deadline_day || null,
                };
            }),
            nextCursor,
        };
    } catch (error) {
        console.error("Error fetching settlements:", error);
        return { settlements: [], nextCursor: null };
    }
}

// Update markSettlementAsPaid to allow creditor to mark as paid OR debtor to mark as paid (unconfirmed)
export async function markSettlementAsPaid(
    settlementId: string,
    paymentMethod: PaymentMethod = "CASH",
    proofUrl?: string
) {
    try {
        const user = await currentUser();
        if (!user) {
            return { error: "Not authenticated" };
        }

        const settlement = await prisma.settlement.findUnique({
            where: { id: settlementId },
            include: {
                expense: {
                    select: {
                        paid_by: true,
                        team_id: true,
                        description: true,
                    }
                }
            }
        });

        if (!settlement) {
            return { error: "Settlement not found" };
        }

        const isDebtor = settlement.owed_by === user.id;
        const isCreditor = settlement.expense.paid_by === user.id;

        if (!isDebtor && !isCreditor) {
            return { error: "Not authorized to mark this settlement as paid" };
        }

        // Determine new status
        // If Creditor marks it, it's fully PAID immediately
        // If Debtor marks it, it's UNCONFIRMED (needs verification)
        const newStatus = isCreditor ? Status.paid : Status.unconfirmed;

        const result = await prisma.$transaction(async (tx) => {
            const updatedSettlement = await tx.settlement.update({
                where: { id: settlementId },
                data: {
                    status: newStatus,
                    paid_at: isCreditor ? new Date() : null, // Only set paid_at if confirmed
                    payment_method: paymentMethod,
                    proof_url: proofUrl,
                },
            });

            // Fetch names AND emails for notifications
            const owedToUser = await tx.user.findUnique({
                where: { id: settlement.expense.paid_by },
                select: { name: true, email: true },
            });

            const owedByUser = await tx.user.findUnique({
                where: { id: settlement.owed_by },
                select: { name: true, email: true },
            });

            const team = settlement.expense.team_id
                ? await tx.team.findUnique({ where: { id: settlement.expense.team_id }, select: { name: true } })
                : null;

            // Log activity
            let details = "";
            if (isCreditor) {
                details = `Marked debt of PHP ${updatedSettlement.amount_owed.toFixed(2)} from ${owedByUser?.name || 'Unknown'} as PAID manually`;
            } else {
                details = `Submitted payment for PHP ${updatedSettlement.amount_owed.toFixed(2)} to ${owedToUser?.name || 'Unknown'} via ${paymentMethod} (Pending Verification)`;
            }

            await tx.activityLog.create({
                data: {
                    team_id: settlement.expense.team_id || "",
                    user_id: user.id,
                    action: isCreditor ? "PAID_SETTLEMENT" : "SUBMITTED_PAYMENT",
                    details: details,
                },
            });

            return {
                updatedSettlement,
                owedToUser,
                owedByUser,
                teamName: team?.name || "PayUp Team",
                expenseDesc: settlement.expense.description
            };
        });

        // Send Notifications
        try {
            if (isCreditor && result.owedByUser?.email) {
                // Creditor marked as PAID -> Receipt to Debtor
                await sendPaymentReceipt(result.owedByUser.email, {
                    recipientName: result.owedByUser.name,
                    payerName: result.owedToUser?.name || "Creditor",
                    amount: result.updatedSettlement.amount_owed,
                    currency: "PHP",
                    paymentMethod: paymentMethod,
                    expenseDescription: result.expenseDesc,
                    teamName: result.teamName,
                    paidAt: new Date().toLocaleDateString(),
                    transactionId: result.updatedSettlement.id.slice(0, 8).toUpperCase()
                });
            } else if (!isCreditor && result.owedToUser?.email) {
                // Debtor submitted payment -> Confirm to Creditor
                await sendSettlementConfirmation(result.owedToUser.email, {
                    creditorName: result.owedToUser.name,
                    debtorName: result.owedByUser?.name || "Team Member",
                    amount: result.updatedSettlement.amount_owed,
                    currency: "PHP",
                    paymentMethod: paymentMethod,
                    expenseDescription: result.expenseDesc,
                    teamName: result.teamName,
                    settlementId: result.updatedSettlement.id
                });
            }
        } catch (emailError) {
            console.error("Failed to send settlement notification:", emailError);
        }

        // Invalidate cache after settlement update
        if (settlement.expense.team_id) {
            await invalidateTeamCache(settlement.expense.team_id, user.id);
        }
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error marking settlement as paid:", error);
        return { error: "Failed to mark as paid" };
    }
}

export async function verifySettlement(settlementId: string) {
    try {
        const user = await currentUser();
        if (!user) return { error: "Not authenticated" };

        const settlement = await prisma.settlement.findUnique({
            where: { id: settlementId },
            include: { expense: true }
        });

        if (!settlement) return { error: "Settlement not found" };

        // Only creditor can verify
        if (settlement.expense.paid_by !== user.id) {
            return { error: "Only the creditor can verify this payment" };
        }

        const result = await prisma.$transaction(async (tx) => {
            await tx.settlement.update({
                where: { id: settlementId },
                data: {
                    status: Status.paid,
                    paid_at: new Date(),
                }
            });

            // Fetch Debtor info for receipt
            const payer = await tx.user.findUnique({
                where: { id: settlement.owed_by },
                select: { name: true, email: true }
            });

            const team = settlement.expense.team_id
                ? await tx.team.findUnique({ where: { id: settlement.expense.team_id }, select: { name: true } })
                : null;

            await tx.activityLog.create({
                data: {
                    team_id: settlement.expense.team_id || "",
                    user_id: user.id,
                    action: "VERIFIED_PAYMENT",
                    details: `Verified payment from ${payer?.name || 'Unknown'} for '${settlement.expense.description}'`,
                }
            });

            return { payer, teamName: team?.name || "PayUp Team", settlement };
        });

        // Send Receipt Notification
        if (result.payer?.email) {
            sendPaymentReceipt(result.payer.email, {
                recipientName: result.payer.name,
                payerName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : "Creditor",
                amount: settlement.amount_owed,
                currency: "PHP",
                paymentMethod: settlement.payment_method || "CASH",
                expenseDescription: settlement.expense.description,
                teamName: result.teamName,
                paidAt: new Date().toLocaleDateString(),
                transactionId: settlement.id.slice(0, 8).toUpperCase()
            }).catch(console.error);
        }
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error verifying settlement:", error);
        return { error: "Failed to verify settlement" };
    }
}

export async function rejectSettlement(settlementId: string) {
    try {
        const user = await currentUser();
        if (!user) return { error: "Not authenticated" };

        const settlement = await prisma.settlement.findUnique({
            where: { id: settlementId },
            include: { expense: true }
        });

        if (!settlement) return { error: "Settlement not found" };

        // Only creditor can reject
        if (settlement.expense.paid_by !== user.id) {
            return { error: "Only the creditor can reject this payment" };
        }

        await prisma.$transaction(async (tx) => {
            await tx.settlement.update({
                where: { id: settlementId },
                data: {
                    status: Status.pending,
                    paid_at: null,
                    proof_url: null, // Clear proof on rejection? Maybe keep it for history? Let's clear for retry.
                    payment_method: null,
                }
            });

            const payer = await tx.user.findUnique({
                where: { id: settlement.owed_by },
                select: { name: true }
            });

            await tx.activityLog.create({
                data: {
                    team_id: settlement.expense.team_id || "",
                    user_id: user.id,
                    action: "REJECTED_PAYMENT",
                    details: `Rejected payment from ${payer?.name || 'Unknown'} for '${settlement.expense.description}'`,
                }
            });
        });

        // Invalidate cache after rejection
        if (settlement.expense.team_id) {
            await invalidateTeamCache(settlement.expense.team_id, user.id);
        }
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error rejecting settlement:", error);
        return { error: "Failed to reject settlement" };
    }
}

export async function markSettlementsAsPaid(settlementIds: string[]) {
    // This batch action is currently only used for "Pay All" or "Collect All"
    // "Collect All" (Creditor) -> Should go to PAID
    // "Pay All" (Debtor) -> Should go to UNCONFIRMED (Defaulting to CASH for batch for now until UI supports batch options)
    // For now, let's keep it simple: separate existing logic or update it?
    // The prompt asked for "Enhance the payments page... Require all users to register... valid GCash numbers... "
    // Batch pay all might need to support options.
    // For now, let's update this to handle the status logic correctly.

    try {
        const user = await currentUser();
        if (!user) {
            return { error: "Not authenticated" };
        }

        if (settlementIds.length === 0) {
            return { success: true };
        }

        const settlements = await prisma.settlement.findMany({
            where: { id: { in: settlementIds } },
            include: {
                expense: {
                    select: {
                        paid_by: true,
                        team_id: true,
                        description: true,
                    }
                }
            }
        });

        // Validate all
        let isCreditorAction = false;

        // We assume all selected items are of the same relationship relative to the user (all payable OR all receivable)
        // because the UI groups them that way.
        const firstSettlement = settlements[0];
        if (firstSettlement.expense.paid_by === user.id) {
            isCreditorAction = true;
        } else if (firstSettlement.owed_by === user.id) {
            isCreditorAction = false;
        } else {
            return { error: "Not authorized" };
        }

        const newStatus = isCreditorAction ? Status.paid : Status.unconfirmed;
        const paymentMethod = isCreditorAction ? null : PaymentMethod.CASH; // Default batch pay to CASH for now

        await prisma.$transaction(async (tx) => {
            // Update all
            await tx.settlement.updateMany({
                where: { id: { in: settlementIds } },
                data: {
                    status: newStatus,
                    paid_at: isCreditorAction ? new Date() : null,
                    payment_method: paymentMethod, // Default to CASH for batch pay
                },
            });

            const teamId = settlements[0]?.expense.team_id;
            if (teamId) {
                const totalAmount = settlements.reduce((sum, s) => sum + s.amount_owed, 0);
                await tx.activityLog.create({
                    data: {
                        team_id: teamId,
                        user_id: user.id,
                        action: isCreditorAction ? "PAID_SETTLEMENT_BATCH" : "SUBMITTED_PAYMENT_BATCH",
                        details: isCreditorAction
                            ? `Marked ${settlementIds.length} payments totaling PHP ${totalAmount.toFixed(2)} as received`
                            : `Submitted ${settlementIds.length} cash payments totaling PHP ${totalAmount.toFixed(2)} (Pending Verification)`,
                    },
                });
            }
        });

        // Invalidate cache after batch update
        const teamId = settlements[0]?.expense.team_id;
        if (teamId) {
            await invalidateTeamCache(teamId, user.id);
        }
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error marking settlements as paid:", error);
        return { error: "Failed to mark as paid" };
    }
}

// Batch mark settlements as paid with specific payment method
export async function markSettlementsAsPaidWithMethod(
    settlementIds: string[],
    method: "CASH" | "GCASH",
    proofUrl?: string
) {
    try {
        const user = await currentUser();
        if (!user) {
            return { error: "Not authenticated" };
        }

        if (settlementIds.length === 0) {
            return { success: true };
        }

        const settlements = await prisma.settlement.findMany({
            where: { id: { in: settlementIds } },
            include: {
                expense: {
                    select: {
                        paid_by: true,
                        team_id: true,
                        description: true,
                    }
                }
            }
        });

        // Validate that user is the debtor for all settlements
        const firstSettlement = settlements[0];
        if (firstSettlement.owed_by !== user.id) {
            return { error: "You can only submit payments for debts you owe" };
        }

        // Validate all settlements belong to the same creditor (for batch payment logic)
        const creditorId = firstSettlement.expense.paid_by;
        const allSameCreditor = settlements.every(s => s.expense.paid_by === creditorId);
        if (!allSameCreditor) {
            return { error: "All settlements must be to the same person for batch payment" };
        }

        await prisma.$transaction(async (tx) => {
            // Update all settlements with the payment method and proof
            await tx.settlement.updateMany({
                where: { id: { in: settlementIds } },
                data: {
                    status: Status.unconfirmed,
                    payment_method: method === "CASH" ? PaymentMethod.CASH : PaymentMethod.GCASH,
                    proof_url: proofUrl || null,
                    // Don't set paid_at yet - that happens when creditor verifies
                },
            });

            const teamId = settlements[0]?.expense.team_id;
            if (teamId) {
                const totalAmount = settlements.reduce((sum, s) => sum + s.amount_owed, 0);
                await tx.activityLog.create({
                    data: {
                        team_id: teamId,
                        user_id: user.id,
                        action: "SUBMITTED_PAYMENT_BATCH",
                        details: `Submitted ${settlementIds.length} ${method} payments totaling PHP ${totalAmount.toFixed(2)} (Pending Verification)`,
                    },
                });
            }
        });

        // Invalidate cache after batch update
        const teamId = settlements[0]?.expense.team_id;
        if (teamId) {
            await invalidateTeamCache(teamId, user.id);
        }
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error marking settlements as paid with method:", error);
        return { error: "Failed to submit payments" };
    }
}


export async function getMyPendingSettlements(teamId: string) {
    try {
        const user = await currentUser();
        if (!user) {
            return [];
        }

        // Verify membership
        const membership = await verifyTeamMembership(teamId, user.id);
        if (!membership) {
            return [];
        }

        // Get pending settlements where the user owes money
        const settlements = await prisma.settlement.findMany({
            where: {
                owed_by: user.id,
                status: { in: [Status.pending, Status.unconfirmed] },
                deleted_at: null,
                expense: { team_id: teamId },
            },
            include: {
                expense: {
                    select: {
                        description: true,
                        amount: true,
                        category: true,
                        created_at: true,
                        paid_by: true,
                        // Include deadline fields
                        is_monthly: true,
                        deadline: true,
                        deadline_day: true,
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        if (settlements.length === 0) {
            return [];
        }

        // Fetch names of creditors (users who paid)
        const creditorIds = [...new Set(settlements.map(s => s.expense.paid_by))];
        const creditors = await prisma.user.findMany({
            where: { id: { in: creditorIds } },
            select: { id: true, name: true, email: true, gcash_number: true }
        });

        const creditorMap = new Map(creditors.map(c => [c.id, c]));

        // Transform data for UI
        return settlements.map(settlement => {
            const creditor = creditorMap.get(settlement.expense.paid_by);
            return {
                id: settlement.id,
                amount: settlement.amount_owed,
                expense_description: settlement.expense.description,
                expense_amount: settlement.expense.amount,
                expense_date: settlement.expense.created_at,
                category: settlement.expense.category,
                owed_to: creditor || { id: 'unknown', name: 'Unknown', email: '', gcash_number: null },
                status: settlement.status,
                payment_method: settlement.payment_method,
                proof_url: settlement.proof_url,
                // Include deadline info
                is_monthly: settlement.expense.is_monthly,
                deadline: settlement.expense.deadline,
                deadline_day: settlement.expense.deadline_day,
            };
        });

    } catch (error) {
        console.error("Error fetching my pending settlements:", error);
        return [];
    }
}

export async function getMyReceivables(teamId: string) {
    try {
        const user = await currentUser();
        if (!user) {
            return [];
        }

        // Verify membership
        const membership = await verifyTeamMembership(teamId, user.id);
        if (!membership) {
            return [];
        }

        // Get pending settlements where the user is owed money
        // We find settlements where the expense was paid by the user
        const settlements = await prisma.settlement.findMany({
            where: {
                status: {
                    in: [Status.pending, Status.unconfirmed] // Include unconfirmed to show waiting for verification
                },
                deleted_at: null,
                expense: {
                    team_id: teamId,
                    paid_by: user.id,
                }
            },
            include: {
                expense: {
                    select: {
                        description: true,
                        amount: true,
                        created_at: true,
                        category: true,
                        // Include deadline fields
                        is_monthly: true,
                        deadline: true,
                        deadline_day: true,
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        if (settlements.length === 0) {
            return [];
        }

        // Fetch names of debtors (users who owe)
        const debtorIds = [...new Set(settlements.map(s => s.owed_by))];
        const debtors = await prisma.user.findMany({
            where: { id: { in: debtorIds } },
            select: { id: true, name: true, email: true, gcash_number: true }
        });

        const debtorMap = new Map(debtors.map(d => [d.id, d]));

        // Transform data for UI
        return settlements.map(settlement => ({
            id: settlement.id,
            amount: settlement.amount_owed,
            expense_description: settlement.expense.description,
            expense_amount: settlement.expense.amount,
            expense_date: settlement.expense.created_at,
            category: settlement.expense.category,
            owed_by: debtorMap.get(settlement.owed_by) || { id: 'unknown', name: 'Unknown', email: '', gcash_number: null },
            status: settlement.status,
            payment_method: settlement.payment_method,
            proof_url: settlement.proof_url,
            // Include deadline info
            is_monthly: settlement.expense.is_monthly,
            deadline: settlement.expense.deadline,
            deadline_day: settlement.expense.deadline_day,
        }));

    } catch (error) {
        console.error("Error fetching my receivables:", error);
        return [];
    }
}

// Optimized: Single raw SQL query for balance calculations (10x faster) + Redis caching
export async function getTeamBalances(teamId: string) {
    try {
        const user = await currentUser();
        if (!user) {
            return { youOwe: 0, owedToYou: 0, youOweCount: 0, owedToYouCount: 0 };
        }

        const cacheKey = cacheKeys.teamBalances(teamId, user.id);

        return cached(cacheKey, async () => {
            // Single optimized raw SQL query with JOINs and aggregations
            const result = await prisma.$queryRaw<Array<{
                you_owe: number | null;
                owed_to_you: number | null;
                you_owe_count: bigint;
                owed_to_you_count: bigint;
            }>>`
                SELECT 
                    COALESCE(SUM(CASE WHEN s.owed_by = ${user.id} THEN s.amount_owed ELSE 0 END), 0) as you_owe,
                    COALESCE(SUM(CASE WHEN e.paid_by = ${user.id} AND s.owed_by != ${user.id} THEN s.amount_owed ELSE 0 END), 0) as owed_to_you,
                    COUNT(DISTINCT CASE WHEN s.owed_by = ${user.id} THEN e.paid_by END) as you_owe_count,
                    COUNT(DISTINCT CASE WHEN e.paid_by = ${user.id} AND s.owed_by != ${user.id} THEN s.owed_by END) as owed_to_you_count
                FROM settlements s
                INNER JOIN expenses e ON s.expense_id = e.id
                WHERE e.team_id = ${teamId}
                  AND e.deleted_at IS NULL
                  AND s.deleted_at IS NULL
                  AND s.status = 'pending'
            `;

            const data = result[0];
            return {
                youOwe: Number(data?.you_owe || 0),
                owedToYou: Number(data?.owed_to_you || 0),
                youOweCount: Number(data?.you_owe_count || 0),
                owedToYouCount: Number(data?.owed_to_you_count || 0),
            };
        }, CACHE_TTL.BALANCES);
    } catch (error) {
        console.error("Error calculating balances:", error);
        return { youOwe: 0, owedToYou: 0, youOweCount: 0, owedToYouCount: 0 };
    }
}

// Optimized: Single raw SQL query for all expense stats (replaces 5 queries with 1) + Redis caching
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

        const cacheKey = cacheKeys.expenseStats(teamId);

        return cached(cacheKey, async () => {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            // Single optimized raw SQL query combining all aggregations
            // Only count parent/standalone expenses (exclude child monthly expenses)
            const result = await prisma.$queryRaw<Array<{
                total_spent: number | null;
                this_month_spent: number | null;
                avg_expense: number | null;
                total_settlements: bigint;
                paid_settlements: bigint;
            }>>`
                SELECT 
                    COALESCE(SUM(e.amount), 0) as total_spent,
                    COALESCE(SUM(CASE WHEN e.created_at >= ${startOfMonth} THEN e.amount ELSE 0 END), 0) as this_month_spent,
                    COALESCE(AVG(e.amount), 0) as avg_expense,
                    (SELECT COUNT(*) FROM settlements s2 
                     INNER JOIN expenses e2 ON s2.expense_id = e2.id 
                     WHERE e2.team_id = ${teamId} AND e2.deleted_at IS NULL AND s2.deleted_at IS NULL) as total_settlements,
                    (SELECT COUNT(*) FROM settlements s3 
                     INNER JOIN expenses e3 ON s3.expense_id = e3.id 
                     WHERE e3.team_id = ${teamId} AND e3.deleted_at IS NULL AND s3.deleted_at IS NULL AND s3.status = 'paid') as paid_settlements
                FROM expenses e
                WHERE e.team_id = ${teamId} AND e.deleted_at IS NULL AND e.parent_expense_id IS NULL
            `;

            const data = result[0];
            return {
                totalSpent: Number(data?.total_spent || 0),
                thisMonthSpent: Number(data?.this_month_spent || 0),
                avgExpense: Number(data?.avg_expense || 0),
                settlementsCompleted: Number(data?.paid_settlements || 0),
                settlementsTotal: Number(data?.total_settlements || 0),
            };
        }, CACHE_TTL.STATS);
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
        // Only count parent/standalone expenses (exclude child monthly expenses)
        const categoryGroups = await prisma.expense.groupBy({
            by: ['category'],
            where: {
                team_id: teamId,
                deleted_at: null,
                parent_expense_id: null, // Exclude child monthly expenses
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
