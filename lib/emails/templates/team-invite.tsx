import {
    Button,
    Heading,
    Section,
    Text,
} from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./base-layout";

interface TeamInviteProps {
    recipientName?: string;
    inviterName: string;
    teamName: string;
    teamCode: string;
    memberCount?: number;
}

export const TeamInviteEmail = ({
    recipientName,
    inviterName = "Jane Doe",
    teamName = "Office Squad",
    teamCode = "SQUAD123",
    memberCount = 5,
}: TeamInviteProps) => {
    return (
        <BaseLayout preview={`${inviterName} invited you to join ${teamName} on PayUp`}>
            {/* Icon */}
            <Section style={iconSection}>
                <div style={inviteIcon}>
                    <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <circle
                            cx="9"
                            cy="7"
                            r="4"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M23 21v-2a4 4 0 0 0-3-3.87"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M16 3.13a4 4 0 0 1 0 7.75"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            </Section>

            <Heading style={heading}>You&apos;re Invited! 🎉</Heading>

            <Text style={greeting}>
                {recipientName ? `Hi ${recipientName},` : "Hey there,"}
            </Text>

            <Text style={paragraph}>
                <strong>{inviterName}</strong> has invited you to join their team on PayUp -
                the easiest way to split expenses and track shared payments.
            </Text>

            {/* Team Card */}
            <Section style={teamCard}>
                <Text style={teamLabel}>Team</Text>
                <Text style={teamName_}>{teamName}</Text>

                <div style={codeContainer}>
                    <Text style={codeLabel}>Use this code to join</Text>
                    <Text style={codeValue}>{teamCode}</Text>
                </div>

                {memberCount && (
                    <Text style={memberText}>
                        👥 {memberCount} {memberCount === 1 ? "member" : "members"} already in the team
                    </Text>
                )}
            </Section>

            {/* Features */}
            <Section style={featuresSection}>
                <Text style={featuresTitle}>What you can do with PayUp:</Text>
                <Text style={featureItem}>✓ Split expenses fairly among team members</Text>
                <Text style={featureItem}>✓ Track who owes what in real-time</Text>
                <Text style={featureItem}>✓ Settle payments with GCash or Cash</Text>
                <Text style={featureItem}>✓ Get automatic payment reminders</Text>
            </Section>

            <Button style={button} href="https://payup.vercel.app/team/join">
                Join {teamName}
            </Button>

            <Text style={footerNote}>
                Don&apos;t have a PayUp account yet? No worries - you can create one when you join!
            </Text>
        </BaseLayout>
    );
};

// Styles
const iconSection = {
    textAlign: "center" as const,
    marginBottom: "16px",
};

const inviteIcon = {
    width: "56px",
    height: "56px",
    backgroundColor: "#8b5cf6",
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

const teamCard = {
    background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
    borderRadius: "16px",
    padding: "32px 24px",
    textAlign: "center" as const,
    margin: "24px 0",
};

const teamLabel = {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
    margin: "0 0 4px",
};

const teamName_ = {
    color: "#ffffff",
    fontSize: "28px",
    fontWeight: "700",
    margin: "0 0 24px",
    letterSpacing: "-0.5px",
};

const codeContainer = {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "16px",
};

const codeLabel = {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: "11px",
    fontWeight: "500",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    margin: "0 0 8px",
};

const codeValue = {
    color: "#ffffff",
    fontSize: "24px",
    fontWeight: "700",
    letterSpacing: "4px",
    fontFamily: "monospace",
    margin: "0",
};

const memberText = {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: "14px",
    margin: "0",
};

const featuresSection = {
    backgroundColor: "#f9fafb",
    borderRadius: "12px",
    padding: "20px 24px",
    margin: "24px 0",
};

const featuresTitle = {
    color: "#1f2937",
    fontSize: "14px",
    fontWeight: "600",
    margin: "0 0 12px",
};

const featureItem = {
    color: "#4b5563",
    fontSize: "14px",
    lineHeight: "20px",
    margin: "8px 0",
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

export default TeamInviteEmail;
