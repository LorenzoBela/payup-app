"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Receipt, Users, TrendingUp, Shield, DollarSign, ArrowRight } from "lucide-react";
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
            title: "Auto-Split",
            description: "Automatically split bills fairly"
        },
        {
            icon: TrendingUp,
            title: "Live Dashboard",
            description: "See balances at a glance"
        },
        {
            icon: Shield,
            title: "Secure",
            description: "Protected with encryption"
        },
    ];

    return (
        <div className="min-h-screen bg-background w-full max-w-full overflow-x-hidden">
            {/* Hero Section */}
            <div className="relative px-4 pt-12 pb-8 text-center w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="space-y-6 w-full max-w-full"
                >
                    <div className="flex justify-center">
                        <div className="bg-primary p-3 rounded-2xl">
                            <DollarSign className="w-10 h-10 text-primary-foreground" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-4xl font-bold tracking-tight leading-tight">
                            Split Expenses,<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
                                Stay Connected
                            </span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed px-4">
                            Track spending and settle up with your team, friends, or family — no awkwardness.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-4 w-full max-w-sm mx-auto px-4">
                        <Button size="lg" asChild className="h-14 text-base font-semibold rounded-full w-full">
                            <Link href="/register">
                                Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild className="h-14 text-base font-semibold rounded-full w-full">
                            <Link href="/signin">Sign In</Link>
                        </Button>
                    </div>
                </motion.div>
            </div>

            {/* Stats */}
            <div className="px-4 py-8 w-full">
                <div className="grid grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-3xl font-bold text-primary">{stats.teamCount.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground mt-1">Teams</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-3xl font-bold text-primary">{stats.userCount.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground mt-1">Users</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Features */}
            <div className="px-4 py-8 w-full">
                <h2 className="text-2xl font-bold text-center mb-6">Everything You Need</h2>
                <div className="grid grid-cols-2 gap-4">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="h-full">
                                <CardContent className="pt-6 text-center">
                                    <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <feature.icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="font-semibold mb-1 text-sm">{feature.title}</h3>
                                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* How It Works */}
            <div className="px-4 py-8 bg-secondary/20 w-full">
                <h2 className="text-2xl font-bold text-center mb-6">How It Works</h2>
                <div className="space-y-4 max-w-md mx-auto">
                    {["Create a team", "Add expenses", "Settle up"].map((step, index) => (
                        <div key={index} className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shrink-0">
                                {index + 1}
                            </div>
                            <p className="text-lg font-medium">{step}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="px-4 py-12 text-center w-full">
                <h2 className="text-3xl font-bold mb-4">Ready to PayUp?</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto px-4">
                    Join thousands managing their expenses the smart way
                </p>
                <div className="max-w-xs mx-auto">
                    <Button size="lg" asChild className="h-14 px-8 text-base font-semibold rounded-full w-full">
                        <Link href="/register">Get Started Now</Link>
                    </Button>
                </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-6 border-t text-center w-full">
                <p className="text-sm text-muted-foreground mb-4">© 2025 PayUp</p>
                <div className="flex justify-center gap-6 text-sm flex-wrap">
                    <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                        Privacy
                    </Link>
                    <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                        Terms
                    </Link>
                    <Link href="/contact" className="text-muted-foreground hover:text-foreground">
                        Contact
                    </Link>
                </div>
            </div>
        </div>
    );
}
