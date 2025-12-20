"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
    Users,
    Building2,
    Receipt,
    Activity,
    BarChart3,
    ArrowRight,
    DollarSign,
    TrendingUp,
    Clock,
    Shield,
    Check,
    ChevronRight
} from "lucide-react";
import { getAdvancedStats, getRecentActivity } from "@/app/actions/admin";

// Match the actual return type from getAdvancedStats
type Stats = Awaited<ReturnType<typeof getAdvancedStats>>;

interface ActivityItem {
    id: string;
    action: string;
    details: string;
    createdAt: Date;
    teamName: string;
    userName: string;
}

export function MobileAdminDashboard() {
    const [stats, setStats] = useState<Stats>(null);
    const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, activityData] = await Promise.all([
                    getAdvancedStats(),
                    getRecentActivity(5),
                ]);
                setStats(statsData);
                setRecentActivity(activityData);
            } catch (error) {
                console.error("Failed to fetch admin data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const quickActions = [
        { href: "/admin/users", label: "Users", icon: Users, color: "bg-blue-500" },
        { href: "/admin/teams", label: "Teams", icon: Building2, color: "bg-green-500" },
        { href: "/admin/transactions", label: "Transactions", icon: Receipt, color: "bg-purple-500" },
        { href: "/admin/activity", label: "Activity", icon: Activity, color: "bg-orange-500" },
        { href: "/admin/reports", label: "Reports", icon: BarChart3, color: "bg-pink-500" },
    ];

    if (isLoading) {
        return (
            <div className="space-y-4 p-4">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold">Admin Dashboard</h1>
                    <p className="text-sm text-muted-foreground">System Overview</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-blue-600 font-medium">Users</span>
                        </div>
                        <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                        <p className="text-xs text-muted-foreground">
                            +{stats?.usersThisWeek || 0} this week
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">Teams</span>
                        </div>
                        <p className="text-2xl font-bold">{stats?.totalTeams || 0}</p>
                        <p className="text-xs text-muted-foreground">
                            +{stats?.teamsThisWeek || 0} this week
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Receipt className="w-4 h-4 text-purple-600" />
                            <span className="text-xs text-purple-600 font-medium">Expenses</span>
                        </div>
                        <p className="text-2xl font-bold">{stats?.totalExpenses || 0}</p>
                        <p className="text-xs text-muted-foreground">
                            +{stats?.expensesThisWeek || 0} this week
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10 border-orange-200 dark:border-orange-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-orange-600" />
                            <span className="text-xs text-orange-600 font-medium">Volume</span>
                        </div>
                        <p className="text-2xl font-bold">
                            ₱{(((stats?.volumeThisMonth as number) || 0) / 1000).toFixed(1)}k
                        </p>
                        <p className="text-xs text-muted-foreground">This month</p>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Alert */}
            {(stats?.pendingSettlements ?? 0) > 0 && (
                <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-yellow-200 dark:bg-yellow-800 rounded-full">
                            <Clock className="w-4 h-4 text-yellow-700 dark:text-yellow-200" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-yellow-900 dark:text-yellow-100">
                                {stats?.pendingSettlements} Pending Settlements
                            </p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300">
                                Awaiting payment confirmation
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quick Actions */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <Link key={action.href} href={action.href}>
                                    <Button
                                        variant="outline"
                                        className="flex-col h-auto py-4 px-5 min-w-[80px] gap-2 shrink-0"
                                    >
                                        <div className={`p-2 rounded-lg ${action.color} text-white`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs">{action.label}</span>
                                    </Button>
                                </Link>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
                <CardHeader className="pb-2 flex-row items-center justify-between">
                    <CardTitle className="text-base">Recent Activity</CardTitle>
                    <Link href="/admin/activity">
                        <Button variant="ghost" size="sm" className="gap-1 text-xs h-8">
                            View All
                            <ChevronRight className="w-3 h-3" />
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                    {recentActivity.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                            No recent activity
                        </p>
                    ) : (
                        recentActivity.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0"
                            >
                                <div className="p-1.5 bg-muted rounded-full shrink-0 mt-0.5">
                                    <Activity className="w-3 h-3 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                            {activity.action.replace(/_/g, " ")}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground">
                                            in {activity.teamName}
                                        </span>
                                    </div>
                                    <p className="text-sm text-foreground line-clamp-1">
                                        {activity.details}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {activity.userName} • {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Weekly Growth Card */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Weekly Growth</p>
                            <p className="text-2xl font-bold flex items-center gap-2">
                                {stats?.volumeGrowth || 0}%
                                <TrendingUp className={`w-5 h-5 ${(stats?.volumeGrowth || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground">This Week</p>
                            <p className="font-semibold">₱{((stats?.volumeThisWeek as number) || 0).toLocaleString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
