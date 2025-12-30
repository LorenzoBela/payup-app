"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, Receipt, TrendingUp, CheckCircle, Shield, ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { LandingStats } from "@/components/landing-stats";
import { ScrollFadeSection } from "@/components/scroll-fade-section";

interface StatsData {
    teamCount: number;
    userCount: number;
    expenseCount: number;
    totalExpenseAmount: number;
}

export function LandingPageClient({ stats }: { stats: StatsData }) {
    const { scrollYProgress } = useScroll();
    const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

    const fadeInUp = {
        initial: { opacity: 0, y: 60 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }
    };

    const stagger = {
        animate: {
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary selection:text-primary-foreground">
            {/* Header */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: "circOut" }}
                className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-md"
            >
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary p-1.5 rounded-lg">
                            <DollarSign className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">PayUp</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            Features
                        </Link>
                        <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            How It Works
                        </Link>
                        <Link href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            About
                        </Link>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Link href="/signin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                            Sign In
                        </Link>
                        <Button asChild size="sm" className="rounded-full px-6 font-medium bg-primary hover:bg-primary/90 text-primary-foreground">
                            <Link href="/register">Get Started</Link>
                        </Button>
                    </div>
                </div>
            </motion.header>

            {/* Hero Section */}
            <section className="relative min-h-screen flex flex-col justify-between pt-24 px-6 border-b border-border bg-background overflow-hidden">
                <div className="container mx-auto max-w-[1400px] relative flex-1 flex flex-col justify-center">
                    {/* Technical Accents */}
                    <div className="absolute top-0 left-0 w-[1px] h-32 bg-border -mt-32 hidden md:block" />
                    <div className="absolute top-0 right-0 w-[1px] h-32 bg-border -mt-32 hidden md:block" />

                    <motion.div
                        initial="initial"
                        animate="animate"
                        variants={stagger}
                        className="space-y-12 text-left relative z-10"
                    >
                        <motion.div variants={fadeInUp} className="flex justify-start items-center gap-4">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-none border border-primary/20 text-xs font-mono uppercase tracking-widest text-primary bg-primary/5">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                                </span>
                                System Operational
                            </span>
                            <div className="h-[1px] w-24 bg-border" />
                        </motion.div>

                        <motion.h1 variants={fadeInUp} className="text-[12vw] md:text-[8rem] lg:text-[10rem] font-bold tracking-tighter leading-[0.8] text-foreground -ml-1 select-none">
                            SPLIT<br />
                            <span className="text-muted-foreground/20">EXPENSES.</span>
                        </motion.h1>

                        <div className="flex flex-col md:flex-row gap-12 md:items-end justify-between mt-8">
                            <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-muted-foreground max-w-xl leading-relaxed font-light">
                                <span className="text-primary font-mono mr-2">01 //</span>
                                The minimalist settlement protocol for groups. No clutter, just raw tracking efficiency.
                            </motion.p>

                            <motion.div variants={fadeInUp} className="flex flex-col gap-4 min-w-[300px]">
                                <Button size="lg" asChild className="rounded-none px-8 h-16 text-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all flex justify-between group">
                                    <Link href="/register">
                                        Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                    </Link>
                                </Button>
                                <div className="flex gap-4">
                                    <Button size="lg" variant="outline" asChild className="flex-1 rounded-none h-14 border-border hover:bg-secondary/50 text-muted-foreground uppercase tracking-wider text-sm">
                                        <Link href="#how-it-works">How It Works</Link>
                                    </Button>
                                    <Button size="lg" variant="outline" asChild className="flex-1 rounded-none h-14 border-border hover:bg-secondary/50 text-muted-foreground uppercase tracking-wider text-sm">
                                        <Link href="#features">Features</Link>
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>

                <div className="w-full border-t border-border">
                    <LandingStats initialStats={stats} />
                </div>
            </section>

            {/* Features Section - Vooma Style Vertical List */}
            <section id="features" className="py-24 md:py-32 relative bg-background">
                <div className="container mx-auto px-6 max-w-6xl">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="mb-16 md:mb-24"
                    >
                        <span className="block text-primary font-mono text-sm tracking-wider uppercase mb-4">Features</span>
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-none">Everything you need.<br />Nothing you don't.</h2>
                    </motion.div>

                    <div className="flex flex-col border-t border-border">
                        {features.map((feature, index) => (
                            <FeatureRow key={index} feature={feature} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <ScrollFadeSection id="how-it-works" className="py-24 md:py-32 bg-background border-t border-border">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-left mb-20 max-w-4xl"
                    >
                        <span className="block text-primary font-mono text-sm tracking-wider uppercase mb-4">Process</span>
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-none">Simple steps.<br />Instant results.</h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-12 md:gap-8 max-w-6xl mx-auto">
                        {steps.map((step, index) => (
                            <StepCard key={index} step={step} index={index} />
                        ))}
                    </div>
                </div>
            </ScrollFadeSection>

            {/* CTA Section */}
            <section className="py-24 md:py-32 relative overflow-hidden bg-background border-t border-border">
                <div className="container mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-5xl md:text-8xl font-bold mb-8 tracking-tighter">
                            Ready?
                        </h2>
                        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
                            Join thousands managing expenses the smart way.
                        </p>
                        <Button size="lg" asChild className="rounded-none px-12 h-16 text-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all">
                            <Link href="/register">Get Started</Link>
                        </Button>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border py-12 bg-background">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary p-1 rounded-none">
                                <DollarSign className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <span className="text-lg font-bold tracking-tight">PayUp</span>
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">
                            © 2025 PayUp.
                        </p>
                        <div className="flex gap-8">
                            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                                Privacy
                            </Link>
                            <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                                Terms
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

interface Feature {
    icon: LucideIcon;
    title: string;
    description: string;
}

interface Step {
    title: string;
    description: string;
}

function FeatureRow({ feature, index }: { feature: Feature, index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group py-12 border-b border-border flex flex-col md:flex-row gap-8 md:items-center justify-between hover:bg-secondary/5 transition-colors px-4 -mx-4 rounded-xl md:rounded-none md:mx-0 md:px-0"
        >
            <div className="flex flex-col gap-4 max-w-2xl">
                <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors flex items-center gap-4">
                    {feature.title} <ArrowRight className="w-6 h-6 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                    {feature.description}
                </p>
            </div>
            <div className="shrink-0 text-muted-foreground/30 group-hover:text-primary/20 transition-colors">
                <feature.icon className="w-12 h-12 md:w-24 md:h-24 stroke-[1.5]" />
            </div>
        </motion.div>
    );
}

function StepCard({ step, index }: { step: Step, index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            className="text-left relative pl-8 border-l border-border md:border-l-0 md:pl-0 md:text-left"
        >
            <div className="text-6xl font-bold text-muted-foreground/20 mb-6 font-mono">
                0{index + 1}
            </div>
            <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
            <p className="text-muted-foreground leading-relaxed max-w-xs">
                {step.description}
            </p>
        </motion.div>
    );
}

const features = [
    {
        icon: Receipt,
        title: "Easy Tracking",
        description: "Log expenses in seconds. Add amounts, descriptions, categories, and even upload receipts."
    },
    {
        icon: Users,
        title: "Fair Auto-Split",
        description: "Expenses are automatically split equally among your group members. No manual math."
    },
    {
        icon: TrendingUp,
        title: "Real-Time Dashboard",
        description: "See who owes what at a glance. Filter by date, member, or category with beautiful charts."
    },
    {
        icon: CheckCircle,
        title: "Settlement Tracking",
        description: "Mark payments as complete and keep a clear history of all settlements within your group."
    },
    {
        icon: Shield,
        title: "Secure & Private",
        description: "Your data is protected with enterprise-grade encryption and row-level security."
    },
    {
        icon: DollarSign,
        title: "Decimal Precision",
        description: "Money calculations are handled with precision. No rounding errors or confusing cents."
    }
];

const steps = [
    {
        title: "Create a Group",
        description: "Sign up and invite your roommates, friends, or travel buddies. Keep your shared expenses organized."
    },
    {
        title: "Add Expenses",
        description: "Record expenses as they happen. The system automatically calculates who owes what."
    },
    {
        title: "Settle Up",
        description: "When someone pays their share, mark it as complete. Keep track of all balances."
    }
];
