"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { cached, cacheKeys, CACHE_TTL } from "@/lib/cache";

// Types for calendar events
export interface CalendarEvent {
    id: string;
    date: Date;
    type: 'expense_created' | 'payment_due' | 'payment_pending' | 'payment_made' | 'payment_verified';
    title: string;
    description: string;
    amount: number;
    personName: string;
    personId: string;
    settlementId?: string;
    expenseId: string;
    isOverdue?: boolean;
    status: 'pending' | 'unconfirmed' | 'paid';
}

export interface CalendarDay {
    date: Date;
    events: CalendarEvent[];
    hasOverdue: boolean;
    hasPending: boolean;
    hasPaid: boolean;
    hasDue: boolean;
}

interface PaymentCalendarData {
    events: CalendarEvent[];
    calendarDays: Map<string, CalendarDay>;
}

// Helper to format date as YYYY-MM-DD for map key
function formatDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
}

// Verify team membership
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

/**
 * Get payment calendar data for a team
 * Fetches all settlements with related expenses and transforms them into calendar events
 */
export async function getPaymentCalendarData(teamId: string): Promise<{
    events: CalendarEvent[];
    error?: string;
}> {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { events: [], error: "Not authenticated" };
        }

        // Verify membership
        const membership = await verifyTeamMembership(teamId, userId);
        if (!membership) {
            return { events: [], error: "Not a team member" };
        }

        const cacheKey = `calendar:${teamId}`;

        const fetchCalendarData = async () => {
            // Fetch settlements with expense and user data
            const settlements = await prisma.settlement.findMany({
                where: {
                    expense: {
                        team_id: teamId,
                        deleted_at: null,
                    },
                    deleted_at: null,
                },
                include: {
                    expense: {
                        select: {
                            id: true,
                            description: true,
                            amount: true,
                            created_at: true,
                            paid_by: true,
                            is_monthly: true,
                            deadline: true,
                            deadline_day: true,
                            category: true,
                        },
                    },
                },
                orderBy: {
                    created_at: 'desc',
                },
            });

            // Get all user IDs involved
            const userIds = new Set<string>();
            settlements.forEach(s => {
                userIds.add(s.owed_by);
                userIds.add(s.expense.paid_by);
            });

            // Fetch user names
            const users = await prisma.user.findMany({
                where: { id: { in: Array.from(userIds) } },
                select: { id: true, name: true },
            });
            const userMap = new Map(users.map(u => [u.id, u.name]));

            const events: CalendarEvent[] = [];
            const now = new Date();

            settlements.forEach(settlement => {
                const expense = settlement.expense;
                const debtorName = userMap.get(settlement.owed_by) || "Unknown";
                const creditorName = userMap.get(expense.paid_by) || "Unknown";

                // Event 1: Expense Created
                events.push({
                    id: `created-${settlement.id}`,
                    date: expense.created_at,
                    type: 'expense_created',
                    title: expense.description,
                    description: `Added by ${creditorName}`,
                    amount: settlement.amount_owed,
                    personName: creditorName,
                    personId: expense.paid_by,
                    settlementId: settlement.id,
                    expenseId: expense.id,
                    status: settlement.status as 'pending' | 'unconfirmed' | 'paid',
                });

                // Event 2: Payment Due (for monthly expenses with deadlines)
                if (expense.is_monthly && expense.deadline) {
                    const isOverdue = new Date(expense.deadline) < now && settlement.status !== 'paid';
                    events.push({
                        id: `due-${settlement.id}`,
                        date: expense.deadline,
                        type: 'payment_due',
                        title: expense.description,
                        description: `Due from ${debtorName}`,
                        amount: settlement.amount_owed,
                        personName: debtorName,
                        personId: settlement.owed_by,
                        settlementId: settlement.id,
                        expenseId: expense.id,
                        isOverdue,
                        status: settlement.status as 'pending' | 'unconfirmed' | 'paid',
                    });
                }

                // Event 3: Payment Status Events
                if (settlement.status === 'unconfirmed') {
                    // Payment pending verification
                    events.push({
                        id: `pending-${settlement.id}`,
                        date: settlement.updated_at,
                        type: 'payment_pending',
                        title: expense.description,
                        description: `${debtorName} marked as paid, awaiting verification`,
                        amount: settlement.amount_owed,
                        personName: debtorName,
                        personId: settlement.owed_by,
                        settlementId: settlement.id,
                        expenseId: expense.id,
                        status: 'unconfirmed',
                    });
                } else if (settlement.status === 'paid' && settlement.paid_at) {
                    // Payment completed
                    events.push({
                        id: `paid-${settlement.id}`,
                        date: settlement.paid_at,
                        type: 'payment_made',
                        title: expense.description,
                        description: `Paid by ${debtorName}`,
                        amount: settlement.amount_owed,
                        personName: debtorName,
                        personId: settlement.owed_by,
                        settlementId: settlement.id,
                        expenseId: expense.id,
                        status: 'paid',
                    });
                }
            });

            // Sort events by date (newest first for timeline)
            events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            return events;
        };

        const events = await cached(cacheKey, fetchCalendarData, CACHE_TTL.STATS);

        return { events };
    } catch (error) {
        console.error("Error fetching calendar data:", error);
        return { events: [], error: "Failed to fetch calendar data" };
    }
}

/**
 * Get calendar events for a specific month
 */
export async function getMonthEvents(
    teamId: string,
    year: number,
    month: number
): Promise<{ events: CalendarEvent[]; error?: string }> {
    const result = await getPaymentCalendarData(teamId);
    if (result.error) {
        return result;
    }

    // Filter events for the specified month
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    const filteredEvents = result.events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= startDate && eventDate <= endDate;
    });

    return { events: filteredEvents };
}

/**
 * Get events for a specific date
 */
export async function getDayEvents(
    teamId: string,
    date: Date
): Promise<{ events: CalendarEvent[]; error?: string }> {
    const result = await getPaymentCalendarData(teamId);
    if (result.error) {
        return result;
    }

    const dateKey = formatDateKey(date);

    const filteredEvents = result.events.filter(event => {
        return formatDateKey(new Date(event.date)) === dateKey;
    });

    return { events: filteredEvents };
}
