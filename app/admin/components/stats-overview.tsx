"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Receipt, Activity } from "lucide-react";

interface SystemStats {
    totalUsers: number;
    totalTeams: number;
    totalExpenses: number;
    totalSettlements: number;
    pendingSettlements: number;
    totalVolume: number;
    superAdminCount: number;
}

interface StatsOverviewProps {
    stats: SystemStats;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
    const statCards = [
        {
            title: "Total Users",
            value: stats.totalUsers,
            subtitle: `${stats.superAdminCount} SuperAdmin${stats.superAdminCount !== 1 ? 's' : ''}`,
            icon: Users,
            color: "text-blue-500",
        },
        {
            title: "Total Teams",
            value: stats.totalTeams,
            subtitle: "Active teams",
            icon: Building2,
            color: "text-green-500",
        },
        {
            title: "Total Expenses",
            value: stats.totalExpenses,
            subtitle: `₱${stats.totalVolume.toLocaleString()} volume`,
            icon: Receipt,
            color: "text-purple-500",
        },
        {
            title: "Settlements",
            value: stats.totalSettlements,
            subtitle: `${stats.pendingSettlements} pending`,
            icon: Activity,
            color: "text-orange-500",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
                <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

