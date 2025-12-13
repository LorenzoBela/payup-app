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

interface PaymentReceiptProps {
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

export const PaymentReceiptEmail = ({
    recipientName = "John",
    payerName = "Jane Doe",
    amount = 500,
    currency = "PHP",
    paymentMethod = "GCASH",
    expenseDescription = "Team Lunch",
    teamName = "Office Squad",
    paidAt = "December 13, 2025",
    transactionId = "TXN-123456",
}: PaymentReceiptProps) => {
    const formattedAmount = new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: currency,
    }).format(amount);

    return (
        <BaseLayout preview={`Payment of ${formattedAmount} received from ${payerName}`}>
            {/* Success Icon */}
            <Section style={iconSection}>
                <div style={successIcon}>
                    <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M20 6L9 17L4 12"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            </Section>

            <Heading style={heading}>Payment Received!</Heading>

            <Text style={greeting}>
                Hi {recipientName},
            </Text>

            <Text style={paragraph}>
                Great news! <strong>{payerName}</strong> has paid their share for{" "}
                <strong>{expenseDescription}</strong>.
            </Text>

            {/* Amount Card */}
            <Section style={amountCard}>
                <Text style={amountLabel}>Amount Received</Text>
                <Text style={amountValue}>{formattedAmount}</Text>
                <div style={methodBadge}>
                    {paymentMethod === "GCASH" ? "💳 GCash" : "💵 Cash"}
                </div>
            </Section>

            {/* Details */}
            <Section style={detailsSection}>
                <Row style={detailRow}>
                    <Column style={detailLabel}>Team</Column>
                    <Column style={detailValue}>{teamName}</Column>
                </Row>
                <Row style={detailRow}>
                    <Column style={detailLabel}>Expense</Column>
                    <Column style={detailValue}>{expenseDescription}</Column>
                </Row>
                <Row style={detailRow}>
                    <Column style={detailLabel}>Paid On</Column>
                    <Column style={detailValue}>{paidAt}</Column>
                </Row>
                {transactionId && (
                    <Row style={detailRow}>
                        <Column style={detailLabel}>Reference</Column>
                        <Column style={detailValueMono}>{transactionId}</Column>
                    </Row>
                )}
            </Section>

            <Button style={button} href="https://payup.vercel.app/dashboard">
                View Dashboard
            </Button>

            <Text style={footerNote}>
                This is an automated receipt from PayUp. Keep this for your records.
            </Text>
        </BaseLayout>
    );
};

// Styles
const iconSection = {
    textAlign: "center" as const,
    marginBottom: "16px",
};

const successIcon = {
    width: "64px",
    height: "64px",
    backgroundColor: "#10b981",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
};

const heading = {
    color: "#1a1a1a",
    fontSize: "28px",
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
    backgroundColor: "#f0fdf4",
    borderRadius: "12px",
    padding: "24px",
    textAlign: "center" as const,
    margin: "24px 0",
    border: "1px solid #bbf7d0",
};

const amountLabel = {
    color: "#059669",
    fontSize: "13px",
    fontWeight: "600",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    margin: "0 0 8px",
};

const amountValue = {
    color: "#047857",
    fontSize: "36px",
    fontWeight: "700",
    margin: "0 0 12px",
    letterSpacing: "-1px",
};

const methodBadge = {
    display: "inline-block",
    backgroundColor: "#ffffff",
    color: "#374151",
    fontSize: "14px",
    fontWeight: "500",
    padding: "6px 16px",
    borderRadius: "20px",
    border: "1px solid #d1fae5",
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

const detailValueMono = {
    color: "#1f2937",
    fontSize: "13px",
    fontFamily: "monospace",
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

const footerNote = {
    color: "#9ca3af",
    fontSize: "12px",
    textAlign: "center" as const,
    margin: "24px 0 0",
};

export default PaymentReceiptEmail;
