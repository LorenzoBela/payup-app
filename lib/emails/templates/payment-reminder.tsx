import {
    Button,
    Column,
    Heading,
    Row,
    Section,
    Text,
} from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./base-layout";

interface PaymentReminderProps {
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

export const PaymentReminderEmail = ({
    recipientName = "John",
    creditorName = "Jane Doe",
    amount = 500,
    currency = "PHP",
    expenseDescription = "Team Lunch",
    teamName = "Office Squad",
    daysOverdue = 3,
    deadline = "December 15, 2025",
    pendingCount = 1,
}: PaymentReminderProps) => {
    const formattedAmount = new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: currency,
    }).format(amount);

    const isOverdue = daysOverdue && daysOverdue > 0;
    const isUrgent = daysOverdue && daysOverdue >= 7;

    return (
        <BaseLayout preview={`Reminder: ${formattedAmount} pending payment to ${creditorName}`}>
            {/* Icon */}
            <Section style={iconSection}>
                <div style={isUrgent ? urgentIcon : reminderIcon}>
                    <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M13.73 21a2 2 0 0 1-3.46 0"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            </Section>

            <Heading style={heading}>
                {isUrgent ? "⚠️ Payment Overdue" : "Payment Reminder"}
            </Heading>

            <Text style={greeting}>
                Hi {recipientName},
            </Text>

            <Text style={paragraph}>
                {isOverdue ? (
                    <>
                        Your payment to <strong>{creditorName}</strong> for{" "}
                        <strong>{expenseDescription}</strong> is now{" "}
                        <strong style={{ color: "#dc2626" }}>{daysOverdue} days overdue</strong>.
                        Please settle this as soon as possible.
                    </>
                ) : (
                    <>
                        Just a friendly reminder that you have a pending payment to{" "}
                        <strong>{creditorName}</strong> for <strong>{expenseDescription}</strong>.
                    </>
                )}
            </Text>

            {/* Amount Card */}
            <Section style={isOverdue ? overdueCard : amountCard}>
                <Text style={isOverdue ? overdueBadge : dueBadge}>
                    {isOverdue ? `${daysOverdue} Days Overdue` : "Amount Due"}
                </Text>
                <Text style={isOverdue ? overdueValue : amountValue}>{formattedAmount}</Text>
                {deadline && (
                    <Text style={deadlineText}>
                        {isOverdue ? `Was due: ${deadline}` : `Due by: ${deadline}`}
                    </Text>
                )}
            </Section>

            {/* Details */}
            <Section style={detailsSection}>
                <Row style={detailRow}>
                    <Column style={detailLabel}>Pay to</Column>
                    <Column style={detailValue}>{creditorName}</Column>
                </Row>
                <Row style={detailRow}>
                    <Column style={detailLabel}>Team</Column>
                    <Column style={detailValue}>{teamName}</Column>
                </Row>
                <Row style={detailRow}>
                    <Column style={detailLabel}>Expense</Column>
                    <Column style={detailValue}>{expenseDescription}</Column>
                </Row>
                {pendingCount && pendingCount > 1 && (
                    <Row style={detailRow}>
                        <Column style={detailLabel}>Total Pending</Column>
                        <Column style={detailValueHighlight}>{pendingCount} payments</Column>
                    </Row>
                )}
            </Section>

            <Button style={isOverdue ? urgentButton : button} href="https://payup.vercel.app/dashboard/payments">
                Pay Now
            </Button>

            <Text style={footerNote}>
                Once you&apos;ve made the payment, mark it as paid in PayUp so {creditorName} can verify.
            </Text>
        </BaseLayout>
    );
};

// Styles
const iconSection = {
    textAlign: "center" as const,
    marginBottom: "16px",
};

const reminderIcon = {
    width: "56px",
    height: "56px",
    backgroundColor: "#3b82f6",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
};

const urgentIcon = {
    width: "56px",
    height: "56px",
    backgroundColor: "#dc2626",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
};

const heading = {
    color: "#1a1a1a",
    fontSize: "26px",
    fontWeight: "700",
    textAlign: "center" as const,
    margin: "16px 0",
    letterSpacing: "-0.5px",
};

const greeting = {
    color: "#374151",
    fontSize: "16px",
    lineHeight: "24px",
    margin: "24px 0 8px",
};

const paragraph = {
    color: "#4b5563",
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0 0 24px",
};

const amountCard = {
    backgroundColor: "#eff6ff",
    borderRadius: "12px",
    padding: "24px",
    textAlign: "center" as const,
    margin: "24px 0",
    border: "1px solid #bfdbfe",
};

const overdueCard = {
    backgroundColor: "#fef2f2",
    borderRadius: "12px",
    padding: "24px",
    textAlign: "center" as const,
    margin: "24px 0",
    border: "1px solid #fecaca",
};

const dueBadge = {
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    margin: "0 0 8px",
};

const overdueBadge = {
    color: "#dc2626",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    margin: "0 0 8px",
};

const amountValue = {
    color: "#1d4ed8",
    fontSize: "36px",
    fontWeight: "700",
    margin: "0 0 8px",
    letterSpacing: "-1px",
};

const overdueValue = {
    color: "#dc2626",
    fontSize: "36px",
    fontWeight: "700",
    margin: "0 0 8px",
    letterSpacing: "-1px",
};

const deadlineText = {
    color: "#6b7280",
    fontSize: "13px",
    margin: "0",
};

const detailsSection = {
    backgroundColor: "#f9fafb",
    borderRadius: "12px",
    padding: "20px 24px",
    margin: "24px 0",
};

const detailRow = {
    marginBottom: "12px",
};

const detailLabel = {
    color: "#6b7280",
    fontSize: "14px",
    width: "120px",
};

const detailValue = {
    color: "#1f2937",
    fontSize: "14px",
    fontWeight: "500",
    textAlign: "right" as const,
};

const detailValueHighlight = {
    color: "#dc2626",
    fontSize: "14px",
    fontWeight: "600",
    textAlign: "right" as const,
};

const button = {
    backgroundColor: "#000000",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "600",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    padding: "14px 24px",
    margin: "32px 0",
};

const urgentButton = {
    backgroundColor: "#dc2626",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "600",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    padding: "14px 24px",
    margin: "32px 0",
};

const footerNote = {
    color: "#9ca3af",
    fontSize: "12px",
    textAlign: "center" as const,
    margin: "24px 0 0",
};

export default PaymentReminderEmail;
