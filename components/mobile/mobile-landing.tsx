"use client";

// Force hydrate refresh: v3
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Receipt, Users, TrendingUp, Shield, DollarSign, ArrowRight, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface StatsData {
    teamCount: number;
    userCount: number;
    expenseCount: number;
    totalExpenseAmount: number;
}

export function MobileLanding({ stats }: { stats: StatsData }) {
    const [currentSection, setCurrentSection] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Track scroll position for navigation dots
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollTop = container.scrollTop;
            const sectionHeight = window.innerHeight;
            const section = Math.round(scrollTop / sectionHeight);
            setCurrentSection(section);
        };

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToSection = (index: number) => {
        const container = containerRef.current;
        if (!container) return;
        container.scrollTo({
            top: index * window.innerHeight,
            behavior: "smooth"
        });
    };

    return (
        <div
            ref={containerRef}
            className="snap-container text-white h-screen w-full overflow-y-scroll overflow-x-hidden snap-y snap-mandatory scroll-smooth"
            style={{ backgroundColor: '#000000' }}
            data-lenis-prevent
        >
            {/* Fixed Header */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-md"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
            >
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary p-1.5 rounded-lg">
                            <DollarSign className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-white">PayUp</span>
                    </div>
                    <Button asChild size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium h-9 text-xs px-5">
                        <Link href="/register">Get Started</Link>
                    </Button>
                </div>
            </motion.header>

            {/* Section 1: Hero */}
            <section className="snap-section w-full px-6 pt-20 relative flex flex-col justify-center min-h-screen snap-start">
                <div className="space-y-8 text-left">
                    {/* System Operational Badge - Matches Desktop */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-none border border-primary/20 text-xs font-mono uppercase tracking-widest text-primary bg-primary/5"
                    >
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                        </span>
                        System Operational
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.6 }}
                        className="font-bold tracking-tighter leading-[0.8] text-white -ml-3"
                        style={{ fontSize: '20vw' }}
                    >
                        SPLIT<br />
                        <span className="text-white/20">EXPENSES.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="text-lg text-white/50 leading-relaxed font-light"
                    >
                        <span className="text-primary font-mono mr-2">01 //</span>
                        The minimalist settlement protocol for groups. No clutter, just raw tracking efficiency.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="pt-6 flex flex-col gap-4 w-full"
                    >
                        <Button
                            size="lg"
                            asChild
                            className="h-16 text-lg font-medium rounded-none w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            <Link href="/register">
                                Get Started <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                        </Button>
                        <div className="flex gap-4">
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => scrollToSection(1)}
                                className="flex-1 h-16 text-lg font-medium rounded-none border-primary text-primary hover:bg-primary/10 uppercase tracking-wider"
                            >
                                How It Works
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Section 2: Features */}
            <section className="snap-section w-full px-6 min-h-screen snap-start flex flex-col justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-12"
                >
                    <span className="block text-primary font-mono text-sm tracking-wider uppercase mb-4">Features</span>
                    <h2 className="text-4xl font-bold tracking-tighter leading-none text-white">Everything needed.<br />Nothing you don't.</h2>
                </motion.div>

                <div className="space-y-6">
                    {/* Simplified feature list for mobile space constraints */}
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-6 py-4 border-b border-white/10"
                        >
                            {/* Icon removed to save space and match the cleaner "list" look of desktop features row, or kept minimal? 
                                Desktop has large icons on the right. Let's keep icons but minimal styling.
                             */}
                            <div className="shrink-0 text-primary/80">
                                <feature.icon className="w-8 h-8 stroke-[1.5]" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white mb-1">{feature.title}</h3>
                                <p className="text-sm text-white/50">{feature.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Section 3: How It Works */}
            <section className="snap-section w-full px-6 min-h-screen snap-start flex flex-col justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-12"
                >
                    <span className="block text-primary font-mono text-sm tracking-wider uppercase mb-4">Process</span>
                    <h2 className="text-4xl font-bold tracking-tighter leading-none text-white">Simple steps.<br />Instant results.</h2>
                </motion.div>

                <div className="space-y-10">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.15 }}
                            className="text-left relative pl-6 border-l border-white/10"
                        >
                            <div className="text-4xl font-bold text-white/10 mb-2 font-mono">
                                0{index + 1}
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-white">{step.title}</h3>
                            <p className="text-white/50 leading-relaxed text-sm">{step.description}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Section 4: Stats */}
            <section className="snap-section w-full px-6 min-h-screen snap-start flex flex-col justify-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-12 text-left"
                >
                    <span className="block text-primary font-mono text-sm tracking-wider uppercase mb-4">Impact</span>
                    <h2 className="text-4xl font-bold tracking-tighter leading-none text-white">Growing<br />Fast.</h2>
                </motion.div>

                <div className="grid grid-cols-1 gap-8">
                    <StatBox label="Active Teams" value={stats.teamCount} delay={0} />
                    <StatBox label="Active Users" value={stats.userCount} delay={0.1} />
                    <StatBox label="Total Expenses" value={stats.totalExpenseAmount} delay={0.2} isCurrency />
                </div>
            </section>

            {/* Section 5: CTA & Footer */}
            <section className="snap-section w-full px-6 pt-20 pb-8 min-h-screen snap-start flex flex-col justify-between">
                <div className="flex-1 flex flex-col justify-center space-y-8">
                    <motion.h2
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="text-[12vw] font-bold tracking-tighter text-white leading-[0.8]"
                    >
                        READY?
                    </motion.h2>
                    <p className="text-white/50 text-lg max-w-xs">
                        Join thousands managing expenses the smart way.
                    </p>
                    <Button
                        size="lg"
                        asChild
                        className="h-16 text-lg font-medium rounded-none w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        <Link href="/register">Get Started</Link>
                    </Button>
                </div>

                <div className="border-t border-white/10 pt-8 pb-Safe area space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary p-1 rounded-none">
                                <DollarSign className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <span className="font-bold text-lg text-white">PayUp</span>
                        </div>
                        <span className="text-xs text-white/30 font-mono">© 2025</span>
                    </div>
                    <div className="flex gap-6 text-sm text-white/50 font-medium">
                        <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
                        <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

function StatBox({ label, value, delay, isCurrency }: { label: string, value: number, delay: number, isCurrency?: boolean }) {
    const formatValue = (val: number) => {
        if (isCurrency) return `₱${(val / 1000).toFixed(0)}k`;
        return `${val}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay }}
            className="flex flex-col items-start border-l-2 border-primary/20 pl-6"
        >
            <span className="block text-6xl font-bold text-white mb-1 tracking-tighter loading-none">{formatValue(value)}</span>
            <span className="text-sm text-primary font-mono uppercase tracking-widest">{label}</span>
        </motion.div>
    );
}

const features = [
    { icon: Receipt, title: "Quick Log", description: "Add in seconds." },
    { icon: Users, title: "Fair Split", description: "Math done instantly." },
    { icon: TrendingUp, title: "Real-Time", description: "See who owes what." },
    { icon: Shield, title: "Secure", description: "Encrypted data." },
];

const steps = [
    { title: "Create Group", description: "Invite friends instantly." },
    { title: "Add Expenses", description: "Log costs as they happen." },
    { title: "Settle Up", description: "Pay back and track it." },
];
