import {
    Button,
    Column,
    Heading,
    Row,
    Section,
    Text,
    Img,
} from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./base-layout";

interface SettlementConfirmationProps {
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

export const SettlementConfirmationEmail = ({
    creditorName = "John",
    debtorName = "Jane Doe",
    amount = 500,
    currency = "PHP",
    paymentMethod = "GCASH",
    expenseDescription = "Team Lunch",
    teamName = "Office Squad",
    proofUrl,
    settlementId = "stl_abc123",
}: SettlementConfirmationProps) => {
    const formattedAmount = new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: currency,
    }).format(amount);

    return (
        <BaseLayout preview={`${debtorName} marked payment of ${formattedAmount} - Verify now`}>
            {/* Icon */}
            <Section style={iconSection}>
                <div style={pendingIcon}>
                    <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2.5" />
                        <path
                            d="M12 6v6l4 2"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            </Section>

            <Heading style={heading}>Payment Pending Verification</Heading>

            <Text style={greeting}>
                Hi {creditorName},
            </Text>

            <Text style={paragraph}>
                <strong>{debtorName}</strong> has marked their payment as complete for{" "}
                <strong>{expenseDescription}</strong>. Please verify if you&apos;ve received the payment.
            </Text>

            {/* Amount Card */}
            <Section style={amountCard}>
                <Text style={amountLabel}>Amount to Verify</Text>
                <Text style={amountValue}>{formattedAmount}</Text>
                <div style={methodBadge}>
                    {paymentMethod === "GCASH" ? "💳 GCash" : "💵 Cash"}
                </div>
            </Section>

            {/* Proof Image (if GCash) */}
            {proofUrl && (
                <Section style={proofSection}>
                    <Text style={proofLabel}>Payment Proof Attached</Text>
                    <Img
                        src={proofUrl}
                        alt="Payment proof"
                        style={proofImage}
                    />
                </Section>
            )}

            {/* Details */}
            <Section style={detailsSection}>
                <Row style={detailRow}>
                    <Column style={detailLabel}>From</Column>
                    <Column style={detailValue}>{debtorName}</Column>
                </Row>
                <Row style={detailRow}>
                    <Column style={detailLabel}>Team</Column>
                    <Column style={detailValue}>{teamName}</Column>
                </Row>
                <Row style={detailRow}>
                    <Column style={detailLabel}>Expense</Column>
                    <Column style={detailValue}>{expenseDescription}</Column>
                </Row>
                <Row style={detailRow}>
                    <Column style={detailLabel}>Reference</Column>
                    <Column style={detailValueMono}>{settlementId}</Column>
                </Row>
            </Section>

            {/* Action Buttons */}
            <Section style={buttonSection}>
                <Row>
                    <Column style={buttonColumn}>
                        <Button
                            style={verifyButton}
                            href={`https://payup.vercel.app/dashboard/receipts`}
                        >
                            ✓ Verify Payment
                        </Button>
                    </Column>
                    <Column style={buttonColumn}>
                        <Button
                            style={rejectButton}
                            href={`https://payup.vercel.app/dashboard/receipts`}
                        >
                            ✗ Not Received
                        </Button>
                    </Column>
                </Row>
            </Section>

            <Text style={footerNote}>
                If you don&apos;t recognize this payment, please reject it and contact the sender.
            </Text>
        </BaseLayout>
    );
};

// Styles
const iconSection = {
    textAlign: "center" as const,
    marginBottom: "16px",
};

const pendingIcon = {
    width: "56px",
    height: "56px",
    backgroundColor: "#f59e0b",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
};

const heading = {
    color: "#1a1a1a",
    fontSize: "24px",
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
    backgroundColor: "#fffbeb",
    borderRadius: "12px",
    padding: "24px",
    textAlign: "center" as const,
    margin: "24px 0",
    border: "1px solid #fde68a",
};

const amountLabel = {
    color: "#b45309",
    fontSize: "13px",
    fontWeight: "600",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    margin: "0 0 8px",
};

const amountValue = {
    color: "#92400e",
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
    border: "1px solid #fde68a",
};

const proofSection = {
    margin: "24px 0",
    textAlign: "center" as const,
};

const proofLabel = {
    color: "#6b7280",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    marginBottom: "12px",
};

const proofImage = {
    maxWidth: "100%",
    height: "auto",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
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
    width: "100px",
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

const buttonSection = {
    margin: "32px 0",
};

const buttonColumn = {
    width: "50%",
    padding: "0 4px",
};

const verifyButton = {
    backgroundColor: "#10b981",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "600",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    padding: "12px 16px",
    width: "100%",
};

const rejectButton = {
    backgroundColor: "#ef4444",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "600",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    padding: "12px 16px",
    width: "100%",
};

const footerNote = {
    color: "#9ca3af",
    fontSize: "12px",
    textAlign: "center" as const,
    margin: "24px 0 0",
};

export default SettlementConfirmationEmail;
