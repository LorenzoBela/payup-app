// Email Templates
export { BaseLayout } from "./templates/base-layout";
export { PaymentReceiptEmail } from "./templates/payment-receipt";
export { ExpenseNotificationEmail } from "./templates/expense-notification";
export { SettlementConfirmationEmail } from "./templates/settlement-confirmation";
export { PaymentReminderEmail } from "./templates/payment-reminder";
export { TeamInviteEmail } from "./templates/team-invite";

// Email Sending Functions
export {
    sendPaymentReceipt,
    sendExpenseNotification,
    sendSettlementConfirmation,
    sendPaymentReminder,
    sendTeamInvite,
    sendBulkExpenseNotifications,
} from "./send";

// Types
export type {
    PaymentReceiptData,
    ExpenseNotificationData,
    SettlementConfirmationData,
    PaymentReminderData,
    TeamInviteData,
} from "./send";
