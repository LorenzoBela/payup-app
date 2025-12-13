import {
    Body,
    Container,
    Head,
    Html,
    Preview,
    Section,
    Text,
    Hr,
    Font,
} from "@react-email/components";
import * as React from "react";

interface BaseLayoutProps {
    preview: string;
    children: React.ReactNode;
}

export const BaseLayout = ({ preview, children }: BaseLayoutProps) => (
    <Html>
        <Head>
            <Font
                fontFamily="Inter"
                fallbackFontFamily="Arial"
                webFont={{
                    url: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2",
                    format: "woff2",
                }}
                fontWeight={400}
                fontStyle="normal"
            />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta name="x-apple-disable-message-reformatting" />
            <meta name="format-detection" content="telephone=no, address=no, email=no, date=no" />
            <style>
                {`
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; padding: 16px !important; }
            .content { padding: 0 20px !important; }
            .header { padding: 24px 20px 16px !important; }
            .button { width: 100% !important; box-sizing: border-box !important; }
            .amount-text { font-size: 28px !important; }
            .detail-table { font-size: 13px !important; }
          }
        `}
            </style>
        </Head>
        <Preview>{preview}</Preview>
        <Body style={main}>
            <Container style={container} className="container">
                {/* Header */}
                <Section style={header} className="header">
                    <table cellPadding="0" cellSpacing="0" border={0} style={{ margin: "0 auto" }}>
                        <tbody>
                            <tr>
                                <td style={logoIcon}>
                                    <table cellPadding="0" cellSpacing="0" border={0}>
                                        <tbody>
                                            <tr>
                                                <td style={{ lineHeight: 0 }}>
                                                    <img
                                                        src="https://img.icons8.com/fluency/48/layers.png"
                                                        alt="PayUp"
                                                        width="24"
                                                        height="24"
                                                        style={{ display: "block" }}
                                                    />
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                                <td style={{ paddingLeft: "8px" }}>
                                    <Text style={logoText}>PayUp</Text>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </Section>

                {/* Content */}
                <Section style={content} className="content">
                    {children}
                </Section>

                {/* Footer */}
                <Hr style={hr} />
                <Section style={footer}>
                    <Text style={footerText}>
                        © {new Date().getFullYear()} PayUp. All rights reserved.
                    </Text>
                    <Text style={footerSubText}>
                        Making expense sharing simple and transparent.
                    </Text>
                </Section>
            </Container>
        </Body>
    </Html>
);

// Styles - Using inline styles for maximum Gmail compatibility
const main = {
    backgroundColor: "#f6f9fc",
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    padding: "40px 0",
};

const container = {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "0",
    maxWidth: "600px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
};

const header = {
    padding: "32px 40px 24px",
    textAlign: "center" as const,
};

const logoIcon = {
    backgroundColor: "#000000",
    borderRadius: "8px",
    padding: "8px",
    verticalAlign: "middle",
};

const logoText = {
    fontSize: "22px",
    fontWeight: "700",
    color: "#000000",
    margin: "0",
    letterSpacing: "-0.5px",
    verticalAlign: "middle",
};

const content = {
    padding: "0 40px 32px",
};

const hr = {
    borderColor: "#e6ebf1",
    margin: "0 40px",
};

const footer = {
    padding: "24px 40px 32px",
    textAlign: "center" as const,
};

const footerText = {
    color: "#8898aa",
    fontSize: "12px",
    lineHeight: "16px",
    margin: "0",
};

const footerSubText = {
    color: "#aab7c4",
    fontSize: "11px",
    lineHeight: "16px",
    margin: "8px 0 0",
};

export default BaseLayout;
