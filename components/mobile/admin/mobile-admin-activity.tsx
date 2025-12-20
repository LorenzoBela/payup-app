"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import {
    Activity,
    ChevronLeft,
    ChevronRight,
    Building2,
    User,
    Filter
} from "lucide-react";
import { getAllActivityLogs } from "@/app/actions/admin";

interface ActivityLog {
    id: string;
    action: string;
    details: string;
    createdAt: Date;
    teamName: string;
    teamCode: string;
    userName: string;
    userEmail: string;
}

const getActionColor = (action: string) => {
    if (action.includes("create") || action.includes("add")) {
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    }
    if (action.includes("delete") || action.includes("remove")) {
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    }
    if (action.includes("update") || action.includes("edit")) {
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    }
    if (action.includes("pay") || action.includes("settle")) {
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    }
    return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
};

export function MobileAdminActivity() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const result = await getAllActivityLogs({ page, limit: 20 });
            setLogs(result.logs);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error("Failed to fetch activity logs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page]);

    // Group logs by date
    const groupedLogs = logs.reduce((acc, log) => {
        const date = new Date(log.createdAt);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let key: string;
        if (date.toDateString() === today.toDateString()) {
            key = "Today";
        } else if (date.toDateString() === yesterday.toDateString()) {
            key = "Yesterday";
        } else {
            key = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        }

        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(log);
        return acc;
    }, {} as Record<string, ActivityLog[]>);

    if (isLoading && logs.length === 0) {
        return (
            <div className="space-y-4 p-4">
                <Skeleton className="h-8 w-48" />
                {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Activity className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                    <h1 className="text-xl font-bold">Activity Logs</h1>
                    <p className="text-sm text-muted-foreground">System-wide activity</p>
                </div>
            </div>

            {/* Grouped Activity Feed */}
            {Object.entries(groupedLogs).map(([date, dateLogs]) => (
                <div key={date} className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground sticky top-0 bg-background py-1">
                        {date}
                    </h3>
                    <div className="space-y-2">
                        {dateLogs.map((log) => (
                            <Card key={log.id}>
                                <CardContent className="p-3">
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 bg-muted rounded-full shrink-0 mt-0.5">
                                            <Activity className="w-3 h-3 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <Badge className={`text-[10px] px-1.5 py-0 ${getActionColor(log.action)}`}>
                                                    {log.action.replace(/_/g, " ")}
                                                </Badge>
                                            </div>
                                            <p className="text-sm line-clamp-2 mb-1">{log.details}</p>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {log.userName}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Building2 className="w-3 h-3" />
                                                    {log.teamName}
                                                </span>
                                                <span>
                                                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}

            {logs.length === 0 && !isLoading && (
                <div className="text-center py-12">
                    <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No activity logs found</p>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1 || isLoading}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || isLoading}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
