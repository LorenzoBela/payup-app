"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface StatsData {
    teamCount: number;
    userCount: number;
    expenseCount: number;
    totalExpenseAmount: number;
}

export function LandingStats({ initialStats }: { initialStats: StatsData }) {
    // We can use the passed stats directly, or fetch if we wanted hydration mismatch handling
    // For now, simple display is fine.

    const fadeInUp = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: "easeOut" }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mt-8 px-4">
            <StatItem
                label="Active Teams"
                value={initialStats.teamCount}
                delay={0.1}
            />
            <StatItem
                label="Users"
                value={initialStats.userCount}
                delay={0.2}
            />
            <StatItem
                label="Expenses Tracked"
                value={initialStats.expenseCount}
                delay={0.3}
            />
            <StatItem
                label="Total Expenses Tracked"
                value={initialStats.totalExpenseAmount}
                delay={0.4}
                isCurrency={true}
            />
        </div>
    );
}

function StatItem({ label, value, delay, isCurrency = false }: { label: string, value: number, delay: number, isCurrency?: boolean }) {
    const formatValue = () => {
        if (isCurrency) {
            return `₱${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
        }
        return `${value.toLocaleString()}${value > 1000 ? "+" : ""}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay, ease: "easeOut" }}
            className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
        >
            <span className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent mb-2">
                {formatValue()}
            </span>
            <span className="text-sm md:text-base text-muted-foreground font-medium text-center">
                {label}
            </span>
        </motion.div>
    );
}
