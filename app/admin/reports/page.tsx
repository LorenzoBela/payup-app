"use client";

import { useEffect, useState, useCallback } from "react";
import { getExpenseAnalytics } from "@/app/actions/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
    Loader2,
    BarChart3,
    PieChart,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle,
    Building2,
    DollarSign,
    Calendar,
    Receipt
} from "lucide-react";

interface CategoryBreakdown {
    category: string;
    amount: number;
    percentage: number;
}

interface DailyTrend {
    date: string;
    amount: number;
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
    dailyTrends: DailyTrend[];
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

export default function AdminReportsPage() {
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
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

    const maxDailyAmount = Math.max(...analytics.dailyTrends.map(d => d.amount), 1);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
                    <p className="text-muted-foreground">
                        System-wide expense and settlement analytics
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Date Range:</span>
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-[140px]">
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
                    <Button variant="outline" onClick={fetchAnalytics}>
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₱{analytics.summary.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Last {dateRange} days
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.summary.totalExpenses}</div>
                        <p className="text-xs text-muted-foreground">
                            Transaction count
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Expense</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₱{analytics.summary.avgExpenseAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Per transaction
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Settlement Rate</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.settlementMetrics.settlementRate}%</div>
                        <p className="text-xs text-muted-foreground">
                            {analytics.settlementMetrics.avgDaysToSettle} days avg
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Category Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5" />
                            Expense Categories
                        </CardTitle>
                        <CardDescription>
                            Breakdown by expense category
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analytics.categoryBreakdown.length > 0 ? (
                            <div className="space-y-4">
                                {analytics.categoryBreakdown.map((cat) => (
                                    <div key={cat.category} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${getCategoryColor(cat.category)}`} />
                                                <span className="font-medium capitalize">{cat.category}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground">
                                                    ₱{cat.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                                <Badge variant="outline">{cat.percentage}%</Badge>
                                            </div>
                                        </div>
                                        <Progress value={cat.percentage} className="h-2" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">
                                No expense data available
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Settlement Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Settlement Metrics
                        </CardTitle>
                        <CardDescription>
                            Payment status breakdown
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10">
                                <CheckCircle className="h-8 w-8 text-green-500" />
                                <div>
                                    <p className="text-2xl font-bold">{analytics.settlementMetrics.paid}</p>
                                    <p className="text-sm text-muted-foreground">Paid</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10">
                                <Clock className="h-8 w-8 text-yellow-500" />
                                <div>
                                    <p className="text-2xl font-bold">{analytics.settlementMetrics.pending}</p>
                                    <p className="text-sm text-muted-foreground">Pending</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-orange-500/10">
                                <AlertCircle className="h-8 w-8 text-orange-500" />
                                <div>
                                    <p className="text-2xl font-bold">{analytics.settlementMetrics.unconfirmed}</p>
                                    <p className="text-sm text-muted-foreground">Unconfirmed</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-500/10">
                                <Calendar className="h-8 w-8 text-blue-500" />
                                <div>
                                    <p className="text-2xl font-bold">{analytics.settlementMetrics.avgDaysToSettle}</p>
                                    <p className="text-sm text-muted-foreground">Avg Days</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Overall Completion Rate</span>
                                <span className="font-medium">{analytics.settlementMetrics.settlementRate}%</span>
                            </div>
                            <Progress value={analytics.settlementMetrics.settlementRate} className="h-3" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Second Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Daily Trends */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Daily Expense Trend
                        </CardTitle>
                        <CardDescription>
                            Expense volume over time
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analytics.dailyTrends.length > 0 ? (
                            <div className="space-y-2">
                                {analytics.dailyTrends.slice(-14).map((trend) => {
                                    const percentage = (trend.amount / maxDailyAmount) * 100;
                                    const date = new Date(trend.date);
                                    const formattedDate = date.toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric'
                                    });

                                    return (
                                        <div key={trend.date} className="flex items-center gap-3">
                                            <span className="text-xs text-muted-foreground w-16">
                                                {formattedDate}
                                            </span>
                                            <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all rounded"
                                                    style={{ width: `${Math.max(percentage, 2)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium w-20 text-right">
                                                ₱{trend.amount.toLocaleString()}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">
                                No trend data available
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Top Teams */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Top Teams by Volume
                        </CardTitle>
                        <CardDescription>
                            Teams with highest expense totals
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analytics.topTeams.length > 0 ? (
                            <div className="space-y-4">
                                {analytics.topTeams.slice(0, 8).map((team, index) => (
                                    <div key={team.name} className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{team.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {team.count} expenses
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">
                                                ₱{team.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">
                                No team data available
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
