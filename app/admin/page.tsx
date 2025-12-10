import { getSystemStats, getRecentActivity } from "@/app/actions/admin";
import { StatsOverview } from "./components/stats-overview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default async function AdminDashboard() {
    const [stats, recentActivity] = await Promise.all([
        getSystemStats(),
        getRecentActivity(10),
    ]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">
                    System-wide overview and administrative controls
                </p>
            </div>

            {/* Stats Overview */}
            <StatsOverview stats={stats} />

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest actions across all teams</CardDescription>
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
                                                {activity.action}
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
    );
}

