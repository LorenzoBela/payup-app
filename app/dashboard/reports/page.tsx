"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, PieChart as PieIcon, TrendingUp, DollarSign, Loader2, Receipt, BarChart3, Users, Activity, Target } from "lucide-react";
import { useTeam } from "@/components/dashboard/team-provider";
import { getExpenseStats, getCategoryStats, getMonthlyExpenseHistory, getMemberExpenseStats } from "@/app/actions/expenses";
import useSWR from "swr";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area, RadarChart,
    PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart
} from 'recharts';

// SWR config for reports
const swrConfig = {
    revalidateOnFocus: false,
    dedupingInterval: 30000, // Cache for 30 seconds
    errorRetryCount: 2,
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export default function ReportsPage() {
    const { selectedTeam, isLoading: teamLoading } = useTeam();

    // Fetch existing stats
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

    // Fetch new stats
    const { data: monthlyHistory, isLoading: historyLoading } = useSWR(
        selectedTeam ? ["monthly-history", selectedTeam.id] : null,
        () => getMonthlyExpenseHistory(selectedTeam!.id),
        swrConfig
    );

    const { data: memberStats, isLoading: memberStatsLoading } = useSWR(
        selectedTeam ? ["member-stats", selectedTeam.id] : null,
        () => getMemberExpenseStats(selectedTeam!.id),
        swrConfig
    );

    const isLoading = statsLoading || categoriesLoading || historyLoading || memberStatsLoading;

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
                <PieIcon className="w-12 h-12 text-muted-foreground opacity-50" />
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
    const safeHistory = monthlyHistory || [];
    const safeMemberStats = memberStats || [];

    // Format currency
    const formatCurrency = (val: number) => `₱${val.toLocaleString()}`;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
                    <p className="text-muted-foreground">Comprehensive insights into your team's spending.</p>
                </div>
                <Button variant="outline" disabled>
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                </Button>
            </div>

            {/* Overview Stats Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-28" /> : (
                            <div className="text-2xl font-bold">{formatCurrency(safeStats.totalSpent)}</div>
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
                        {isLoading ? <Skeleton className="h-8 w-28" /> : (
                            <div className="text-2xl font-bold">{formatCurrency(safeStats.thisMonthSpent)}</div>
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
                        {isLoading ? <Skeleton className="h-8 w-20" /> : (
                            <div className="text-2xl font-bold">{safeStats.settlementsCompleted} / {safeStats.settlementsTotal}</div>
                        )}
                        <p className="text-xs text-muted-foreground">Settlements paid</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Expense</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-24" /> : (
                            <div className="text-2xl font-bold">{formatCurrency(safeStats.avgExpense)}</div>
                        )}
                        <p className="text-xs text-muted-foreground">Per transaction</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Monthly Trend Chart */}
                <Card className="col-span-2 lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Spending Trends</CardTitle>
                        <CardDescription>Monthly expenses over the last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {isLoading ? (
                            <div className="h-[300px] flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : safeHistory.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={safeHistory}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `₱${value}`}
                                    />
                                    <Tooltip
                                        formatter={(value: any) => [formatCurrency(Number(value)), "Spent"]}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                No history data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Category Breakdown (Pie Chart) */}
                <Card className="col-span-2 lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Expenses by Category</CardTitle>
                        <CardDescription>Distribution of spending</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-[300px] flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : safeCategories.length > 0 ? (
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={safeCategories}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="amount"
                                            nameKey="category"
                                        >
                                            {safeCategories.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => formatCurrency(Number(value))}
                                            contentStyle={{
                                                backgroundColor: '#1f2937',
                                                border: '1px solid #374151',
                                                borderRadius: '8px',
                                                color: '#f3f4f6'
                                            }}
                                            labelStyle={{ color: '#f3f4f6' }}
                                            itemStyle={{ color: '#f3f4f6' }}
                                        />
                                        <Legend
                                            formatter={(value) => <span className="text-sm">{value}</span>}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                No category data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Additional Charts Row */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Spending Trend Area Chart */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            <div>
                                <CardTitle>Spending Flow</CardTitle>
                                <CardDescription>Cumulative spending visualization</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-[250px] flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : safeHistory.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <AreaChart data={safeHistory}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₱${v}`} />
                                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                    <Area type="monotone" dataKey="total" stroke="#22c55e" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                No spending data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Member Spending Horizontal Bar Chart */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <div>
                                <CardTitle>Member Contributions</CardTitle>
                                <CardDescription>Spending distribution by team member</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-[250px] flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : safeMemberStats.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={safeMemberStats} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₱${v}`} />
                                    <YAxis type="category" dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={80} />
                                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                    <Bar dataKey="amount" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                No member data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Category Radar & Top Spenders Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Category Radar Chart */}
                <Card className="col-span-2 lg:col-span-3">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            <div>
                                <CardTitle>Spending Radar</CardTitle>
                                <CardDescription>Category distribution overview</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-[280px] flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : safeCategories.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <RadarChart data={safeCategories}>
                                    <PolarGrid stroke="#374151" />
                                    <PolarAngleAxis dataKey="category" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                    <Radar name="Amount" dataKey="amount" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.5} />
                                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                                No category data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Insights or Actions */}
                <Card className="col-span-2 lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Insights & Recommendations</CardTitle>
                        <CardDescription>AI-driven analysis of your team's finances</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-lg border p-4 bg-muted/40">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="font-semibold">Spending Trend</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Your spending this month is {safeStats.thisMonthSpent > safeStats.avgExpense ? "higher" : "lower"} than your average transaction size.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border p-4 bg-muted/40">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                                    <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h4 className="font-semibold">Settlement Health</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {safeStats.settlementsTotal > 0
                                            ? `${Math.round((safeStats.settlementsCompleted / safeStats.settlementsTotal) * 100)}% of settlements have been completed.`
                                            : "No settlements to track yet."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border p-4 bg-muted/40">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                                    <PieIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h4 className="font-semibold">Top Category</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {safeCategories.length > 0
                                            ? `Most of your budget goes to ${safeCategories[0].category} (${Math.round((safeCategories[0].amount / safeStats.totalSpent) * 100)}%).`
                                            : "Add expenses to see category insights."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
