import { getAdvancedStats, getRecentActivity } from "@/app/actions/admin";
import { AdvancedStatsOverview } from "./components/stats-overview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import {
    Users,
    Building2,
    Receipt,
    Activity,
    BarChart3,
    ArrowRight,
    Eye
} from "lucide-react";

export default async function AdminDashboard() {
    const [stats, recentActivity] = await Promise.all([
        getAdvancedStats(),
        getRecentActivity(10),
    ]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">
                        System-wide overview and administrative controls
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/reports">
                        <Button variant="outline" className="gap-2">
                            <BarChart3 className="h-4 w-4" />
                            View Reports
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Overview */}
            <AdvancedStatsOverview stats={stats} />

            {/* Quick Actions & Recent Activity Row */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Navigate to management pages</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link href="/admin/users" className="block">
                            <Button variant="outline" className="w-full justify-between">
                                <span className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Manage Users
                                </span>
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/admin/teams" className="block">
                            <Button variant="outline" className="w-full justify-between">
                                <span className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    Manage Teams
                                </span>
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/admin/transactions" className="block">
                            <Button variant="outline" className="w-full justify-between">
                                <span className="flex items-center gap-2">
                                    <Receipt className="h-4 w-4" />
                                    View Transactions
                                </span>
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/admin/activity" className="block">
                            <Button variant="outline" className="w-full justify-between">
                                <span className="flex items-center gap-2">
                                    <Activity className="h-4 w-4" />
                                    Activity Logs
                                </span>
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/admin/reports" className="block">
                            <Button variant="outline" className="w-full justify-between">
                                <span className="flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4" />
                                    View Reports
                                </span>
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Latest actions across all teams</CardDescription>
                        </div>
                        <Link href="/admin/activity">
                            <Button variant="ghost" size="sm" className="gap-1">
                                <Eye className="h-4 w-4" />
                                View All
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {recentActivity.length > 0 ? (
                            <div className="space-y-4">
                                {recentActivity.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="flex items-start justify-between gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="text-xs">
                                                    {activity.action.replace(/_/g, " ")}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    in {activity.teamName}
                                                </span>
                                            </div>
                                            <p className="text-sm text-foreground truncate">
                                                {activity.details}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                by {activity.userName}
                                            </p>
                                        </div>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No recent activity
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
