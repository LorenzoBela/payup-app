"use client";

import Link from "next/link";
import { DollarSign, ArrowLeft, FileText, Users, AlertTriangle, Scale, RefreshCw, Gavel } from "lucide-react";
import { motion } from "framer-motion";

export default function TermsPage() {
    const sections = [
        {
            icon: Users,
            title: "Account Terms",
            content: [
                "You must be at least 13 years old to use PayUp",
                "You are responsible for maintaining the security of your account",
                "You must provide accurate and complete information during registration",
                "One person or entity may not maintain multiple free accounts",
                "You are responsible for all activity that occurs under your account"
            ]
        },
        {
            icon: FileText,
            title: "Acceptable Use",
            content: [
                "Use PayUp only for legitimate expense tracking purposes",
                "Do not use the service for any illegal or unauthorized purpose",
                "Do not attempt to access other users' data without permission",
                "Do not transmit any malicious code or interfere with the service",
                "Respect the intellectual property rights of PayUp and others"
            ]
        },
        {
            icon: Scale,
            title: "Service Terms",
            content: [
                "PayUp is provided 'as is' without warranty of any kind",
                "We reserve the right to modify or discontinue the service at any time",
                "We may impose limits on certain features or restrict access",
                "You grant us a license to use content you upload for service purposes",
                "We do not guarantee the accuracy of expense calculations"
            ]
        },
        {
            icon: AlertTriangle,
            title: "Limitations of Liability",
            content: [
                "PayUp is not liable for any indirect, incidental, or consequential damages",
                "Our liability is limited to the amount you paid for the service, if any",
                "We are not responsible for disputes between team members",
                "You use the service at your own risk",
                "We do not guarantee uninterrupted or error-free service"
            ]
        },
        {
            icon: RefreshCw,
            title: "Cancellation and Termination",
            content: [
                "You may cancel your account at any time through your account settings",
                "Upon cancellation, your data will be deleted within 30 days",
                "We may suspend or terminate accounts that violate these terms",
                "Termination does not affect any rights accrued prior to termination",
                "Some provisions of these terms survive termination"
            ]
        },
        {
            icon: Gavel,
            title: "Dispute Resolution",
            content: [
                "These terms are governed by applicable local laws",
                "Disputes will be resolved through binding arbitration when possible",
                "You waive the right to participate in class action lawsuits",
                "Claims must be brought within one year of the cause of action",
                "The prevailing party may recover reasonable attorney's fees"
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: "circOut" }}
                className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-md"
            >
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="bg-primary p-1.5 rounded-lg group-hover:scale-105 transition-transform">
                            <DollarSign className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">PayUp</span>
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </motion.header>

            {/* Main Content */}
            <main className="pt-32 pb-20 px-6">
                <div className="container mx-auto max-w-4xl">
                    {/* Hero */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center justify-center bg-secondary/50 w-16 h-16 rounded-2xl mb-6">
                            <FileText className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Terms of Service</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            By using PayUp, you agree to these terms. Please read them carefully before creating an account.
                        </p>
                        <p className="text-sm text-muted-foreground mt-4">
                            Last updated: December 2025
                        </p>
                    </motion.div>

                    {/* Introduction */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="p-8 rounded-3xl bg-secondary/20 border border-white/5 mb-8"
                    >
                        <p className="text-muted-foreground leading-relaxed">
                            Welcome to PayUp! These Terms of Service (&quot;Terms&quot;) govern your use of our expense tracking
                            application and related services. By accessing or using PayUp, you agree to be bound by these
                            Terms and our Privacy Policy. If you do not agree to these Terms, please do not use our service.
                        </p>
                    </motion.div>

                    {/* Sections */}
                    <div className="space-y-8">
                        {sections.map((section, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="p-8 rounded-3xl bg-card border border-white/5 hover:border-primary/10 transition-colors"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="bg-secondary/50 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                                        <section.icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-xl font-bold mb-4">{section.title}</h2>
                                        <ul className="space-y-3">
                                            {section.content.map((item, itemIndex) => (
                                                <li key={itemIndex} className="flex items-start gap-3 text-muted-foreground">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                                    <span className="leading-relaxed">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Contact */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="mt-12 p-8 rounded-3xl bg-secondary/20 border border-white/5 text-center"
                    >
                        <h2 className="text-xl font-bold mb-3">Questions About Our Terms?</h2>
                        <p className="text-muted-foreground mb-4">
                            If you have any questions about these Terms of Service, we&apos;re here to help.
                        </p>
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
                        >
                            Contact Us <ArrowLeft className="w-4 h-4 rotate-180" />
                        </Link>
                    </motion.div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 py-12 bg-background">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary p-1.5 rounded-lg">
                                <DollarSign className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <span className="text-lg font-bold tracking-tight">PayUp</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            © 2025 PayUp. Built for thesis teams.
                        </p>
                        <div className="flex gap-8">
                            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                Privacy
                            </Link>
                            <Link href="/terms" className="text-sm text-foreground font-medium transition-colors">
                                Terms
                            </Link>
                            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                Contact
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
