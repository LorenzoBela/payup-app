"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    Building2,
    Receipt,
    Activity,
    TrendingUp,
    TrendingDown,
    Clock,
    CheckCircle,
    AlertCircle,
    DollarSign,
    Calendar
} from "lucide-react";

interface AdvancedStats {
    totalUsers: number;
    totalTeams: number;
    totalExpenses: number;
    pendingSettlements: number;
    unconfirmedSettlements: number;
    paidSettlements: number;
    totalSettlements: number;
    usersThisWeek: number;
    teamsThisWeek: number;
    expensesThisWeek: number;
    settlementsThisWeek: number;
    userGrowth: number;
    teamGrowth: number;
    expenseGrowth: number;
    settlementGrowth: number;
    volumeThisWeek: number;
    volumeLastWeek: number;
    volumeThisMonth: number;
    volumeGrowth: number;
    expensesToday: number;
    settlementsToday: number;
}

interface AdvancedStatsOverviewProps {
    stats: AdvancedStats | null;
}

function GrowthIndicator({ value, label }: { value: number; label?: string }) {
    if (value === 0) {
        return <span className="text-xs text-muted-foreground">{label || "No change"}</span>;
    }

    const isPositive = value > 0;
    return (
        <span className={`text-xs flex items-center gap-1 ${isPositive ? "text-green-500" : "text-red-500"}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositive ? "+" : ""}{value}% {label || "vs last week"}
        </span>
    );
}

export function AdvancedStatsOverview({ stats }: AdvancedStatsOverviewProps) {
    if (!stats) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Failed to load statistics
            </div>
        );
    }

    const primaryCards = [
        {
            title: "Total Users",
            value: stats.totalUsers,
            subtitle: `+${stats.usersThisWeek} this week`,
            growth: stats.userGrowth,
            icon: Users,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
        },
        {
            title: "Total Teams",
            value: stats.totalTeams,
            subtitle: `+${stats.teamsThisWeek} this week`,
            growth: stats.teamGrowth,
            icon: Building2,
            color: "text-green-500",
            bgColor: "bg-green-500/10",
        },
        {
            title: "Total Expenses",
            value: stats.totalExpenses,
            subtitle: `+${stats.expensesThisWeek} this week`,
            growth: stats.expenseGrowth,
            icon: Receipt,
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
        },
        {
            title: "Total Settlements",
            value: stats.totalSettlements,
            subtitle: `+${stats.settlementsThisWeek} this week`,
            growth: stats.settlementGrowth,
            icon: Activity,
            color: "text-orange-500",
            bgColor: "bg-orange-500/10",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Primary Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {primaryCards.map((stat) => (
                    <Card key={stat.title} className="relative overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                            <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                                <GrowthIndicator value={stat.growth} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Secondary Stats Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Volume Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Weekly Volume</CardTitle>
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                            <DollarSign className="h-4 w-4 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₱{stats.volumeThisWeek.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-muted-foreground">
                                ₱{stats.volumeThisMonth.toLocaleString()} this month
                            </p>
                            <GrowthIndicator value={stats.volumeGrowth} />
                        </div>
                    </CardContent>
                </Card>

                {/* Today's Activity */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today&apos;s Activity</CardTitle>
                        <div className="p-2 rounded-lg bg-cyan-500/10">
                            <Calendar className="h-4 w-4 text-cyan-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div>
                                <div className="text-2xl font-bold">{stats.expensesToday}</div>
                                <p className="text-xs text-muted-foreground">Expenses</p>
                            </div>
                            <div className="h-8 w-px bg-border" />
                            <div>
                                <div className="text-2xl font-bold">{stats.settlementsToday}</div>
                                <p className="text-xs text-muted-foreground">Settlements</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Settlement Status Breakdown */}
                <Card className="md:col-span-2 lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Settlement Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded bg-yellow-500/10">
                                    <Clock className="h-3 w-3 text-yellow-500" />
                                </div>
                                <div>
                                    <div className="text-lg font-bold">{stats.pendingSettlements}</div>
                                    <p className="text-xs text-muted-foreground">Pending</p>
                                </div>
                            </div>
                            <div className="hidden sm:block h-8 w-px bg-border" />
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded bg-orange-500/10">
                                    <AlertCircle className="h-3 w-3 text-orange-500" />
                                </div>
                                <div>
                                    <div className="text-lg font-bold">{stats.unconfirmedSettlements}</div>
                                    <p className="text-xs text-muted-foreground">Unconfirmed</p>
                                </div>
                            </div>
                            <div className="hidden sm:block h-8 w-px bg-border" />
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded bg-green-500/10">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                </div>
                                <div>
                                    <div className="text-lg font-bold">{stats.paidSettlements}</div>
                                    <p className="text-xs text-muted-foreground">Paid</p>
                                </div>
                            </div>
                            <div className="flex-1" />
                            <Badge variant="outline" className="text-sm">
                                {stats.totalSettlements > 0
                                    ? `${Math.round((stats.paidSettlements / stats.totalSettlements) * 100)}%`
                                    : "0%"
                                } completion rate
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
