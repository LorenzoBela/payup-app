"use server";

import { prisma as db } from "@/lib/prisma";

export async function getLandingStats() {
    try {
        const [teamCount, userCount, expenseCount, totalExpenseAmount] = await Promise.all([
            db.team.count(),
            db.user.count({
                where: { deleted_at: null }
            }),
            // Only count parent expenses (not monthly child expenses)
            db.expense.count({
                where: {
                    deleted_at: null,
                    parent_expense_id: null  // Exclude child monthly expenses
                }
            }),
            // Sum only parent expenses to avoid double-counting monthly installments
            db.expense.aggregate({
                where: {
                    deleted_at: null,
                    parent_expense_id: null  // Exclude child monthly expenses
                },
                _sum: { amount: true }
            })
        ]);

        return {
            teamCount,
            userCount,
            expenseCount,
            totalExpenseAmount: totalExpenseAmount._sum.amount || 0
        };
    } catch (error) {
        console.error("Failed to fetch landing stats:", error);
        return {
            teamCount: 0,
            userCount: 0,
            expenseCount: 0,
            totalExpenseAmount: 0
        };
    }
}
