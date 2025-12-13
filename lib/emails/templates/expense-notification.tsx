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

interface ExpenseNotificationProps {
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

export const ExpenseNotificationEmail = ({
    recipientName = "John",
    creatorName = "Jane Doe",
    expenseDescription = "Team Lunch at Jollibee",
    totalAmount = 2500,
    yourShare = 500,
    currency = "PHP",
    category = "Food & Dining",
    teamName = "Office Squad",
    memberCount = 5,
    deadline,
}: ExpenseNotificationProps) => {
    const formattedTotal = new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: currency,
    }).format(totalAmount);

    const formattedShare = new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: currency,
    }).format(yourShare);

    return (
        <BaseLayout preview={`New expense: ${expenseDescription} - Your share: ${formattedShare}`}>
            {/* Icon */}
            <Section style={iconSection}>
                <div style={expenseIcon}>
                    <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            </Section>

            <Heading style={heading}>New Expense Added</Heading>

            <Text style={greeting}>
                Hi {recipientName},
            </Text>

            <Text style={paragraph}>
                <strong>{creatorName}</strong> added a new expense in <strong>{teamName}</strong> and
                you&apos;ve been included in the split.
            </Text>

            {/* Expense Card */}
            <Section style={expenseCard}>
                <div style={categoryBadge}>{category}</div>
                <Text style={expenseTitle}>{expenseDescription}</Text>

                <Row style={amountRow}>
                    <Column style={amountColumn}>
                        <Text style={amountLabel}>Total</Text>
                        <Text style={totalValue}>{formattedTotal}</Text>
                    </Column>
                    <Column style={dividerColumn}>
                        <div style={divider} />
                    </Column>
                    <Column style={amountColumn}>
                        <Text style={amountLabel}>Your Share</Text>
                        <Text style={shareValue}>{formattedShare}</Text>
                    </Column>
                </Row>
            </Section>

            {/* Details */}
            <Section style={detailsSection}>
                <Row style={detailRow}>
                    <Column style={detailLabel}>Split between</Column>
                    <Column style={detailValue}>{memberCount} members</Column>
                </Row>
                <Row style={detailRow}>
                    <Column style={detailLabel}>Created by</Column>
                    <Column style={detailValue}>{creatorName}</Column>
                </Row>
                {deadline && (
                    <Row style={detailRow}>
                        <Column style={detailLabel}>Due by</Column>
                        <Column style={detailValueHighlight}>{deadline}</Column>
                    </Row>
                )}
            </Section>

            <Button style={button} href="https://payup.vercel.app/dashboard/payments">
                Pay Now
            </Button>

            <Text style={footerNote}>
                You can mark this as paid once you&apos;ve sent the payment.
            </Text>
        </BaseLayout>
    );
};

// Styles
const iconSection = {
    textAlign: "center" as const,
    marginBottom: "16px",
};

const expenseIcon = {
    width: "56px",
    height: "56px",
    backgroundColor: "#6366f1",
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

const expenseCard = {
    backgroundColor: "#faf5ff",
    borderRadius: "12px",
    padding: "24px",
    textAlign: "center" as const,
    margin: "24px 0",
    border: "1px solid #e9d5ff",
};

const categoryBadge = {
    display: "inline-block",
    backgroundColor: "#a855f7",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: "600",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    padding: "4px 12px",
    borderRadius: "12px",
    marginBottom: "12px",
};

const expenseTitle = {
    color: "#1f2937",
    fontSize: "18px",
    fontWeight: "600",
    margin: "0 0 20px",
};

const amountRow = {
    width: "100%",
};

const amountColumn = {
    width: "45%",
    textAlign: "center" as const,
};

const dividerColumn = {
    width: "10%",
    textAlign: "center" as const,
};

const divider = {
    width: "1px",
    height: "50px",
    backgroundColor: "#e9d5ff",
    margin: "0 auto",
};

const amountLabel = {
    color: "#7c3aed",
    fontSize: "12px",
    fontWeight: "500",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    margin: "0 0 4px",
};

const totalValue = {
    color: "#6b7280",
    fontSize: "20px",
    fontWeight: "600",
    margin: "0",
};

const shareValue = {
    color: "#7c3aed",
    fontSize: "24px",
    fontWeight: "700",
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

const footerNote = {
    color: "#9ca3af",
    fontSize: "12px",
    textAlign: "center" as const,
    margin: "24px 0 0",
};

export default ExpenseNotificationEmail;
