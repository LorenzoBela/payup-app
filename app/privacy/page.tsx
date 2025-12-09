"use client";

import Link from "next/link";
import { DollarSign, ArrowLeft, Shield, Eye, Lock, Database, UserCheck, Bell } from "lucide-react";
import { motion } from "framer-motion";

export default function PrivacyPage() {
    const fadeInUp = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 }
    };

    const sections = [
        {
            icon: Eye,
            title: "Information We Collect",
            content: [
                "Account information (name, email address) when you sign up",
                "Profile information you choose to provide",
                "Expense data you enter into the application",
                "Team and group membership information",
                "Usage analytics to improve our service"
            ]
        },
        {
            icon: Database,
            title: "How We Use Your Information",
            content: [
                "To provide and maintain the PayUp service",
                "To calculate expense splits and balances",
                "To send you notifications about your account",
                "To improve and personalize your experience",
                "To communicate with you about updates and features"
            ]
        },
        {
            icon: Lock,
            title: "Data Security",
            content: [
                "Enterprise-grade encryption for data in transit and at rest",
                "Row-level security ensuring users only access their own data",
                "Regular security audits and vulnerability assessments",
                "Secure authentication through trusted providers",
                "Automatic session management and timeout"
            ]
        },
        {
            icon: UserCheck,
            title: "Your Rights",
            content: [
                "Access your personal data at any time",
                "Request correction of inaccurate information",
                "Delete your account and associated data",
                "Export your expense data",
                "Opt-out of non-essential communications"
            ]
        },
        {
            icon: Shield,
            title: "Data Sharing",
            content: [
                "We never sell your personal information",
                "Data is only shared with your team members as intended",
                "We may use trusted service providers to operate our platform",
                "Legal requests may require disclosure as mandated by law",
                "Aggregated, anonymized data may be used for analytics"
            ]
        },
        {
            icon: Bell,
            title: "Updates to This Policy",
            content: [
                "We may update this policy from time to time",
                "Significant changes will be communicated via email",
                "Continued use after changes implies acceptance",
                "Previous versions are available upon request",
                "Last updated: December 2025"
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
                            <Shield className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Privacy Policy</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Your privacy is important to us. This policy explains how we collect, use, and protect your information when you use PayUp.
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
                        <h2 className="text-xl font-bold mb-3">Questions About Privacy?</h2>
                        <p className="text-muted-foreground mb-4">
                            If you have any questions about our privacy practices, please don&apos;t hesitate to reach out.
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
                            <Link href="/privacy" className="text-sm text-foreground font-medium transition-colors">
                                Privacy
                            </Link>
                            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
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
