"use client";

import { motion } from "framer-motion";

interface StatsData {
    teamCount: number;
    userCount: number;
    expenseCount: number;
    totalExpenseAmount: number;
}

export function LandingStats({ initialStats }: { initialStats: StatsData }) {
    return (
        <div className="w-full border-y border-border bg-background/50 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border">
                <StatTickerItem
                    label="Active Teams"
                    value={initialStats.teamCount}
                    delay={0}
                />
                <StatTickerItem
                    label="Total Users"
                    value={initialStats.userCount}
                    delay={0.1}
                />
                <StatTickerItem
                    label="Expenses Logged"
                    value={initialStats.expenseCount}
                    delay={0.2}
                />
                <StatTickerItem
                    label="Volume Processed"
                    value={initialStats.totalExpenseAmount}
                    delay={0.3}
                    isCurrency={true}
                />
            </div>
        </div>
    );
}

function StatTickerItem({ label, value, delay, isCurrency = false }: { label: string, value: number, delay: number, isCurrency?: boolean }) {
    const formatValue = () => {
        if (isCurrency) {
            return `₱${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
        }
        return value.toLocaleString();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay }}
            className="flex-1 px-6 py-4 flex items-center justify-between md:justify-start gap-4 group hover:bg-secondary/5 transition-colors"
        >
            <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-1 group-hover:text-primary transition-colors">
                    {label}
                </span>
                <span className="text-2xl md:text-3xl font-medium font-mono tracking-tight text-foreground flex items-center gap-2">
                    {formatValue()}
                    {/* Pulsing Dot for "Live" feel */}
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                    </span>
                </span>
            </div>
        </motion.div>
    );
}
