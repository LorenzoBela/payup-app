import { NextResponse } from "next/server";
import {
    sendPaymentReceipt,
    sendExpenseNotification,
    sendSettlementConfirmation,
    sendPaymentReminder,
    sendTeamInvite,
} from "@/lib/emails";

export const dynamic = 'force-dynamic';

export async function GET() {
    const email = "lorenzo91145@gmail.com";
    // Explicitly check for env var presence
    const apiKeyPresent = !!process.env.RESEND_API_KEY;

    if (!apiKeyPresent) {
        return NextResponse.json({
            success: false,
            error: "RESEND_API_KEY is missing from environment variables."
        }, { status: 500 });
    }

    try {
        const results = [];
        const errors = [];

        // 1. Payment Receipt
        const r1 = await sendPaymentReceipt(email, {
            recipientName: "Lorenzo",
            payerName: "Test User",
            amount: 1500,
            currency: "PHP",
            paymentMethod: "GCASH",
            expenseDescription: "Friday Team Lunch",
            teamName: "PayUp Team",
            paidAt: new Date().toLocaleDateString(),
            transactionId: "TX-123-TEST"
        });
        if (r1.success) results.push("Payment Receipt");
        else errors.push({ type: "Payment Receipt", error: r1.error });

        // 2. Expense Notification
        const r2 = await sendExpenseNotification(email, {
            recipientName: "Lorenzo",
            creatorName: "Admin User",
            expenseDescription: "Q4 Team Building",
            totalAmount: 15000,
            yourShare: 3000,
            currency: "PHP",
            category: "Events",
            teamName: "PayUp Team",
            memberCount: 5,
            deadline: "Dec 30, 2025"
        });
        if (r2.success) results.push("Expense Notification");
        else errors.push({ type: "Expense Notification", error: r2.error });

        // 3. Settlement Confirmation
        const r3 = await sendSettlementConfirmation(email, {
            creditorName: "Lorenzo",
            debtorName: "John Doe",
            amount: 500,
            currency: "PHP",
            paymentMethod: "CASH",
            expenseDescription: "Coffee Run",
            teamName: "PayUp Team",
            settlementId: "SET-456-TEST"
        });
        if (r3.success) results.push("Settlement Confirmation");
        else errors.push({ type: "Settlement Confirmation", error: r3.error });

        // 4. Payment Reminder (Overdue)
        const r4 = await sendPaymentReminder(email, {
            recipientName: "Lorenzo",
            creditorName: "Sarah Smith",
            amount: 250,
            currency: "PHP",
            expenseDescription: "Shared Uber",
            teamName: "PayUp Team",
            daysOverdue: 5,
            deadline: "Dec 10, 2025"
        });
        if (r4.success) results.push("Payment Reminder");
        else errors.push({ type: "Payment Reminder", error: r4.error });

        // 5. Team Invite
        const r5 = await sendTeamInvite(email, {
            inviterName: "Lorenzo's Friend",
            teamName: "Weekend Trip Squad",
            teamCode: "TRIP2025"
        });
        if (r5.success) results.push("Team Invite");
        else errors.push({ type: "Team Invite", error: r5.error });

        return NextResponse.json({
            success: errors.length === 0,
            sent_count: results.length,
            sent_types: results,
            errors: errors.map(e => ({
                type: e.type,
                error: e.error instanceof Error ? e.error.message : String(e.error)
            })),
            env_check: { apiKeyPresent }
        }, { status: errors.length > 0 ? 400 : 200 });

    } catch (error) {
        console.error("Test email error:", error);
        return NextResponse.json({
            success: false,
            error: String(error)
        }, { status: 500 });
    }
}
