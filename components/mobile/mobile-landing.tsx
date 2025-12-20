"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Receipt, Users, TrendingUp, Shield, DollarSign, ArrowRight, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

interface StatsData {
    teamCount: number;
    userCount: number;
    expenseCount: number;
    totalExpenseAmount: number;
}

export function MobileLanding({ stats }: { stats: StatsData }) {
    const features = [
        {
            icon: Receipt,
            title: "Easy Tracking",
            description: "Log expenses in seconds with a tap"
        },
        {
            icon: Users,
            title: "Fair Auto-Split",
            description: "Automatically split bills fairly"
        },
        {
            icon: TrendingUp,
            title: "Real-Time Dashboard",
            description: "See balances at a glance"
        },
        {
            icon: CheckCircle,
            title: "Settlement Tracking",
            description: "Track all payments and settlements"
        },
        {
            icon: Shield,
            title: "Secure & Private",
            description: "Protected with encryption"
        },
        {
            icon: DollarSign,
            title: "Decimal Precision",
            description: "No rounding errors"
        },
    ];

    const steps = [
        {
            title: "Create a Group",
            description: "Sign up and invite your friends or roommates"
        },
        {
            title: "Add Expenses",
            description: "Record expenses as they happen"
        },
        {
            title: "Settle Up",
            description: "Mark payments as complete"
        }
    ];

    const formatCurrency = (value: number) => {
        return `₱${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    };

    const fadeInUp = {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
    };

    const stagger = {
        animate: {
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <div className="min-h-screen bg-background w-full max-w-full overflow-x-hidden">
            {/* Fixed Header */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, ease: "circOut" }}
                className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-md"
            >
                <div className="px-4 py-3 flex items-center justify-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary p-1.5 rounded-lg">
                            <DollarSign className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="text-lg font-bold tracking-tight">PayUp</span>
                    </div>
                </div>
            </motion.header>

            {/* Hero Section */}
            <div className="relative px-4 pt-28 pb-12 text-center w-full">
                {/* Background Gradient Glow */}
                <div className="absolute top-20 left-1/2 -translate-x-1/2 -z-10 w-[400px] h-[400px] opacity-30 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-purple-500/40 rounded-full blur-3xl animate-pulse" />
                </div>

                <motion.div
                    initial="initial"
                    animate="animate"
                    variants={stagger}
                    className="space-y-8 w-full max-w-full"
                >
                    {/* Live Badge */}
                    <motion.div variants={fadeInUp} transition={{ duration: 0.6 }} className="flex justify-center">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-white/10 text-sm font-medium text-secondary-foreground backdrop-blur-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            Split Bills with Anyone
                        </span>
                    </motion.div>

                    <motion.div variants={fadeInUp} transition={{ duration: 0.6, delay: 0.1 }} className="space-y-4">
                        <h1 className="text-5xl font-bold tracking-tight leading-[1.1]">
                            Split Expenses,<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
                                Stay Connected.
                            </span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-sm mx-auto leading-relaxed px-2">
                            Track spending and settle up with your team, friends, or family — no awkwardness.
                        </p>
                    </motion.div>

                    <motion.div variants={fadeInUp} transition={{ duration: 0.6, delay: 0.2 }} className="flex flex-col gap-4 pt-4 w-full max-w-xs mx-auto px-4">
                        <Button
                            size="lg"
                            asChild
                            className="h-14 text-lg font-semibold rounded-full w-full shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                        >
                            <Link href="/register">
                                Start for Free <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            asChild
                            className="h-14 text-lg font-semibold rounded-full w-full border-white/10 transition-all active:scale-[0.98]"
                        >
                            <Link href="/signin">Sign In</Link>
                        </Button>
                    </motion.div>
                </motion.div>
            </div>

            {/* Stats - All 4 with Glassmorphism */}
            <div className="px-4 py-6 w-full">
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: "Active Teams", value: stats.teamCount.toLocaleString() + "+" },
                        { label: "Users", value: stats.userCount.toLocaleString() + "+" },
                        { label: "Expenses Tracked", value: stats.expenseCount.toLocaleString() + "+" },
                        { label: "Total Tracked", value: formatCurrency(stats.totalExpenseAmount) },
                    ].map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
                        >
                            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                                {stat.value}
                            </span>
                            <span className="text-xs text-muted-foreground font-medium text-center mt-1">
                                {stat.label}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Features - All 6 with Enhanced Cards */}
            <div className="px-4 py-8 w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-6"
                >
                    <h2 className="text-2xl font-bold tracking-tight">Everything You Need</h2>
                    <p className="text-sm text-muted-foreground mt-2">Powerful features, intuitive design</p>
                </motion.div>

                <div className="grid grid-cols-2 gap-3">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.08 }}
                            className="group p-4 rounded-2xl bg-card border border-white/5 hover:border-primary/20 transition-all relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10">
                                <div className="bg-secondary/50 w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                                    <feature.icon className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="font-semibold mb-1 text-sm">{feature.title}</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* How It Works - Enhanced */}
            <div className="px-4 pt-10 pb-16 bg-secondary/20 w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-8"
                >
                    <h2 className="text-2xl font-bold tracking-tight">How It Works</h2>
                    <p className="text-sm text-muted-foreground mt-2">Get started in three simple steps</p>
                </motion.div>

                <div className="space-y-5 max-w-sm mx-auto pb-4">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.15 }}
                            className="flex items-start gap-4"
                        >
                            <div className="relative shrink-0">
                                <div className="w-12 h-12 rounded-full bg-secondary/50 border border-white/10 flex items-center justify-center font-bold text-lg">
                                    {index + 1}
                                </div>
                                <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
                            </div>
                            <div className="pt-1">
                                <p className="font-semibold text-base">{step.title}</p>
                                <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* CTA - Enhanced */}
            <div className="px-4 py-14 text-center w-full relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 -z-10" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl font-bold mb-3 tracking-tight">Ready to PayUp?</h2>
                    <p className="text-muted-foreground mb-6 max-w-xs mx-auto text-sm">
                        Join thousands managing their expenses the smart way
                    </p>
                    <div className="max-w-xs mx-auto">
                        <Button
                            size="lg"
                            asChild
                            className="h-14 px-8 text-base font-semibold rounded-full w-full shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                        >
                            <Link href="/register">Get Started Now</Link>
                        </Button>
                    </div>
                </motion.div>
            </div>

            {/* Footer - Enhanced */}
            <footer className="px-4 py-8 border-t border-white/10 w-full">
                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary p-1 rounded-lg">
                            <DollarSign className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="font-bold tracking-tight">PayUp</span>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                        © 2025 PayUp. Built for everyone who shares.
                    </p>
                    <div className="flex justify-center gap-6 text-sm">
                        <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                            Privacy
                        </Link>
                        <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                            Terms
                        </Link>
                        <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                            Contact
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
