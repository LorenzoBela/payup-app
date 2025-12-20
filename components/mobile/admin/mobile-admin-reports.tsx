"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    BarChart3,
    PieChart,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle,
    Building2,
    DollarSign,
    Receipt,
    RefreshCw
} from "lucide-react";
import { getExpenseAnalytics } from "@/app/actions/admin";

interface CategoryBreakdown {
    category: string;
    amount: number;
    percentage: number;
}

interface TopTeam {
    name: string;
    amount: number;
    count: number;
}

interface SettlementMetrics {
    total: number;
    paid: number;
    pending: number;
    unconfirmed: number;
    settlementRate: number;
    avgDaysToSettle: number;
}

interface Analytics {
    summary: {
        totalExpenses: number;
        totalVolume: number;
        avgExpenseAmount: number;
        dateRange: { start: Date; end: Date };
    };
    categoryBreakdown: CategoryBreakdown[];
    dailyTrends: Array<{ date: string; amount: number }>;
    topTeams: TopTeam[];
    settlementMetrics: SettlementMetrics;
}

const categoryColors: Record<string, string> = {
    food: "bg-orange-500",
    printing: "bg-blue-500",
    supplies: "bg-green-500",
    other: "bg-gray-500",
    transportation: "bg-purple-500",
    utilities: "bg-cyan-500",
};

export function MobileAdminReports() {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<string>("30");

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getExpenseAnalytics({ days: parseInt(dateRange) });
            setAnalytics(result as Analytics);
        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const getCategoryColor = (category: string) => {
        return categoryColors[category.toLowerCase()] || categoryColors.other;
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="text-center py-24 text-muted-foreground">
                Failed to load analytics data
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                        <BarChart3 className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Reports</h1>
                        <p className="text-xs text-muted-foreground">Expense analytics</p>
                    </div>
                </div>
                <Button variant="outline" size="icon" onClick={fetchAnalytics}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Period:</span>
                <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-[130px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="14">Last 14 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="60">Last 60 days</SelectItem>
                        <SelectItem value="90">Last 90 days</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">Volume</span>
                        </div>
                        <p className="text-2xl font-bold">
                            ₱{(analytics.summary.totalVolume / 1000).toFixed(1)}k
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Last {dateRange} days
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Receipt className="w-4 h-4 text-purple-600" />
                            <span className="text-xs text-purple-600 font-medium">Expenses</span>
                        </div>
                        <p className="text-2xl font-bold">{analytics.summary.totalExpenses}</p>
                        <p className="text-xs text-muted-foreground">Transactions</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-blue-600 font-medium">Average</span>
                        </div>
                        <p className="text-2xl font-bold">
                            ₱{analytics.summary.avgExpenseAmount.toFixed(0)}
                        </p>
                        <p className="text-xs text-muted-foreground">Per expense</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10 border-orange-200 dark:border-orange-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-orange-600" />
                            <span className="text-xs text-orange-600 font-medium">Settlement</span>
                        </div>
                        <p className="text-2xl font-bold">{analytics.settlementMetrics.settlementRate}%</p>
                        <p className="text-xs text-muted-foreground">
                            {analytics.settlementMetrics.avgDaysToSettle}d avg
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Category Breakdown */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <PieChart className="w-4 h-4" />
                        Categories
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {analytics.categoryBreakdown.length > 0 ? (
                        analytics.categoryBreakdown.map((cat) => (
                            <div key={cat.category} className="space-y-1.5">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${getCategoryColor(cat.category)}`} />
                                        <span className="font-medium capitalize">{cat.category}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground text-xs">
                                            ₱{cat.amount.toLocaleString()}
                                        </span>
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                            {cat.percentage}%
                                        </Badge>
                                    </div>
                                </div>
                                <Progress value={cat.percentage} className="h-1.5" />
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground py-4 text-sm">
                            No expense data available
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Settlement Metrics */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Settlement Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10">
                            <CheckCircle className="h-6 w-6 text-green-500" />
                            <div>
                                <p className="text-lg font-bold">{analytics.settlementMetrics.paid}</p>
                                <p className="text-xs text-muted-foreground">Paid</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10">
                            <Clock className="h-6 w-6 text-yellow-500" />
                            <div>
                                <p className="text-lg font-bold">{analytics.settlementMetrics.pending}</p>
                                <p className="text-xs text-muted-foreground">Pending</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10">
                            <AlertCircle className="h-6 w-6 text-orange-500" />
                            <div>
                                <p className="text-lg font-bold">{analytics.settlementMetrics.unconfirmed}</p>
                                <p className="text-xs text-muted-foreground">Unconfirmed</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10">
                            <TrendingUp className="h-6 w-6 text-blue-500" />
                            <div>
                                <p className="text-lg font-bold">{analytics.settlementMetrics.avgDaysToSettle}</p>
                                <p className="text-xs text-muted-foreground">Avg Days</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                            <span>Completion Rate</span>
                            <span className="font-medium">{analytics.settlementMetrics.settlementRate}%</span>
                        </div>
                        <Progress value={analytics.settlementMetrics.settlementRate} className="h-2" />
                    </div>
                </CardContent>
            </Card>

            {/* Top Teams */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Top Teams
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {analytics.topTeams.length > 0 ? (
                        <div className="space-y-3">
                            {analytics.topTeams.slice(0, 5).map((team, index) => (
                                <div key={team.name} className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate text-sm">{team.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {team.count} expenses
                                        </p>
                                    </div>
                                    <p className="font-semibold text-sm">
                                        ₱{(team.amount / 1000).toFixed(1)}k
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-4 text-sm">
                            No team data available
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
