"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, PieChart, TrendingUp, DollarSign, Loader2, Receipt } from "lucide-react";
import { useTeam } from "@/components/dashboard/team-provider";
import { getExpenseStats, getCategoryStats } from "@/app/actions/expenses";
import useSWR from "swr";

// SWR config for reports (doesn't need frequent updates)
const swrConfig = {
    revalidateOnFocus: false,
    dedupingInterval: 30000, // Cache for 30 seconds
    errorRetryCount: 2,
};

export default function ReportsPage() {
    const { selectedTeam, isLoading: teamLoading } = useTeam();

    // Use SWR for caching report data
    const { data: stats, isLoading: statsLoading } = useSWR(
        selectedTeam ? ["expense-stats", selectedTeam.id] : null,
        () => getExpenseStats(selectedTeam!.id),
        swrConfig
    );

    const { data: categories, isLoading: categoriesLoading } = useSWR(
        selectedTeam ? ["category-stats", selectedTeam.id] : null,
        () => getCategoryStats(selectedTeam!.id),
        swrConfig
    );

    const dataLoading = statsLoading || categoriesLoading;

    if (teamLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!selectedTeam) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                <PieChart className="w-12 h-12 text-muted-foreground opacity-50" />
                <h2 className="text-xl font-semibold">No Team Selected</h2>
                <p className="text-muted-foreground">Select a team to view reports.</p>
            </div>
        );
    }

    const safeStats = stats || {
        totalSpent: 0,
        thisMonthSpent: 0,
        avgExpense: 0,
        settlementsCompleted: 0,
        settlementsTotal: 0
    };

    const safeCategories = categories || [];
    const maxCategoryAmount = Math.max(...safeCategories.map(c => c.amount), 1);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                    <p className="text-muted-foreground">Expense analytics and insights</p>
                </div>
                <Button variant="outline" disabled>
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                </Button>
            </div>

            {/* Overview Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {dataLoading ? (
                            <Skeleton className="h-8 w-28" />
                        ) : (
                            <div className="text-2xl font-bold">₱{safeStats.totalSpent.toLocaleString()}</div>
                        )}
                        <p className="text-xs text-muted-foreground">Lifetime expenses</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {dataLoading ? (
                            <Skeleton className="h-8 w-28" />
                        ) : (
                            <div className="text-2xl font-bold">₱{safeStats.thisMonthSpent.toLocaleString()}</div>
                        )}
                        <p className="text-xs text-muted-foreground">This month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Settlements</CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {dataLoading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <div className="text-2xl font-bold">{safeStats.settlementsCompleted} / {safeStats.settlementsTotal}</div>
                        )}
                        <p className="text-xs text-muted-foreground">Settlements paid</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Expense</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {dataLoading ? (
                            <Skeleton className="h-8 w-24" />
                        ) : (
                            <div className="text-2xl font-bold">₱{safeStats.avgExpense.toFixed(2)}</div>
                        )}
                        <p className="text-xs text-muted-foreground">Per transaction</p>
                    </CardContent>
                </Card>
            </div>

            {/* Category Breakdown */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-2 md:col-span-1">
                    <CardHeader>
                        <CardTitle>Spending by Category</CardTitle>
                        <CardDescription>Where your money is going</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {dataLoading ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between">
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-4 w-24" />
                                        </div>
                                        <Skeleton className="h-2 w-full" />
                                    </div>
                                ))}
                            </div>
                        ) : safeCategories.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">No expense data available.</p>
                        ) : (
                            <div className="space-y-4">
                                {safeCategories.map((item) => (
                                    <div key={item.category} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium capitalize">{item.category}</span>
                                            <span className="text-muted-foreground">
                                                ₱{item.amount.toLocaleString()} ({Math.round(item.amount / safeStats.totalSpent * 100) || 0}%)
                                            </span>
                                        </div>
                                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-500"
                                                style={{ width: `${(item.amount / maxCategoryAmount) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activity or Insights placeholder */}
                <Card className="col-span-2 md:col-span-1">
                    <CardHeader>
                        <CardTitle>Insights</CardTitle>
                        <CardDescription>Spending patterns</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <h4 className="font-semibold mb-1">Top Category</h4>
                                {dataLoading ? (
                                    <Skeleton className="h-4 w-full" />
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        {safeCategories.length > 0 ? (
                                            <>
                                                Your highest spending is on <span className="font-medium text-foreground capitalize">{safeCategories[0].category}</span> with ₱{safeCategories[0].amount.toLocaleString()}.
                                            </>
                                        ) : (
                                            "Not enough data to generate insights."
                                        )}
                                    </p>
                                )}
                            </div>
                            {safeCategories.length > 1 && !dataLoading && (
                                <div className="p-4 bg-muted/50 rounded-lg">
                                    <h4 className="font-semibold mb-1">Spending Distribution</h4>
                                    <p className="text-sm text-muted-foreground">
                                        You have expenses in {safeCategories.length} categories. 
                                        {safeStats.settlementsTotal > 0 && (
                                            <> {Math.round((safeStats.settlementsCompleted / safeStats.settlementsTotal) * 100)}% of settlements are completed.</>
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
