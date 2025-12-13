import { resend } from "@/lib/resend";
import { PaymentReceiptEmail } from "./templates/payment-receipt";
import { ExpenseNotificationEmail } from "./templates/expense-notification";
import { SettlementConfirmationEmail } from "./templates/settlement-confirmation";
import { PaymentReminderEmail } from "./templates/payment-reminder";
import { TeamInviteEmail } from "./templates/team-invite";

// Email sender configuration
const FROM_EMAIL = "PayUp <noreply@resend.dev>"; // Use your verified domain in production

// =============================================================================
// Type Definitions
// =============================================================================

export interface PaymentReceiptData {
    recipientName: string;
    payerName: string;
    amount: number;
    currency: string;
    paymentMethod: "CASH" | "GCASH";
    expenseDescription: string;
    teamName: string;
    paidAt: string;
    transactionId?: string;
}

export interface ExpenseNotificationData {
    recipientName: string;
    creatorName: string;
    expenseDescription: string;
    totalAmount: number;
    yourShare: number;
    currency: string;
    category: string;
    teamName: string;
    memberCount: number;
    deadline?: string;
}

export interface SettlementConfirmationData {
    creditorName: string;
    debtorName: string;
    amount: number;
    currency: string;
    paymentMethod: "CASH" | "GCASH";
    expenseDescription: string;
    teamName: string;
    proofUrl?: string;
    settlementId: string;
}

export interface PaymentReminderData {
    recipientName: string;
    creditorName: string;
    amount: number;
    currency: string;
    expenseDescription: string;
    teamName: string;
    daysOverdue?: number;
    deadline?: string;
    pendingCount?: number;
}

export interface TeamInviteData {
    recipientName?: string;
    inviterName: string;
    teamName: string;
    teamCode: string;
    memberCount?: number;
}

// =============================================================================
// Email Sending Functions
// =============================================================================

/**
 * Send a payment receipt email to the creditor when a settlement is verified
 */
export async function sendPaymentReceipt(to: string, data: PaymentReceiptData) {
    try {
        const { error } = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject: `Payment Received: ₱${data.amount.toLocaleString()} from ${data.payerName}`,
            react: PaymentReceiptEmail(data),
        });

        if (error) {
            console.error("Failed to send payment receipt email:", error);
            return { success: false, error };
        }

        return { success: true };
    } catch (error) {
        console.error("Error sending payment receipt email:", error);
        return { success: false, error };
    }
}

/**
 * Send expense notification email to team members when added to a new expense
 */
export async function sendExpenseNotification(
    to: string,
    data: ExpenseNotificationData
) {
    try {
        const { error } = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject: `New Expense: ${data.expenseDescription} - Your share: ₱${data.yourShare.toLocaleString()}`,
            react: ExpenseNotificationEmail(data),
        });

        if (error) {
            console.error("Failed to send expense notification email:", error);
            return { success: false, error };
        }

        return { success: true };
    } catch (error) {
        console.error("Error sending expense notification email:", error);
        return { success: false, error };
    }
}

/**
 * Send settlement confirmation email to creditor when debtor marks payment as complete
 */
export async function sendSettlementConfirmation(
    to: string,
    data: SettlementConfirmationData
) {
    try {
        const { error } = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject: `Verify Payment: ₱${data.amount.toLocaleString()} from ${data.debtorName}`,
            react: SettlementConfirmationEmail(data),
        });

        if (error) {
            console.error("Failed to send settlement confirmation email:", error);
            return { success: false, error };
        }

        return { success: true };
    } catch (error) {
        console.error("Error sending settlement confirmation email:", error);
        return { success: false, error };
    }
}

/**
 * Send payment reminder email to debtors with pending settlements
 */
export async function sendPaymentReminder(
    to: string,
    data: PaymentReminderData
) {
    try {
        const isOverdue = data.daysOverdue && data.daysOverdue > 0;
        const subject = isOverdue
            ? `⚠️ Overdue: ₱${data.amount.toLocaleString()} payment to ${data.creditorName}`
            : `Reminder: ₱${data.amount.toLocaleString()} pending to ${data.creditorName}`;

        const { error } = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject,
            react: PaymentReminderEmail(data),
        });

        if (error) {
            console.error("Failed to send payment reminder email:", error);
            return { success: false, error };
        }

        return { success: true };
    } catch (error) {
        console.error("Error sending payment reminder email:", error);
        return { success: false, error };
    }
}

/**
 * Send team invite email to new members
 */
export async function sendTeamInvite(to: string, data: TeamInviteData) {
    try {
        const { error } = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject: `${data.inviterName} invited you to join ${data.teamName} on PayUp`,
            react: TeamInviteEmail(data),
        });

        if (error) {
            console.error("Failed to send team invite email:", error);
            return { success: false, error };
        }

        return { success: true };
    } catch (error) {
        console.error("Error sending team invite email:", error);
        return { success: false, error };
    }
}

/**
 * Send notification emails to multiple recipients for a new expense
 */
export async function sendBulkExpenseNotifications(
    recipients: Array<{ email: string; name: string; share: number }>,
    baseData: Omit<ExpenseNotificationData, "recipientName" | "yourShare">
) {
    const results = await Promise.allSettled(
        recipients.map((recipient) =>
            sendExpenseNotification(recipient.email, {
                ...baseData,
                recipientName: recipient.name,
                yourShare: recipient.share,
            })
        )
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return { successful, failed, total: recipients.length };
}
